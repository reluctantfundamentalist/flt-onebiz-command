#!/usr/bin/env python3
"""Pull a BD's carrier mail into a contained feed, using ONLY graph_readonly.

Usage: python3 scripts/pull_user_mail.py [user]   # user = nabil | anuj (default nabil)

Read-only by construction: all Graph calls go through graph_readonly, which
hard-blocks anything that is not a GET on a message-read path. Output is written
to src/data/mail_<user>.json and never touches anyone's mailbox.
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import graph_readonly as g

REPO_ROOT = Path(__file__).resolve().parent.parent
CREDS_DIR = Path.home() / ".openclaw" / "credentials"

DOMAINS = {
    "anuj": {"EK": "emirates.com", "EY": "etihad.ae", "G9": "airarabia.com"},
    "nabil": {
        "SV": "saudia.com", "XY": "flynas.com", "F3": "flyadeal.com",
        "PK": "pakistaninternational.com", "PF": "airsial.com", "PA": "airblue.com",
    },
}


def creds_for(user: str):
    p = CREDS_DIR / f"microsoft-graph-{user}.json"
    if not p.exists():
        p = CREDS_DIR / "microsoft-graph.json"
    return json.load(open(p))


def sender_domain(m):
    try:
        return m["from"]["emailAddress"]["address"].split("@")[-1].lower()
    except Exception:
        return ""


def main():
    user = sys.argv[1] if len(sys.argv) > 1 else "nabil"
    domains = DOMAINS.get(user, {})
    creds = creds_for(user)
    token = creds["access_token"]

    who = g.me(token)
    print("reading mailbox of:", who.get("displayName"))

    msgs = g.recent_messages(token, top=300)
    hits = [m for m in msgs if sender_domain(m).endswith(tuple(domains.values()))]

    out = {
        "user": user,
        "owner": who.get("displayName"),
        "domains": domains,
        "scanned": len(msgs),
        "carrier_hits": len(hits),
        "items": [
            {
                "subject": (m.get("subject") or "(no subject)")[:120],
                "from": sender_domain(m),
                "received": m.get("receivedDateTime"),
                "preview": (m.get("bodyPreview") or "")[:200],
            }
            for m in hits
        ],
    }
    dest = REPO_ROOT / "src" / "data" / f"mail_{user}.json"
    json.dump(out, open(dest, "w"), indent=2)
    print(f"wrote {dest} — {len(hits)} carrier mails of {len(msgs)} scanned")


if __name__ == "__main__":
    main()
