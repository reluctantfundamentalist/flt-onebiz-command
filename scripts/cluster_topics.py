#!/usr/bin/env python3
"""Cluster pulled Outlook threads into named topics with executive summaries,
status, next steps, and stakeholder edges. Uses the Anthropic Claude API via
the ANTHROPIC_AUTH_TOKEN + ANTHROPIC_BASE_URL env vars (Trip.com's proxy).

Reads:  src/data-vendor/emails/<IATA>/emails.json
Writes: src/data-vendor/emails/<IATA>/topics.json
        src/data/updates.json  (rewritten — one record per topic)
        src/data/participants.json  (co-occurrence edges for hierarchy)
"""

from __future__ import annotations

import json
import os
import re
import ssl
import sys
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EMAIL_DIR = REPO_ROOT / "src" / "data-vendor" / "emails"
UPDATES_PATH = REPO_ROOT / "src" / "data" / "updates.json"
PARTICIPANTS_PATH = REPO_ROOT / "src" / "data" / "participants.json"

# Per-owner config mirrors graph_pull. EMAIL_USER=<id> selects whose mail to
# cluster; default is Anuj. Mail lives under emails/<owner>/<IATA>/.
USER_DOMAINS = {
    "anuj": {"EK": "emirates.com", "EY": "etihad.ae", "G9": "airarabia.com"},
    "nabil": {
        "SV": "saudia.com", "XY": "flynas.com", "F3": "flyadeal.com",
        "PK": "pakistaninternational.com", "PF": "airsial.com", "PA": "airblue.com",
        "EY": "etihad.ae",
    },
}
_email_user = os.environ.get("EMAIL_USER", "")
OWNER = _email_user if _email_user in USER_DOMAINS else "anuj"

# Domain -> IATA for the active owner.
DOMAINS = {v: k for k, v in USER_DOMAINS[OWNER].items()}

# Relationship-owned attribution: a BD's pull is attributed to that BD (his
# relationships, including local offices of globally-owned carriers). The
# director's (Anuj) pull uses the global owner map.
_GLOBAL_BD = {"EK": "praveen", "EY": "praveen", "G9": "praveen"}
if OWNER == "anuj":
    BD_OWNER = dict(_GLOBAL_BD)
else:
    BD_OWNER = {iata: OWNER for iata in DOMAINS.values()}


def email_dir(iata: str) -> Path:
    return EMAIL_DIR / OWNER / iata

# Trip proxy Claude API
API_TOKEN = os.environ.get("ANTHROPIC_AUTH_TOKEN")
API_BASE = os.environ.get("ANTHROPIC_BASE_URL", "https://api.anthropic.com")
MODEL = os.environ.get("ANTHROPIC_DEFAULT_SONNET_MODEL", "claude-sonnet-4-5")

if not API_TOKEN:
    print("ERROR: ANTHROPIC_AUTH_TOKEN not set", file=sys.stderr)
    sys.exit(1)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE


def claude_call(prompt: str, max_tokens: int = 4096) -> str:
    url = f"{API_BASE.rstrip('/')}/v1/messages"
    body = json.dumps({
        "model": MODEL,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("x-api-key", API_TOKEN)
    req.add_header("anthropic-version", "2023-06-01")
    req.add_header("Authorization", f"Bearer {API_TOKEN}")
    try:
        resp = urllib.request.urlopen(req, context=SSL_CTX, timeout=300)
        data = json.loads(resp.read())
        return data["content"][0]["text"]
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:400]
        raise RuntimeError(f"Claude API {e.code}: {body}") from e


# ─── Prep: build a compact per-thread payload for the LLM ─────────────────────

BODY_EXCERPT = 1500      # chars of email body per thread
ATT_EXCERPT = 700        # chars of extracted text per attachment
MAX_ATTS_IN_PROMPT = 3   # attachments excerpted per thread; rest listed by name


def thread_block(t: dict, digest: dict | None) -> str:
    date = (t.get("receivedDateTime") or "")[:10]
    frm = t.get("from", {}).get("name") or t.get("from", {}).get("address") or "?"
    subj = re.sub(r"^\s*(re|fw|fwd|\[external\])[:\s]*", "", (t.get("subject") or "").strip(), flags=re.I).strip()
    body = ((digest or {}).get("body") or t.get("bodyPreview") or "").replace("\n", " ")[:BODY_EXCERPT]
    lines = [f"[{date} · {frm}] {subj}", f"  {body}"]

    atts = (digest or {}).get("attachments") or []
    with_text = sorted((a for a in atts if a.get("text")), key=lambda a: len(a["text"]), reverse=True)
    top = with_text[:MAX_ATTS_IN_PROMPT]
    top_ids = {id(a) for a in top}
    for a in top:
        lines.append(f"  [attachment: {a['name']}]")
        lines.append("  " + a["text"].replace("\n", " | ")[:ATT_EXCERPT])
    for a in atts:
        if id(a) in top_ids:
            continue
        kind = "content not readable" if a.get("text") is None else "excerpt omitted"
        lines.append(f"  [attachment: {a['name']} ({(a.get('size') or 0) // 1024}KB, {kind})]")
    return "\n".join(lines)


def cluster_for_iata(iata: str) -> dict:
    emails_path = email_dir(iata) /"emails.json"
    if not emails_path.exists():
        return {"topics": [], "edges": []}
    threads = json.load(open(emails_path))
    if not threads:
        return {"topics": [], "edges": []}

    digests = {}
    digests_path = email_dir(iata) /"digests.json"
    if digests_path.exists():
        try:
            digests = json.load(open(digests_path))
        except Exception:
            digests = {}

    blocks = {}
    lines = []
    for t in threads:
        block = thread_block(t, digests.get(t["id"]))
        blocks[t["id"]] = block
        lines.append(f"id={t['id'][:20]}")
        lines.append(block)
        lines.append("")

    airline_name = {
        "EK": "Emirates", "EY": "Etihad", "G9": "Air Arabia Group",
        "SV": "Saudia", "XY": "flynas", "F3": "flyadeal",
        "PK": "Pakistan International", "PF": "Air Sial", "PA": "Air Blue",
    }.get(iata, iata)
    prompt = f"""You are structuring commercial-partnership emails between Trip.com and {airline_name}.

Below are {len(threads)} email threads. Each includes subject + email body and, where available, extracted text from the thread's attachments (invoices, incentive/payout sheets, campaign decks etc.). Cluster them into TOPICS. Each topic groups threads that discuss the same commercial workstream.

For each topic produce:
- `name`: 4-8 words, business-friendly (e.g. "Skywards × Trip Coins loyalty integration")
- `summary`: ONE short sentence (max ~20 words) for a leadership reader — the crux: what is happening and why it matters commercially. No background narration, no list of sub-items, no process descriptions.
- `dollarImpact`: {{"amountUsd": number, "note": "3-6 word label", "quote": "the VERBATIM sentence fragment from the thread (body or attachment text) where this exact figure is written"}} ONLY when an explicit monetary figure appears anywhere in the thread — email bodies OR attachment text (invoices, payout/revenue sheets, penalty notes). The quote must be copied word-for-word from the material below; it is mechanically verified and the figure is dropped if it cannot be found. null if no figure is stated. NEVER estimate, extrapolate, sum or invent figures.
- `status`: one of "active" (ongoing conversation in the last 2 weeks), "in_progress" (multi-week workstream still moving), "closed" (concluded), "dormant" (stalled >4 weeks)
- `nextStep`: the concrete next action if one is visible in the threads; else null
- `airlineOwners`: array of participant names from the AIRLINE side (@{list(DOMAINS.keys())[list(DOMAINS.values()).index(iata)]}) most engaged in this topic (top 1-3)
- `tripOwners`: array of Trip.com side participants (typically Anuj Bansal, Kirk Wong, PJ Zhou, Shrey Nayar, or another @trip.com)
- `threadIds`: array of thread ids (use the id= prefix from below) belonging to this topic
- `lastTouched`: ISO date of the most recent thread in the cluster
- `priority`: "high" | "medium" | "low" — high if the topic drives revenue/contracts, medium if operational, low if minor operational value. Noise is never a topic and never prioritized.

Rules:
- Every SUBSTANTIVE thread must land in exactly one topic.
- Auto-replies, out-of-office, and calendar accept/decline threads are NOT topics: drop them entirely — no noise topic, and do not attach their threadIds to any topic.
- Merge aggressively — better 6-10 real topics than 20 thin ones. HARD CAP: 12 topics. If you have more, merge the thinnest related ones — variants of the same workstream (e.g. campaign production, campaign revenue analysis, creative assets) belong in ONE topic.
- Return ONLY JSON, no prose around it. Shape: `{{"topics": [...] }}`

Threads:
{chr(10).join(lines)}
"""
    print(f"  [{iata}] calling Claude for {len(threads)} threads...", flush=True)
    text = claude_call(prompt, max_tokens=8192)
    # Extract JSON
    m = re.search(r"\{[\s\S]*\}", text)
    if not m:
        print(f"  [{iata}] no JSON found in response:")
        print(text[:500])
        return {"topics": [], "edges": []}
    try:
        parsed = json.loads(m.group(0))
    except json.JSONDecodeError as e:
        print(f"  [{iata}] JSON parse error: {e}")
        print(text[:500])
        return {"topics": [], "edges": []}

    topics = parsed.get("topics", [])
    # Resolve short thread ids -> full ids
    id_by_prefix = {t["id"][:20]: t["id"] for t in threads}
    all_src = " ".join(blocks.values())
    for topic in topics:
        topic["threadIds"] = [id_by_prefix.get(tid, tid) for tid in topic.get("threadIds", [])]
        topic["accountIata"] = iata
        src = " ".join(blocks.get(tid, "") for tid in topic["threadIds"])
        topic["dollarImpact"] = clean_dollar_impact(topic.get("dollarImpact"), src, all_src)

    # Participant co-occurrence edges (mechanical)
    edges = compute_edges(iata, threads)
    return {"topics": topics, "edges": edges}


def _norm_text(s: str) -> str:
    return re.sub(r"\s+", "", s).lower()


def _word_overlap(quote: str, source: str) -> float:
    qwords = set(re.findall(r"[a-z0-9$,.]+", quote.lower()))
    if not qwords:
        return 0.0
    swords = set(re.findall(r"[a-z0-9$,.]+", source.lower()))
    return len(qwords & swords) / len(qwords)


def _quote_amounts(quote: str) -> list:
    """Parse every plausible monetary figure out of the quote."""
    vals = []
    text = quote.lower()
    for m in re.finditer(r"(\d{1,3}(?:[,\s]\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(k|m|bn|b)?(?![\d%])", text):
        num = float(m.group(1).replace(",", "").replace(" ", ""))
        if m.group(2):
            num = float(f"{m.group(1).replace(',', '').replace(' ', '')}.{m.group(2)}")
        suf = m.group(3)
        if suf == "k":
            num *= 1e3
        elif suf == "m":
            num *= 1e6
        elif suf in ("b", "bn"):
            num *= 1e9
        vals.append(num)
    return vals


def clean_dollar_impact(v, source_text: str = "", fallback_source: str = "") -> dict | None:
    """Keep dollarImpact only if it's a sane, explicit figure backed by a quote
    that (a) is largely grounded in the source text and (b) actually contains
    the claimed amount. Guards against invented numbers. Falls back to the whole
    account's source when the quote sits in an adjacent thread."""
    if not isinstance(v, dict):
        return None
    amount = v.get("amountUsd")
    if isinstance(amount, str):
        amount = re.sub(r"[^0-9.]", "", amount)
        try:
            amount = float(amount)
        except ValueError:
            return None
    if not isinstance(amount, (int, float)) or amount <= 0:
        return None
    quote = str(v.get("quote") or "").strip()

    def verified(src: str) -> bool:
        if len(quote) < 10 or not src.strip():
            return False
        grounded = _norm_text(quote) in _norm_text(src) or _word_overlap(quote, src) >= 0.7
        amounts_ok = any(abs(q - amount) <= 0.05 * amount for q in _quote_amounts(quote))
        return grounded and amounts_ok

    if source_text or fallback_source:
        if not verified(source_text):
            if fallback_source and verified(fallback_source):
                print(f"    ~ kept dollar figure {amount:,.0f} (quoted from an adjacent thread)")
            else:
                print(f"    ! dropped unverified dollar figure {amount:,.0f} — quote: {quote[:90]!r}")
                return None
    note = str(v.get("note") or "").strip()[:60]
    return {"amountUsd": amount, "note": note}


def compute_edges(iata: str, threads: list) -> list:
    """Count how many threads each (airline_participant, trip_participant) pair co-appears in."""
    airline_domain = {v: k for k, v in DOMAINS.items()}[iata]
    edges = Counter()
    for t in threads:
        parts = [t["from"]] + t.get("to", []) + t.get("cc", [])
        airline_parts = [(p["name"] or p["address"]) for p in parts if (p.get("address") or "").endswith("@" + airline_domain)]
        trip_parts = [(p["name"] or p["address"]) for p in parts if (p.get("address") or "").endswith("@trip.com")]
        for a in set(airline_parts):
            for tp in set(trip_parts):
                edges[(a, tp)] += 1
    return [{"airline": a, "trip": tp, "threads": n} for (a, tp), n in edges.most_common()]


# ─── Rewrite updates.json — one record per topic ──────────────────────────────

def to_update_record(topic: dict) -> dict:
    return {
        "id": f"topic_{topic['accountIata']}_{re.sub(r'[^a-z0-9]+', '_', topic['name'].lower())[:40]}",
        "accountIata": topic["accountIata"],
        "createdBy": f"graph_pull_llm_{OWNER}",
        "createdAt": topic.get("lastTouched") or datetime.now(timezone.utc).isoformat(),
        "scope": "global",
        "bd": BD_OWNER.get(topic["accountIata"], "praveen"),
        "headline": topic["name"],
        "detail": topic.get("summary", ""),
        "dollarImpact": topic.get("dollarImpact") or None,
        "nextStep": topic.get("nextStep") or None,
        "isChild": False,
        "source": "outlook_clustered",
        "status": topic.get("status", "active"),
        "priority": topic.get("priority", "medium"),
        "airlineOwners": topic.get("airlineOwners", []),
        "tripOwners": topic.get("tripOwners", []),
        "threadCount": len(topic.get("threadIds", [])),
    }


def main():
    only = {a.upper() for a in sys.argv[1:]} or set(DOMAINS.values())
    unknown = only - set(DOMAINS.values())
    if unknown:
        print(f"ERROR: unknown IATA code(s) {sorted(unknown)}; valid: {sorted(DOMAINS.values())}", file=sys.stderr)
        sys.exit(1)

    all_topics = []
    all_edges = []
    # When re-clustering a subset, keep edges of untouched accounts
    if only != set(DOMAINS.values()) and PARTICIPANTS_PATH.exists():
        try:
            for e in json.load(open(PARTICIPANTS_PATH)):
                if e.get("iata") not in only:
                    all_edges.append(e)
        except Exception:
            pass

    for iata in DOMAINS.values():
        if iata not in only:
            topics_path = email_dir(iata) /"topics.json"
            topics = json.load(open(topics_path)) if topics_path.exists() else []
            print(f"\n─── {iata}: keeping {len(topics)} existing topics ───")
            all_topics.extend(topics)
            continue

        print(f"\n─── clustering {iata} ───")
        result = cluster_for_iata(iata)
        topics = result["topics"]
        edges = result["edges"]
        print(f"  → {len(topics)} topics, {len(edges)} participant edges")
        for t in topics:
            print(f"    · [{t.get('status','?'):<11}] {t['name']}  ({len(t.get('threadIds', []))} threads)")

        (email_dir(iata) /"topics.json").write_text(json.dumps(topics, indent=2))
        all_topics.extend(topics)
        for e in edges:
            e["iata"] = iata
        all_edges.extend(edges)

    # Rewrite updates.json:
    # - keep any updates NOT from graph_pull (manual logs stay)
    # - drop the raw per-thread email_ records
    # - add the new one-per-topic records
    existing = []
    if UPDATES_PATH.exists():
        try:
            existing = json.load(open(UPDATES_PATH))
        except Exception:
            existing = []
    # Drop this owner's previous llm records (rebuilt below) but keep every other
    # owner's records and any manual logs, so per-owner runs never clobber each other.
    drop = {"graph_pull", "graph_pull_llm", f"graph_pull_llm_{OWNER}"}
    keep = [u for u in existing if u.get("createdBy") not in drop]
    new_records = [to_update_record(t) for t in all_topics]
    combined = new_records + keep
    combined.sort(key=lambda u: u.get("createdAt", ""), reverse=True)
    UPDATES_PATH.write_text(json.dumps(combined, indent=2))
    PARTICIPANTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    PARTICIPANTS_PATH.write_text(json.dumps(all_edges, indent=2))

    print(f"\nWrote {len(new_records)} topics + kept {len(keep)} manual/other → {UPDATES_PATH.relative_to(REPO_ROOT)}")
    print(f"Wrote {len(all_edges)} participant edges → {PARTICIPANTS_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
