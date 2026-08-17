#!/usr/bin/env python3
"""Pull last 90 days of email from Anuj's Outlook where sender or recipient
is @emirates.com or @etihad.ae. Writes:
  - src/data-vendor/emails/{EK,EY,G9}/emails.json      (message metadata + snippets)
  - src/data-vendor/emails/{EK,EY,G9}/digests.json     (full bodies + attachment
                                                        text; local-only, gitignored)
  - src/data-vendor/emails/{EK,EY,G9}/attachments/     (downloaded attachments)
  - src/data/updates.json                              (appended, dedup by id)

Reuses tokens from ~/.openclaw/credentials/microsoft-graph.json.
Refresh happens automatically if the access token is close to expiry.
"""

from __future__ import annotations

import base64
import io
import json
import os
import re
import ssl
import sys
import urllib.parse
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from html.parser import HTMLParser
from pathlib import Path

CREDS_PATH = Path.home() / ".openclaw" / "credentials" / "microsoft-graph.json"
GRAPH = "https://graph.microsoft.com/v1.0"
REPO_ROOT = Path(__file__).resolve().parent.parent
EMAIL_DIR = REPO_ROOT / "src" / "data-vendor" / "emails"
UPDATES_PATH = REPO_ROOT / "src" / "data" / "updates.json"

DOMAINS = {
    "EK": "emirates.com",
    "EY": "etihad.ae",
    "G9": "airarabia.com",
}

# Per-BD onboarding: EMAIL_USER=<id> switches creds + carrier domains.
# Default (unset) is Anuj, unchanged. Pull is read-only (Graph search/get).
# Mail is stored per owner (emails/<owner>/<IATA>) so a BD's local thread on a
# globally-owned carrier never overwrites the global owner's mail. Attribution is
# relationship-owned: a BD's pull is attributed to that BD (see cluster_topics).
USER_DOMAINS = {
    "anuj": {"EK": "emirates.com", "EY": "etihad.ae", "G9": "airarabia.com"},
    "nabil": {
        "SV": "saudia.com", "XY": "flynas.com", "F3": "flyadeal.com",
        "PK": "pakistaninternational.com", "PF": "airsial.com", "PA": "airblue.com",
        "EY": "etihad.ae",  # EY local Saudi relationship is Nabil's
    },
}
_email_user = os.environ.get("EMAIL_USER", "")
OWNER = _email_user if _email_user in USER_DOMAINS else "anuj"
if _email_user in USER_DOMAINS:
    DOMAINS = USER_DOMAINS[_email_user]
    CREDS_PATH = Path.home() / ".openclaw" / "credentials" / f"microsoft-graph-{_email_user}.json"


def email_dir(iata: str) -> Path:
    return EMAIL_DIR / OWNER / iata
DAYS_BACK = 90

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def refresh_if_needed(creds):
    now = datetime.now(timezone.utc).timestamp()
    if now < creds.get("token_expires_at", 0):
        return creds
    url = f"https://login.microsoftonline.com/{creds['tenant_id']}/oauth2/v2.0/token"
    data = urllib.parse.urlencode({
        "client_id": creds["client_id"],
        "refresh_token": creds["refresh_token"],
        "grant_type": "refresh_token",
        "scope": "https://graph.microsoft.com/Mail.Read Calendars.Read offline_access",
    }).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    r = urllib.request.urlopen(req, context=SSL_CTX)
    result = json.loads(r.read())
    creds["access_token"] = result["access_token"]
    creds["refresh_token"] = result.get("refresh_token", creds["refresh_token"])
    creds["token_expires_at"] = int(datetime.now(timezone.utc).timestamp()) + result["expires_in"] - 60
    json.dump(creds, open(CREDS_PATH, "w"), indent=2)
    return creds


def graph_get(url, token):
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    return json.loads(urllib.request.urlopen(req, context=SSL_CTX).read())


def graph_bytes(url, token):
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    return urllib.request.urlopen(req, context=SSL_CTX).read()


def search_domain(token, domain, since_iso, top=200):
    """Broad KQL search — full-text match on the domain string. Graph's
    from:/to:/cc: operators miss forwarded chains, so a plain domain string
    catches everything. Client-side filters by date + real address presence."""
    q = f'"{domain}"'
    params = urllib.parse.urlencode({
        "$search": q,
        "$select": "id,subject,from,toRecipients,ccRecipients,receivedDateTime,bodyPreview,body,hasAttachments,conversationId,internetMessageId,parentFolderId",
        "$top": str(top),
    })
    url = f"{GRAPH}/me/messages?{params}"
    all_msgs = []
    pages = 0
    while url and len(all_msgs) < 1500 and pages < 20:
        req = urllib.request.Request(url)
        req.add_header("Authorization", f"Bearer {token}")
        req.add_header("ConsistencyLevel", "eventual")
        try:
            resp = json.loads(urllib.request.urlopen(req, context=SSL_CTX).read())
        except urllib.error.HTTPError as e:
            print(f"  ! Graph error {e.code}: {e.read().decode()[:200]}")
            break
        pages += 1
        got = resp.get("value", [])
        page_in = 0
        for m in got:
            if m.get("receivedDateTime", "") >= since_iso:
                all_msgs.append(m)
                page_in += 1
        # Stop when a full page comes back with 0 in-window (moved past window)
        if got and page_in == 0:
            break
        url = resp.get("@odata.nextLink")
    return all_msgs


# ─── Body + attachment text extraction ────────────────────────────────────────

BODY_CAP = 4000          # chars of email body kept per message
ATT_TEXT_CAP = 6000      # chars of extracted text kept per attachment
MAX_ATT_BYTES = 8 * 1024 * 1024
MAX_ATTS_PER_THREAD = 12

TEXT_EXTS = {"txt", "csv", "tsv", "xml", "ics", "eml", "log", "htm", "html", "json"}


class _HTMLText(HTMLParser):
    SKIP = {"script", "style", "head"}
    BREAKS = {"br", "p", "div", "tr", "li", "h1", "h2", "h3", "h4"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self._skip += 1
        elif tag in self.BREAKS:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self._skip:
            self._skip -= 1
        elif tag in self.BREAKS:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)


def html_to_text(html: str) -> str:
    p = _HTMLText()
    try:
        p.feed(html)
    except Exception:
        return ""
    text = "".join(p.parts)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    return text.strip()


def body_text(msg: dict) -> str:
    body = msg.get("body") or {}
    content = body.get("content") or ""
    if body.get("contentType") == "text":
        text = content
    else:
        text = html_to_text(content)
    return text[:BODY_CAP]


def _decode(raw: bytes) -> str:
    for enc in ("utf-8", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def _extract_xlsx(raw: bytes) -> str:
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
    out = []
    for sheet in list(wb.worksheets)[:3]:
        rows = []
        for i, row in enumerate(sheet.iter_rows(values_only=True)):
            if i >= 30:
                break
            cells = ["" if c is None else str(c)[:40] for c in row[:15]]
            if any(cells):
                rows.append(" | ".join(cells).strip(" |"))
        if rows:
            out.append(f"[Sheet: {sheet.title}]")
            out.extend(rows)
    wb.close()
    return "\n".join(out)


def _extract_xls(raw: bytes) -> str:
    import xlrd
    wb = xlrd.open_workbook(file_contents=raw)
    out = []
    for sheet in wb.sheets()[:3]:
        rows = []
        for i in range(min(sheet.nrows, 30)):
            cells = [str(sheet.cell_value(i, j))[:40] for j in range(min(sheet.ncols, 15))]
            if any(cells):
                rows.append(" | ".join(cells).strip(" |"))
        if rows:
            out.append(f"[Sheet: {sheet.name}]")
            out.extend(rows)
    return "\n".join(out)


def _extract_csv(raw: bytes) -> str:
    text = _decode(raw)
    lines = [ln for ln in text.splitlines() if ln.strip()][:40]
    return "\n".join(lines)


def _extract_pdf(raw: bytes) -> str:
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(raw))
    out = []
    for page in reader.pages[:10]:
        try:
            out.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(out)


def _extract_docx(raw: bytes) -> str:
    import docx
    d = docx.Document(io.BytesIO(raw))
    out = [p.text for p in d.paragraphs if p.text.strip()]
    for table in d.tables[:5]:
        for row in list(table.rows)[:20]:
            cells = [c.text.strip()[:40] for c in row.cells[:10]]
            if any(cells):
                out.append(" | ".join(cells))
    return "\n".join(out)


def _extract_pptx(raw: bytes) -> str:
    z = zipfile.ZipFile(io.BytesIO(raw))
    slides = sorted(
        (n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)),
        key=lambda n: int(re.search(r"\d+", n).group()),
    )
    out = []
    for n in slides[:15]:
        xml = z.read(n).decode("utf-8", errors="replace")
        texts = re.findall(r"<a:t>([^<]*)</a:t>", xml)
        line = " ".join(t.strip() for t in texts if t.strip())
        if line:
            out.append(line)
    return "\n".join(out)


def extract_text(name: str, raw: bytes) -> str | None:
    """Extract readable text from an attachment; None = type we don't parse
    (images etc.) — caller records name/size only."""
    ext = name.lower().rsplit(".", 1)[-1] if "." in name else ""
    try:
        if ext in TEXT_EXTS:
            if ext in ("htm", "html"):
                return html_to_text(_decode(raw))
            return _extract_csv(raw) if ext in ("csv", "tsv") else _decode(raw)
        if ext in ("xlsx", "xlsm"):
            return _extract_xlsx(raw)
        if ext == "xls":
            return _extract_xls(raw)
        if ext == "pdf":
            return _extract_pdf(raw)
        if ext == "docx":
            return _extract_docx(raw)
        if ext == "pptx":
            return _extract_pptx(raw)
    except Exception as e:
        return f"[unreadable {ext}: {e}]"[:200]
    return None


def list_attachments(token, msg_id):
    resp = graph_get(f"{GRAPH}/me/messages/{msg_id}/attachments", token)
    return resp.get("value", [])


def fetch_attachment_bytes(token, msg_id, att):
    if att.get("contentBytes"):
        return base64.b64decode(att["contentBytes"])
    if (att.get("size") or 0) <= MAX_ATT_BYTES:
        return graph_bytes(f"{GRAPH}/me/messages/{msg_id}/attachments/{att['id']}/$value", token)
    return None


def safe_name(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", name or "attachment")[:120]


def clean(msg, domain):
    frm = msg.get("from", {}).get("emailAddress", {})
    to = [r["emailAddress"] for r in msg.get("toRecipients", [])]
    cc = [r["emailAddress"] for r in msg.get("ccRecipients", [])]
    return {
        "id": msg["id"],
        "subject": msg.get("subject", "").strip(),
        "from": {"name": frm.get("name", ""), "address": (frm.get("address") or "").lower()},
        "to": [{"name": r.get("name", ""), "address": (r.get("address") or "").lower()} for r in to],
        "cc": [{"name": r.get("name", ""), "address": (r.get("address") or "").lower()} for r in cc],
        "receivedDateTime": msg.get("receivedDateTime"),
        "bodyPreview": msg.get("bodyPreview", "").replace("\r", " ").strip()[:1000],
        "_body": body_text(msg),  # full body text → moved to digests.json before write
        "hasAttachments": msg.get("hasAttachments", False),
        "conversationId": msg.get("conversationId"),
        "domain": domain,
    }


def relevant(msg, domain):
    parts = [msg["from"]["address"]] + [x["address"] for x in msg["to"]] + [x["address"] for x in msg["cc"]]
    return any(p.endswith("@" + domain) for p in parts)


def append_updates(new_updates):
    existing = []
    if UPDATES_PATH.exists():
        try:
            existing = json.load(open(UPDATES_PATH))
        except Exception:
            existing = []
    seen = {u["id"] for u in existing}
    added = 0
    for u in new_updates:
        if u["id"] in seen:
            continue
        existing.append(u)
        seen.add(u["id"])
        added += 1
    existing.sort(key=lambda u: u["createdAt"], reverse=True)
    UPDATES_PATH.parent.mkdir(parents=True, exist_ok=True)
    json.dump(existing, open(UPDATES_PATH, "w"), indent=2)
    return added


def to_update_record(msg, iata):
    subj = msg["subject"] or "(no subject)"
    headline = subj[:120]
    parts_from = msg["from"]["name"] or msg["from"]["address"]
    participants = [parts_from] + [r["name"] or r["address"] for r in (msg["to"] + msg["cc"])[:8]]
    return {
        "id": f"email_{msg['id']}",
        "accountIata": iata,
        "createdBy": "graph_pull",
        "createdAt": msg["receivedDateTime"] or datetime.now(timezone.utc).isoformat(),
        "scope": "global",
        "bd": "praveen",   # EK & EY are Praveen's accounts
        "headline": headline,
        "detail": msg["bodyPreview"][:400],
        "isChild": False,
        "source": "outlook",
        "participants": participants,
        "hasAttachments": msg["hasAttachments"],
    }


def main():
    creds = json.load(open(CREDS_PATH))
    creds = refresh_if_needed(creds)
    token = creds["access_token"]

    since = (datetime.now(timezone.utc) - timedelta(days=DAYS_BACK)).strftime("%Y-%m-%dT%H:%M:%SZ")
    total_new_updates = 0

    for iata, domain in DOMAINS.items():
        print(f"\n─── {iata} · @{domain} · since {since[:10]} ───")
        out_dir = email_dir(iata)
        att_dir = out_dir / "attachments"
        att_dir.mkdir(parents=True, exist_ok=True)

        raw = search_domain(token, domain, since)
        cleaned = [clean(m, domain) for m in raw if relevant(clean(m, domain), domain)]
        print(f"  fetched: {len(cleaned)} relevant messages")

        # dedupe by conversationId — keep newest per thread
        by_conv = {}
        conv_msgs = defaultdict(list)
        for m in cleaned:
            k = m["conversationId"] or m["id"]
            conv_msgs[k].append(m)
            if k not in by_conv or m["receivedDateTime"] > by_conv[k]["receivedDateTime"]:
                by_conv[k] = m
        threads = list(by_conv.values())
        print(f"  {len(threads)} unique threads")

        # Attachments: collect across ALL messages of each thread (not just the
        # newest), dedupe by (name, size), save the file + extract text.
        thread_atts = {}
        n_atts = 0
        for conv_key, msgs in conv_msgs.items():
            atts_by_key = {}
            for m in msgs:
                if not m.get("hasAttachments"):
                    continue
                try:
                    atts = list_attachments(token, m["id"])
                except Exception as e:
                    print(f"  ! att list failed {m['id'][:12]}: {e}")
                    continue
                for a in atts:
                    if len(atts_by_key) >= MAX_ATTS_PER_THREAD:
                        break
                    if a.get("@odata.type") != "#microsoft.graph.fileAttachment":
                        continue
                    key = (a.get("name"), a.get("size"))
                    if key in atts_by_key:
                        continue
                    try:
                        raw_bytes = fetch_attachment_bytes(token, m["id"], a)
                    except Exception as e:
                        print(f"  ! att fetch failed {a.get('name')}: {e}")
                        continue
                    if raw_bytes is None:
                        print(f"  · skipped oversized attachment {a.get('name')}")
                        continue
                    name = safe_name(a.get("name"))
                    out = att_dir / f"{m['id'][:12]}_{name}"
                    if not out.exists():
                        out.write_bytes(raw_bytes)
                    text = extract_text(name, raw_bytes)
                    atts_by_key[key] = {
                        "name": a.get("name") or name,
                        "size": len(raw_bytes),
                        "text": (text[:ATT_TEXT_CAP] if text else None),
                    }
                    n_atts += 1
            if atts_by_key:
                thread_atts[conv_key] = list(atts_by_key.values())
        print(f"  extracted {n_atts} unique attachments")

        # emails.json keeps metadata only; full bodies + attachment text go to
        # digests.json (gitignored — may contain sensitive commercial docs).
        digests = {}
        for m in threads:
            k = m["conversationId"] or m["id"]
            digests[m["id"]] = {
                "body": m.pop("_body", ""),
                "attachments": thread_atts.get(k, []),
            }
            atts = thread_atts.get(k, [])
            if atts:
                m["attachments"] = [{"name": a["name"], "size": a["size"]} for a in atts]
        (out_dir / "digests.json").write_text(json.dumps(digests, indent=2))
        (out_dir / "emails.json").write_text(json.dumps(threads, indent=2))
        updates = [to_update_record(m, iata) for m in threads]
        added = append_updates(updates)
        total_new_updates += added
        print(f"  {added} new updates appended (existing skipped)")

    print(f"\nTotal new updates: {total_new_updates}")
    print(f"Attachments dir:   {EMAIL_DIR}/<owner>/<IATA>/attachments/")


if __name__ == "__main__":
    main()
