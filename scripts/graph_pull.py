#!/usr/bin/env python3
"""Pull last 90 days of email from Anuj's Outlook where sender or recipient
is @emirates.com or @etihad.ae. Writes:
  - src/data-vendor/emails/{EK,EY}/emails.json      (message metadata + snippets)
  - src/data-vendor/emails/{EK,EY}/attachments/     (downloaded attachments)
  - src/data/updates.json                            (appended, dedup by id)

Reuses tokens from ~/.openclaw/credentials/microsoft-graph.json.
Refresh happens automatically if the access token is close to expiry.
"""

from __future__ import annotations

import json
import os
import re
import ssl
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta
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
        "$select": "id,subject,from,toRecipients,ccRecipients,receivedDateTime,bodyPreview,hasAttachments,conversationId,internetMessageId,parentFolderId",
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


def download_attachments(token, msg_id, out_dir):
    url = f"{GRAPH}/me/messages/{msg_id}/attachments"
    resp = graph_get(url, token)
    saved = []
    for a in resp.get("value", []):
        if a.get("@odata.type") != "#microsoft.graph.fileAttachment":
            continue
        name = re.sub(r"[^A-Za-z0-9._-]+", "_", a.get("name", "attachment"))[:120]
        content_b64 = a.get("contentBytes")
        if not content_b64:
            continue
        import base64
        out = out_dir / f"{msg_id[:12]}_{name}"
        out.write_bytes(base64.b64decode(content_b64))
        saved.append(out.name)
    return saved


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
        out_dir = EMAIL_DIR / iata
        att_dir = out_dir / "attachments"
        att_dir.mkdir(parents=True, exist_ok=True)

        raw = search_domain(token, domain, since)
        cleaned = [clean(m, domain) for m in raw if relevant(clean(m, domain), domain)]
        print(f"  fetched: {len(cleaned)} relevant messages")

        # dedupe by conversationId — keep newest per thread
        by_conv = {}
        for m in cleaned:
            k = m["conversationId"] or m["id"]
            if k not in by_conv or m["receivedDateTime"] > by_conv[k]["receivedDateTime"]:
                by_conv[k] = m
        threads = list(by_conv.values())
        print(f"  {len(threads)} unique threads")

        for m in threads:
            if m["hasAttachments"]:
                try:
                    saved = download_attachments(token, m["id"], att_dir)
                    if saved:
                        m["attachments"] = saved
                except Exception as e:
                    print(f"  ! attachment failed for {m['id'][:12]}: {e}")

        (out_dir / "emails.json").write_text(json.dumps(threads, indent=2))
        updates = [to_update_record(m, iata) for m in threads]
        added = append_updates(updates)
        total_new_updates += added
        print(f"  {added} new updates appended (existing skipped)")

    print(f"\nTotal new updates: {total_new_updates}")
    print(f"Attachments dir:   {EMAIL_DIR}/<IATA>/attachments/")


if __name__ == "__main__":
    main()
