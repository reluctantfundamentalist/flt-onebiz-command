#!/usr/bin/env python3
"""Ingest CSVs into an append-only SQLite store and aggregate JSON outputs.

Backing store: src/data-vendor/bookings.db
  Table `bookings` — one row per (carrier x flight x booking). Unique index
  on a stable content-hash so re-ingesting the same file (or an overlapping
  daily) doesn't create duplicates.

Outputs (regenerated on every run):
  - src/data-vendor/<IATA>/latest.json  (DashboardShell dataset)
  - src/data/metrics.json               (map hover + hero impact)
  - src/data/timeseries/<IATA>.json     (monthly rev + pax)

Usage:
  python3 scripts/ingest.py                    # aggregate from existing DB
  python3 scripts/ingest.py <path.csv> [...]   # ingest new file(s), then aggregate
  python3 scripts/ingest.py --backfill         # ingest newest ~/Downloads/noSave_*.csv, then aggregate
"""

from __future__ import annotations

import csv
import glob
import hashlib
import json
import os
import sqlite3
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DATA_VENDOR_DIR = REPO_ROOT / "src" / "data-vendor"
DB_PATH = DATA_VENDOR_DIR / "bookings.db"
METRICS_PATH = REPO_ROOT / "src" / "data" / "metrics.json"
TIMESERIES_DIR = REPO_ROOT / "src" / "data" / "timeseries"

CURRENCY = "USD"
PREMIUM_CLASSES = {"C", "S", "F", "J", "Mix"}

EU_COUNTRIES = {
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
    "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","GB","CH","NO","IS",
}
APAC_COUNTRIES = {
    "AU","BD","BN","BT","CN","HK","ID","IN","JP","KH","KP","KR","LA","LK","MM",
    "MN","MO","MV","MY","NP","NZ","PH","PK","SG","TH","TL","TW","VN",
}

AIRLINE_NAMES = {
    "3L":"Air Arabia Abu Dhabi","4Z":"Airlink","5Z":"CemAir","6E":"IndiGo","6H":"Israir",
    "9P":"Air Arabia Jordan","A9":"Georgian Airways","AI":"Air India","E5":"Air Arabia Egypt",
    "EK":"Emirates","EY":"Etihad Airways","F3":"flyadeal","FA":"FlySafair","FZ":"flydubai",
    "G9":"Air Arabia Group","GE":"Grand International","GF":"Gulf Air","IX":"Air India Express",
    "IZ":"Arkia","J2":"Azerbaijan Airlines","J9":"Jazeera Airways","KQ":"Kenya Airways",
    "KU":"Kuwait Airways","LV":"Level","LY":"El Al","MA":"MEA-JU","MS":"EgyptAir",
    "NE":"Nesma Airlines","NP":"Nile Air","OV":"Salamair","PK":"Pakistan International",
    "QR":"Qatar Airways","RJ":"Royal Jordanian","SA":"South African Airways","SG":"SpiceJet",
    "SM":"Air Cairo","SV":"Saudia","WY":"Oman Air","XY":"flynas",
}
# 5W (Wizz Air Abu Dhabi) — user excluded 2026-08-06. Vistara (UK) — shut down.
EXCLUDED_CARRIERS = {"5W", "UK"}

# Group-rollup mapping: some carriers report as one commercial account.
# Air Arabia Group = G9 (Sharjah) + 3L (Abu Dhabi). Anything landing here
# is rewritten to the anchor code on ingest so downstream aggregates roll up.
CARRIER_ROLLUP = {
    "3L": "G9",   # Air Arabia Abu Dhabi -> Air Arabia Group
}


def canonical_carrier(code: str) -> str:
    return CARRIER_ROLLUP.get(code, code)

# ─── DB setup ─────────────────────────────────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS bookings (
    hash               TEXT PRIMARY KEY,
    carrier            TEXT NOT NULL,
    iscodeshare        TEXT,
    orderdate          TEXT,
    countrypair        TEXT,
    dep_country        TEXT,
    arr_country        TEXT,
    class              TEXT,
    outbounddate       TEXT,
    airportpair        TEXT,
    brand              TEXT,
    triptype           TEXT,
    istransfer         INTEGER,
    revenue_pos        TEXT,
    is_ndc             INTEGER,
    revenue            REAL,
    pax                REAL,
    segments           REAL,
    paid_seat          REAL,
    paid_bag           REAL,
    paid_meal          REAL,
    tpm                REAL,
    ingested_at        TEXT
);
CREATE INDEX IF NOT EXISTS idx_carrier ON bookings(carrier);
CREATE INDEX IF NOT EXISTS idx_outbound ON bookings(outbounddate);
CREATE INDEX IF NOT EXISTS idx_order ON bookings(orderdate);
"""


def open_db():
    DATA_VENDOR_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    return conn


# ─── Ingest ───────────────────────────────────────────────────────────────────

def _f(v):
    try:
        return float(v) if v not in (None, "", "None") else 0.0
    except ValueError:
        return 0.0


def _bool(v):
    return 1 if (v or "").strip().upper() == "Y" else 0


def hash_row(row: dict) -> str:
    key = "|".join([
        (row.get("validatingcarrier") or "").strip(),
        (row.get("orderdate") or "")[:10],
        (row.get("outbounddeparturedate") or "")[:10],
        (row.get("airportpair") or "").strip(),
        (row.get("class") or "").strip(),
        (row.get("brandname") or "").strip(),
        (row.get("triptype") or "").strip(),
        f"{_f(row.get('Revenue')):.2f}",
        f"{_f(row.get('pax')):.0f}",
        f"{_f(row.get('Segments')):.0f}",
        (row.get("countrypair") or "").strip(),
    ])
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def ingest_csv(conn, path: Path) -> tuple[int, int, int]:
    """Returns (rows_seen, rows_inserted, rows_skipped_excluded)."""
    seen = inserted = excluded = 0
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(path, "r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        headers = set(reader.fieldnames or [])
        has_ndc = "isNDC" in headers
        has_pos = "RevenuePOS_Country" in headers

        batch = []
        for row in reader:
            seen += 1
            carrier = (row.get("validatingcarrier") or "").strip()
            if not carrier:
                continue
            if carrier in EXCLUDED_CARRIERS:
                excluded += 1
                continue
            carrier = canonical_carrier(carrier)

            cp = (row.get("countrypair") or "").strip()
            dep, arr = "", ""
            if "-" in cp:
                dep, _, arr = cp.partition("-")

            batch.append((
                hash_row(row),
                carrier,
                (row.get("iscodeshare") or "").strip(),
                (row.get("orderdate") or "")[:10],
                cp,
                dep,
                arr,
                (row.get("class") or "").strip(),
                (row.get("outbounddeparturedate") or "")[:10],
                (row.get("airportpair") or "").strip(),
                (row.get("brandname") or "").strip(),
                (row.get("triptype") or "").strip(),
                _bool(row.get("istransfer")),
                (row.get("RevenuePOS_Country") or "").strip() if has_pos else "",
                _bool(row.get("isNDC")) if has_ndc else -1,  # -1 = column absent
                _f(row.get("Revenue")),
                _f(row.get("pax")),
                _f(row.get("Segments")),
                _f(row.get("paid_seat_segments")),
                _f(row.get("paid_bag_segments")),
                _f(row.get("paid_meal_segments")),
                _f(row.get("tpm")),
                now_iso,
            ))
            if len(batch) >= 5000:
                inserted += _flush(conn, batch)
                batch = []
        if batch:
            inserted += _flush(conn, batch)
    conn.commit()
    return seen, inserted, excluded


def _flush(conn, batch) -> int:
    cur = conn.cursor()
    cur.executemany(
        """INSERT OR IGNORE INTO bookings (
            hash, carrier, iscodeshare, orderdate, countrypair, dep_country, arr_country,
            class, outbounddate, airportpair, brand, triptype, istransfer,
            revenue_pos, is_ndc, revenue, pax, segments, paid_seat, paid_bag, paid_meal,
            tpm, ingested_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        batch,
    )
    return cur.rowcount


# ─── Aggregate ────────────────────────────────────────────────────────────────

def pct_change(cur, prev):
    if prev == 0:
        return 0.0
    return round(((cur - prev) / prev) * 100, 1)


def safe_div(num, den):
    return round(num / den, 0) if den > 0 else 0


def rows_by_month(rows, month_field):
    grouped = defaultdict(list)
    for r in rows:
        m = r[month_field][:7] if r[month_field] else ""
        if m:
            grouped[m].append(r)
    return grouped


def compute_snapshot(rows):
    total_rev = sum(r["revenue"] for r in rows)
    total_pax = sum(r["pax"] for r in rows)
    atv = safe_div(total_rev, total_pax)

    prem_rows = [r for r in rows if r["class"] in PREMIUM_CLASSES]
    prem_rev = sum(r["revenue"] for r in prem_rows)
    prem_pax = sum(r["pax"] for r in prem_rows)
    eco_rev = total_rev - prem_rev
    eco_pax = total_pax - prem_pax

    n = len(rows)

    kpis = {
        "revenue": {"value": round(total_rev, 0), "vly": 0.0, "mom": 0.0},
        "ondPax": {"value": int(total_pax), "vly": 0.0, "mom": 0.0},
        "atv": {"value": atv, "vly": 0.0, "mom": 0.0},
        "premium": {"value": round(prem_rev, 0), "vly": 0.0, "mom": 0.0},
        "yield": {
            "economy": {"value": safe_div(eco_rev, eco_pax), "vly": 0.0},
            "premium": {"value": safe_div(prem_rev, prem_pax), "vly": 0.0},
        },
    }

    # ── Distribution: real NDC/GDS split from isNDC column ─────────────────
    ndc_rev = sum(r["revenue"] for r in rows if r["is_ndc"] == 1)
    non_ndc_rev = sum(r["revenue"] for r in rows if r["is_ndc"] == 0)
    absent = sum(r["revenue"] for r in rows if r["is_ndc"] == -1)
    dist_total = ndc_rev + non_ndc_rev
    distribution = []
    if dist_total > 0:
        distribution = [
            {"channel": "GDS/EDIFACT", "revenue": round(non_ndc_rev, 0),
             "revenueShare": round(non_ndc_rev / dist_total * 100, 1)},
            {"channel": "NDC",         "revenue": round(ndc_rev, 0),
             "revenueShare": round(ndc_rev / dist_total * 100, 1)},
        ]
    elif absent > 0:
        distribution = []  # column not present in source rows

    # ── Ancillary ──
    def ancillary(label, key):
        rows_with = [r for r in rows if r[key] > 0]
        seg_sum = sum(r[key] for r in rows)
        return {"type": label, "segments": int(seg_sum),
                "attachRate": round(len(rows_with) / n * 100, 1) if n else 0}

    ancillary_rows = [
        ancillary("Seats", "paid_seat"),
        ancillary("Baggage", "paid_bag"),
        ancillary("Meals", "paid_meal"),
    ]

    p2p_pax = sum(r["pax"] for r in rows if r["segments"] <= 1)
    conn_pax = total_pax - p2p_pax
    traffic_type = []
    if total_pax:
        traffic_type = [
            {"label": "P2P & Stopover",       "paxShare": round(p2p_pax / total_pax * 100, 1)},
            {"label": "Connection & Transit", "paxShare": round(conn_pax / total_pax * 100, 1)},
        ]

    cabin_split = []
    if total_pax:
        cabin_split = [
            {"label": "Economy", "paxShare": round(eco_pax / total_pax * 100, 1)},
            {"label": "Premium", "paxShare": round(prem_pax / total_pax * 100, 1)},
        ]

    rt_pax = sum(r["pax"] for r in rows if r["triptype"] == "RT")
    ow_pax = sum(r["pax"] for r in rows if r["triptype"] == "OW")
    trip_type_share = []
    if total_pax:
        trip_type_share = [
            {"label": "Round trip", "paxShare": round(rt_pax / total_pax * 100, 1)},
            {"label": "One way",    "paxShare": round(ow_pax / total_pax * 100, 1)},
        ]

    product_counter = defaultdict(float)
    for r in rows:
        if r["brand"]:
            product_counter[r["brand"]] += r["revenue"]
    product_type = [
        {"product": name, "revenue": round(rev, 0)}
        for name, rev in sorted(product_counter.items(), key=lambda x: x[1], reverse=True)[:8]
    ]

    insights = {
        "distribution": distribution,
        "ancillary": ancillary_rows,
        "trafficType": traffic_type,
        "cabinSplit": cabin_split,
        "tripType": trip_type_share,
        "productType": product_type,
        "bookingWindow": [],
    }

    # ── POS: prefer RevenuePOS_Country when present; else fall back to departurecountry ──
    pos_field = "revenue_pos"
    pos_by_country = defaultdict(lambda: {"revenue": 0.0, "pax": 0.0})
    for r in rows:
        c = r.get(pos_field) or r.get("dep_country") or ""
        if c:
            pos_by_country[c]["revenue"] += r["revenue"]
            pos_by_country[c]["pax"] += r["pax"]

    pos_regions = []
    for country, stats in sorted(pos_by_country.items(), key=lambda x: x[1]["revenue"], reverse=True)[:10]:
        pos_regions.append({
            "region": country, "country": None,
            "revenue": round(stats["revenue"], 0), "revVly": 0.0,
            "pax": int(stats["pax"]), "paxVly": 0.0,
            "atv": safe_div(stats["revenue"], stats["pax"]), "atvVly": 0.0,
        })

    grand_total = {
        "revenue": round(total_rev, 0), "revVly": 0.0,
        "pax": int(total_pax), "paxVly": 0.0,
        "atv": atv, "atvVly": 0.0,
    }

    origin_counter = defaultdict(float)
    dest_counter = defaultdict(float)
    for r in rows:
        if r["dep_country"]:
            origin_counter[r["dep_country"]] += r["revenue"]
        if r["arr_country"]:
            dest_counter[r["arr_country"]] += r["revenue"]

    def country_rank(counter, limit=10):
        ranked = sorted(counter.items(), key=lambda x: x[1], reverse=True)[:limit]
        return [{"rank": i + 1, "country": c, "revenue": round(v, 0)} for i, (c, v) in enumerate(ranked)]

    pos_data = {
        "regions": pos_regions,
        "grandTotal": grand_total,
        "topOriginCountries": country_rank(origin_counter),
        "topDestCountries": country_rank(dest_counter),
    }

    rbd_counter = defaultdict(float)
    for r in rows:
        if r["class"]:
            rbd_counter[r["class"]] += r["revenue"]
    top_rbd_rows = [
        {"rank": i + 1, "rbd": c, "revenue": round(v, 0), "revVly": 0.0}
        for i, (c, v) in enumerate(sorted(rbd_counter.items(), key=lambda x: x[1], reverse=True)[:10])
    ]

    top_nd_country = [
        {"rank": i + 1, "ond": c, "revenue": round(v, 0), "revVly": 0.0, "pax": 0, "paxVly": 0.0}
        for i, (c, v) in enumerate(sorted(dest_counter.items(), key=lambda x: x[1], reverse=True)[:10])
    ]

    ond_stats = defaultdict(lambda: {"revenue": 0.0, "pax": 0.0})
    for r in rows:
        if r["airportpair"]:
            ond_stats[r["airportpair"]]["revenue"] += r["revenue"]
            ond_stats[r["airportpair"]]["pax"] += r["pax"]
    top_nd_ond = [
        {"rank": i + 1, "ond": cp, "revenue": round(s["revenue"], 0), "revVly": 0.0,
         "pax": int(s["pax"]), "paxVly": 0.0}
        for i, (cp, s) in enumerate(sorted(ond_stats.items(), key=lambda x: x[1]["revenue"], reverse=True)[:10])
    ]

    return {"kpis": kpis, "insights": insights, "pos": pos_data,
            "rankings": {"topRBD": top_rbd_rows, "topNDCountry": top_nd_country, "topNDOND": top_nd_ond}}


def build_month_view(carrier_rows, month_field):
    grouped = rows_by_month(carrier_rows, month_field)
    months = sorted(grouped.keys())
    by_month = {m: compute_snapshot(grouped[m]) for m in months}

    def shift_year(m, delta):
        y, mo = m.split("-")
        return f"{int(y) + delta:04d}-{mo}"

    for i, m in enumerate(months):
        if i > 0:
            prev = months[i - 1]
            for k in ("revenue", "ondPax", "atv", "premium"):
                by_month[m]["kpis"][k]["mom"] = pct_change(
                    by_month[m]["kpis"][k]["value"], by_month[prev]["kpis"][k]["value"]
                )
        ly = shift_year(m, -1)
        if ly in by_month:
            for k in ("revenue", "ondPax", "atv", "premium"):
                by_month[m]["kpis"][k]["vly"] = pct_change(
                    by_month[m]["kpis"][k]["value"], by_month[ly]["kpis"][k]["value"]
                )

    trendline = [
        {"month": m, "revenue": by_month[m]["kpis"]["revenue"]["value"], "pax": by_month[m]["kpis"]["ondPax"]["value"]}
        for m in months
    ]
    return {"months": months, "byMonth": by_month, "trendline": trendline}


def load_rows_for_carrier(conn, carrier: str):
    cur = conn.cursor()
    cur.execute("SELECT * FROM bookings WHERE carrier = ?", (carrier,))
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def compute_airline_dataset(conn, carrier):
    airline_rows = load_rows_for_carrier(conn, carrier)
    if not airline_rows:
        return None

    outbound_view = build_month_view(airline_rows, "outbounddate")
    order_view = build_month_view(airline_rows, "orderdate")

    report_month = order_view["months"][-1] if order_view["months"] else None
    start_date = f"{report_month}-01" if report_month else ""
    order_dates = sorted({r["orderdate"] for r in airline_rows if r["orderdate"]})

    now = datetime.now(timezone.utc)
    meta = {
        "airlineCode": carrier,
        "airlineName": AIRLINE_NAMES.get(carrier, carrier),
        "reportMonth": report_month,
        "startDate": start_date,
        "endDate": (start_date[:8] + "28") if start_date else "",
        "generatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "currency": CURRENCY,
        "orderDateMin": order_dates[0] if order_dates else "",
        "orderDateMax": order_dates[-1] if order_dates else "",
    }
    return {"meta": meta, "outbound": outbound_view, "order": order_view}


def compute_metrics(conn, carrier, today):
    rows = load_rows_for_carrier(conn, carrier)
    if not rows:
        return None
    year = today.year
    today_iso = today.strftime("%Y-%m-%d")
    today_md = today.strftime("%m-%d")

    ytd = [r for r in rows if r["outbounddate"].startswith(f"{year}-") and r["outbounddate"] <= today_iso]
    ly = [r for r in rows if r["outbounddate"].startswith(f"{year - 1}-") and r["outbounddate"][5:] <= today_md]

    ytd_rev = sum(r["revenue"] for r in ytd)
    ly_rev = sum(r["revenue"] for r in ly)
    ytd_pax = sum(r["pax"] for r in ytd)

    def eu_apac(rows_):
        return sum(r["revenue"] for r in rows_ if
                   (r["dep_country"] in EU_COUNTRIES and r["arr_country"] in APAC_COUNTRIES) or
                   (r["dep_country"] in APAC_COUNTRIES and r["arr_country"] in EU_COUNTRIES))
    eu_apac_rev, eu_apac_ly = eu_apac(ytd), eu_apac(ly)

    return {
        "iata": carrier,
        "ytdFlownRevUsd": round(ytd_rev, 0),
        "ytdFlownRevLyUsd": round(ly_rev, 0),
        "ytdFlownRevVlyPct": pct_change(ytd_rev, ly_rev),
        "euApacRevUsd": round(eu_apac_rev, 0),
        "euApacRevLyUsd": round(eu_apac_ly, 0),
        "euApacRevVlyPct": pct_change(eu_apac_rev, eu_apac_ly),
        "npbrUsd": round(ytd_rev, 0),
        "ondPax": int(ytd_pax),
        "atvUsd": safe_div(ytd_rev, ytd_pax),
        "lastUpdated": today_iso,
        "source": "sqlite:bookings.db",
    }


def compute_timeseries(conn, carrier):
    rows = load_rows_for_carrier(conn, carrier)
    by_month = defaultdict(lambda: {"revenue": 0.0, "pax": 0.0})
    for r in rows:
        m = r["outbounddate"][:7] if r["outbounddate"] else ""
        if m:
            by_month[m]["revenue"] += r["revenue"]
            by_month[m]["pax"] += r["pax"]
    return [
        {"month": m, "revenue": round(v["revenue"], 0), "pax": int(v["pax"])}
        for m, v in sorted(by_month.items())
    ]


# ─── Main ─────────────────────────────────────────────────────────────────────

def aggregate_all(conn):
    today = datetime.now(timezone.utc)
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT carrier FROM bookings ORDER BY carrier")
    carriers = [r[0] for r in cur.fetchall()]

    DATA_VENDOR_DIR.mkdir(parents=True, exist_ok=True)
    TIMESERIES_DIR.mkdir(parents=True, exist_ok=True)

    all_metrics = []
    for carrier in carriers:
        dataset = compute_airline_dataset(conn, carrier)
        if not dataset:
            continue
        (DATA_VENDOR_DIR / carrier).mkdir(parents=True, exist_ok=True)
        (DATA_VENDOR_DIR / carrier / "latest.json").write_text(json.dumps(dataset, indent=2))
        m = compute_metrics(conn, carrier, today)
        if m:
            all_metrics.append(m)
        (TIMESERIES_DIR / f"{carrier}.json").write_text(json.dumps(compute_timeseries(conn, carrier), indent=2))

        latest = dataset["outbound"]["byMonth"][dataset["outbound"]["months"][-1]]
        k = latest["kpis"]
        print(f"  {carrier:>3} · {AIRLINE_NAMES.get(carrier, carrier):<25} "
              f"rev ${k['revenue']['value']:>14,.0f} | pax {k['ondPax']['value']:>10,} | "
              f"YTD ${m['ytdFlownRevUsd']:>13,.0f} vLY {m['ytdFlownRevVlyPct']:+.1f}%")

    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.write_text(json.dumps(all_metrics, indent=2))
    print(f"\nWrote metrics + datasets + timeseries for {len(carriers)} carriers")


def find_default_csv():
    home = Path.home()
    candidates = sorted(glob.glob(str(home / "Downloads" / "noSave_*.csv")),
                        key=os.path.getmtime, reverse=True)
    return candidates[0] if candidates else None


def main():
    args = sys.argv[1:]
    conn = open_db()

    if args and args[0] == "--backfill":
        csv_path = find_default_csv()
        if not csv_path:
            print("No noSave_*.csv found in ~/Downloads")
            sys.exit(1)
        args = [csv_path]

    for path in args:
        p = Path(path).expanduser()
        if not p.exists():
            print(f"Missing: {p}")
            continue
        print(f"Ingesting {p} ...")
        seen, inserted, excluded = ingest_csv(conn, p)
        print(f"  seen={seen:,} inserted={inserted:,} excluded={excluded:,} (dedupe: {seen - inserted - excluded:,})")

    cur = conn.cursor()
    cur.execute("SELECT COUNT(*), MIN(orderdate), MAX(orderdate) FROM bookings")
    n, dmin, dmax = cur.fetchone()
    print(f"\nDB now: {n:,} rows · orderdate {dmin} → {dmax}\n")

    aggregate_all(conn)
    conn.close()


if __name__ == "__main__":
    main()
