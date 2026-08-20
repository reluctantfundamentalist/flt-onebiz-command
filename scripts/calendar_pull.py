#!/usr/bin/env python3
"""Pull BD calendar events from Outlook Graph and merge them into
src/data/meetings.json. The device-flow scope set already carries
Calendars.Read (see graph_pull.refresh_if_needed), so no new auth is needed.

Read-only: single GET on /me/calendarview. Events are matched to portfolio
airlines by attendee/organizer domain and by airline name in the subject;
anything that doesn't match an account is skipped (this system tracks
airline BD, not internal meetings).

Records are written with id prefix `cal_` and fully replaced on each run;
manually logged meetings (other ids) are preserved.
"""

from __future__ import annotations

import json
import sys
import urllib.parse
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from graph_pull import CREDS_PATH, OWNER, USER_DOMAINS, refresh_if_needed  # noqa: E402
from graph_readonly import graph_get  # noqa: E402  (read-only guardrail)

REPO_ROOT = Path(__file__).resolve().parent.parent
MEETINGS_PATH = REPO_ROOT / "src" / "data" / "meetings.json"
USERS_PATH = REPO_ROOT / "src" / "lib" / "users.ts"

BACK_DAYS = 14
FORWARD_DAYS = 90


def domain_map() -> dict[str, str]:
    """email domain -> IATA, union across all enrolled BD mailboxes."""
    m: dict[str, str] = {}
    for domains in USER_DOMAINS.values():
        for iata, dom in domains.items():
            m.setdefault(dom.lower(), iata)
    return m


def airline_names() -> dict[str, str]:
    """Airline display name -> IATA, parsed from the ACCOUNTS seed."""
    names: dict[str, str] = {}
    text = USERS_PATH.read_text()
    import re
    for match in re.finditer(r'iata:\s*"([^"]+)",\s*name:\s*"([^"]+)"', text):
        names[match.group(2).lower()] = match.group(1)
    return names


def match_account(event: dict, domains: dict[str, str], names: dict[str, str]) -> str | None:
    people = [event.get("organizer", {}).get("emailAddress", {})]
    people += [a.get("emailAddress", {}) for a in event.get("attendees", [])]
    for p in people:
        addr = (p.get("address") or "").lower()
        dom = addr.split("@")[-1] if "@" in addr else ""
        if dom in domains:
            return domains[dom]
    blob = (event.get("subject") or "").lower()
    for name, iata in names.items():
        if name in blob:
            return iata
    return None


def main() -> None:
    creds = refresh_if_needed(json.load(open(CREDS_PATH)))
    token = creds["access_token"]

    now = datetime.now(timezone.utc)
    start = (now - timedelta(days=BACK_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    end = (now + timedelta(days=FORWARD_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    params = urllib.parse.urlencode({
        "startDateTime": start,
        "endDateTime": end,
        "$select": "id,subject,start,organizer,attendees",
        "$orderby": "start/dateTime",
        "$top": "200",
    })
    resp = graph_get(f"https://graph.microsoft.com/v1.0/me/calendarview?{params}", token)
    events = resp.get("value", [])

    domains = domain_map()
    names = airline_names()
    matched, skipped = [], 0
    for ev in events:
        iata = match_account(ev, domains, names)
        if not iata:
            skipped += 1
            continue
        attendees = [
            a.get("emailAddress", {}).get("name") or a.get("emailAddress", {}).get("address", "?")
            for a in ev.get("attendees", [])
        ]
        matched.append({
            "id": f"cal_{ev['id'][:40]}",
            "accountIata": iata,
            "when": ev["start"]["dateTime"] + "Z",
            "attendees": attendees[:8],
            "agenda": ev.get("subject") or "(no subject)",
            "bd": OWNER,
        })

    existing = []
    if MEETINGS_PATH.exists():
        existing = json.loads(MEETINGS_PATH.read_text())
    kept = [m for m in existing if not str(m.get("id", "")).startswith("cal_")]
    merged = kept + matched
    MEETINGS_PATH.write_text(json.dumps(merged, indent=2))
    print(f"calendar: {len(events)} events in window, {len(matched)} matched airlines, {skipped} non-airline skipped")
    print(f"meetings.json now has {len(merged)} records ({len(kept)} manual/seed kept)")


if __name__ == "__main__":
    main()
