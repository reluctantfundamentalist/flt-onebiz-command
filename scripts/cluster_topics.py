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

# Domain -> IATA
DOMAINS = {
    "emirates.com": "EK",
    "etihad.ae": "EY",
    "airarabia.com": "G9",
}
BD_OWNER = {"EK": "praveen", "EY": "praveen", "G9": "praveen"}

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
        resp = urllib.request.urlopen(req, context=SSL_CTX, timeout=120)
        data = json.loads(resp.read())
        return data["content"][0]["text"]
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:400]
        raise RuntimeError(f"Claude API {e.code}: {body}") from e


# ─── Prep: build a compact per-thread payload for the LLM ─────────────────────

def thread_summary_line(t: dict) -> str:
    date = (t.get("receivedDateTime") or "")[:10]
    frm = t.get("from", {}).get("name") or t.get("from", {}).get("address") or "?"
    subj = re.sub(r"^\s*(re|fw|fwd|\[external\])[:\s]*", "", (t.get("subject") or "").strip(), flags=re.I).strip()
    body = (t.get("bodyPreview") or "").replace("\n", " ")[:400]
    return f"[{date} · {frm}] {subj}\n  {body}"


def cluster_for_iata(iata: str) -> dict:
    emails_path = EMAIL_DIR / iata / "emails.json"
    if not emails_path.exists():
        return {"topics": [], "edges": []}
    threads = json.load(open(emails_path))
    if not threads:
        return {"topics": [], "edges": []}

    lines = []
    for t in threads:
        lines.append(f"id={t['id'][:20]}")
        lines.append(thread_summary_line(t))
        lines.append("")

    airline_name = {"EK": "Emirates", "EY": "Etihad", "G9": "Air Arabia Group"}[iata]
    prompt = f"""You are structuring commercial-partnership emails between Trip.com and {airline_name}.

Below are {len(threads)} email threads (each = a distinct conversation with subject + preview). Cluster them into TOPICS. Each topic groups threads that discuss the same commercial workstream.

For each topic produce:
- `name`: 4-8 words, business-friendly (e.g. "Skywards × Trip Coins loyalty integration")
- `summary`: 1-2 sentences on what the workstream is about and where it stands
- `status`: one of "active" (ongoing conversation in the last 2 weeks), "in_progress" (multi-week workstream still moving), "closed" (concluded), "dormant" (stalled >4 weeks)
- `nextStep`: the concrete next action if one is visible in the threads; else null
- `airlineOwners`: array of participant names from the AIRLINE side (@{list(DOMAINS.keys())[list(DOMAINS.values()).index(iata)]}) most engaged in this topic (top 1-3)
- `tripOwners`: array of Trip.com side participants (typically Anuj Bansal, Kirk Wong, PJ Zhou, Shrey Nayar, or another @trip.com)
- `threadIds`: array of thread ids (use the id= prefix from below) belonging to this topic
- `lastTouched`: ISO date of the most recent thread in the cluster
- `priority`: "high" | "medium" | "low" — high if the topic drives revenue/contracts, medium if operational, low if noise

Rules:
- Every thread must land in exactly one topic. Do not drop any.
- Ignore auto-replies, out-of-office, calendar accept/decline as topics but INCLUDE their threadIds under the most-relevant substantive topic if there's context; otherwise a topic named "Scheduling & OOO noise" is fine.
- Merge aggressively — better 6-10 real topics than 20 thin ones.
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
    for topic in topics:
        topic["threadIds"] = [id_by_prefix.get(tid, tid) for tid in topic.get("threadIds", [])]
        topic["accountIata"] = iata

    # Participant co-occurrence edges (mechanical)
    edges = compute_edges(iata, threads)
    return {"topics": topics, "edges": edges}


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
        "createdBy": "graph_pull_llm",
        "createdAt": topic.get("lastTouched") or datetime.now(timezone.utc).isoformat(),
        "scope": "global",
        "bd": BD_OWNER.get(topic["accountIata"], "praveen"),
        "headline": topic["name"],
        "detail": topic.get("summary", ""),
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
    all_topics = []
    all_edges = []
    for iata in DOMAINS.values():
        print(f"\n─── clustering {iata} ───")
        result = cluster_for_iata(iata)
        topics = result["topics"]
        edges = result["edges"]
        print(f"  → {len(topics)} topics, {len(edges)} participant edges")
        for t in topics:
            print(f"    · [{t.get('status','?'):<11}] {t['name']}  ({len(t.get('threadIds', []))} threads)")

        (EMAIL_DIR / iata / "topics.json").write_text(json.dumps(topics, indent=2))
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
    keep = [u for u in existing if u.get("createdBy") not in ("graph_pull", "graph_pull_llm")]
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
