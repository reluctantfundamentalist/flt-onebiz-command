#!/usr/bin/env python3
"""Aggregate the daily noSave_*.csv into the JSON files the app consumes.

Reads a transactional flown/booked CSV (one row per validating carrier x flight
x booking) and writes:

  src/data-vendor/<IATA>/latest.json  - trippy-analytics DashboardShell dataset
                                        per airline (kpis/insights/pos/rankings)
  src/data/metrics.json               - map hover metrics per airline
  src/data/timeseries/<IATA>.json     - monthly rev + pax trendline

Adapted from trippy-analytics/scripts/transform.py. Key differences vs the
trippy report:
  - CSV, not XLSX
  - `countrypair` (ISO2-ISO2) instead of departurecountry/arrivalcountry
  - No `agentcode` -> distribution channel split is omitted
  - No `ordermonth` -> derived from orderdate

Usage:
  python3 scripts/aggregate.py [/path/to/noSave_*.csv]

If no path is given, picks the newest ~/Downloads/noSave_*.csv.
"""

from __future__ import annotations

import csv
import glob
import json
import os
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DATA_VENDOR_DIR = REPO_ROOT / "src" / "data-vendor"
METRICS_PATH = REPO_ROOT / "src" / "data" / "metrics.json"
TIMESERIES_DIR = REPO_ROOT / "src" / "data" / "timeseries"

CURRENCY = "USD"
PREMIUM_CLASSES = {"C", "S", "F", "J", "Mix"}

# EU + APAC country ISO2 buckets for the EU-APAC revenue slice.
EU_COUNTRIES = {
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
    "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","GB","CH","NO","IS",
}
APAC_COUNTRIES = {
    "AU","BD","BN","BT","CN","HK","ID","IN","JP","KH","KP","KR","LA","LK","MM",
    "MN","MO","MV","MY","NP","NZ","PH","PK","SG","TH","TL","TW","VN",
}

AIRLINE_NAMES = {
    "3L": "Air Arabia Abu Dhabi",
    "4Z": "Airlink",
    "5Z": "CemAir",
    "6E": "IndiGo",
    "6H": "Israir",
    "9P": "Air Arabia Jordan",
    "A9": "Georgian Airways",
    "AI": "Air India",
    "E5": "Air Arabia Egypt",
    "EK": "Emirates",
    "EY": "Etihad Airways",
    "F3": "flyadeal",
    "FA": "FlySafair",
    "FZ": "flydubai",
    "G9": "Air Arabia",
    "GE": "Grand International",
    "GF": "Gulf Air",
    "IX": "Air India Express",
    "IZ": "Arkia",
    "J2": "Azerbaijan Airlines",
    "J9": "Jazeera Airways",
    "KQ": "Kenya Airways",
    "KU": "Kuwait Airways",
    "LV": "Level",
    "LY": "El Al",
    "MA": "MEA-JU",
    "MS": "EgyptAir",
    "NE": "Nesma Airlines",
    "NP": "Nile Air",
    "OV": "Salamair",
    "PK": "Pakistan International",
    "QR": "Qatar Airways",
    "RJ": "Royal Jordanian",
    "SA": "South African Airways",
    "SG": "SpiceJet",
    "SM": "Air Cairo",
    "SV": "Saudia",
    "UK": "Vistara",
    "WY": "Oman Air",
    "XY": "flynas",
}
# User excluded 5W (Wizz Air Abu Dhabi) explicitly on 2026-08-06.
EXCLUDED_CARRIERS = {"5W"}


def load_rows(csv_path):
    rows = []
    with open(csv_path, "r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        for r in reader:
            carrier = (r.get("validatingcarrier") or "").strip()
            if not carrier or carrier in EXCLUDED_CARRIERS:
                continue

            try:
                rev = float(r.get("Revenue") or 0)
            except ValueError:
                rev = 0.0
            try:
                pax = float(r.get("pax") or 0)
            except ValueError:
                pax = 0.0

            def fint(v):
                try:
                    return float(v) if v not in (None, "", "None") else 0.0
                except ValueError:
                    return 0.0

            country_pair = (r.get("countrypair") or "").strip()
            dep_country, arr_country = "", ""
            if "-" in country_pair:
                dep_country, _, arr_country = country_pair.partition("-")

            orderdate = (r.get("orderdate") or "")[:10]
            outbound = (r.get("outbounddeparturedate") or "")[:10]

            rows.append({
                "carrier": carrier,
                "orderdate": orderdate,
                "ordermonth": orderdate[:7],
                "outboundmonth": outbound[:7],
                "outbounddate": outbound,
                "class": (r.get("class") or "").strip(),
                "brand": (r.get("brandname") or "").strip(),
                "triptype": (r.get("triptype") or "").strip(),
                "istransfer": (r.get("istransfer") or "").strip() == "Y",
                "iscodeshare": (r.get("iscodeshare") or "").strip() == "Y",
                "airportpair": (r.get("airportpair") or "").strip(),
                "dep_country": dep_country,
                "arr_country": arr_country,
                "revenue": rev,
                "pax": pax,
                "segments": fint(r.get("Segments")),
                "paid_seat": fint(r.get("paid_seat_segments")),
                "paid_bag": fint(r.get("paid_bag_segments")),
                "paid_meal": fint(r.get("paid_meal_segments")),
                "tpm": fint(r.get("tpm")),
            })
    return rows


def pct_change(cur, prev):
    if prev == 0:
        return 0.0
    return round(((cur - prev) / prev) * 100, 1)


def safe_div(num, den):
    return round(num / den, 0) if den > 0 else 0


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

    # Distribution channel not available in this CSV (no agentcode column).
    distribution = []

    def ancillary(label, key):
        rows_with = [r for r in rows if r[key] > 0]
        seg_sum = sum(r[key] for r in rows)
        return {
            "type": label,
            "segments": int(seg_sum),
            "attachRate": round(len(rows_with) / n * 100, 1) if n else 0,
        }

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
            {"label": "P2P & Stopover", "paxShare": round(p2p_pax / total_pax * 100, 1)},
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
            {"label": "One way", "paxShare": round(ow_pax / total_pax * 100, 1)},
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

    pos_by_country = defaultdict(lambda: {"revenue": 0.0, "pax": 0.0})
    for r in rows:
        c = r["dep_country"]
        if c:
            pos_by_country[c]["revenue"] += r["revenue"]
            pos_by_country[c]["pax"] += r["pax"]

    pos_regions = []
    for country, stats in sorted(pos_by_country.items(), key=lambda x: x[1]["revenue"], reverse=True)[:10]:
        pos_regions.append({
            "region": country,
            "country": None,
            "revenue": round(stats["revenue"], 0),
            "revVly": 0.0,
            "pax": int(stats["pax"]),
            "paxVly": 0.0,
            "atv": safe_div(stats["revenue"], stats["pax"]),
            "atvVly": 0.0,
        })

    grand_total = {
        "revenue": round(total_rev, 0), "revVly": 0.0,
        "pax": int(total_pax), "paxVly": 0.0,
        "atv": atv, "atvVly": 0.0,
    }

    def country_rank(counter, limit=10):
        ranked = sorted(counter.items(), key=lambda x: x[1], reverse=True)[:limit]
        return [
            {"rank": i + 1, "country": c, "revenue": round(v, 0)}
            for i, (c, v) in enumerate(ranked)
        ]

    origin_counter = defaultdict(float)
    dest_counter = defaultdict(float)
    for r in rows:
        if r["dep_country"]:
            origin_counter[r["dep_country"]] += r["revenue"]
        if r["arr_country"]:
            dest_counter[r["arr_country"]] += r["revenue"]

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
    top_rbd = sorted(rbd_counter.items(), key=lambda x: x[1], reverse=True)[:10]
    top_rbd_rows = [
        {"rank": i + 1, "rbd": c, "revenue": round(v, 0), "revVly": 0.0}
        for i, (c, v) in enumerate(top_rbd)
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
    top_ond = sorted(ond_stats.items(), key=lambda x: x[1]["revenue"], reverse=True)[:10]
    top_nd_ond = [
        {"rank": i + 1, "ond": cp, "revenue": round(s["revenue"], 0), "revVly": 0.0,
         "pax": int(s["pax"]), "paxVly": 0.0}
        for i, (cp, s) in enumerate(top_ond)
    ]

    rankings = {
        "topRBD": top_rbd_rows,
        "topNDCountry": top_nd_country,
        "topNDOND": top_nd_ond,
    }

    return {"kpis": kpis, "insights": insights, "pos": pos_data, "rankings": rankings}


def build_month_view(carrier_rows, month_field):
    months = sorted({r[month_field] for r in carrier_rows if r[month_field]})
    by_month = {}
    for m in months:
        by_month[m] = compute_snapshot([r for r in carrier_rows if r[month_field] == m])

    for i, m in enumerate(months):
        if i == 0:
            continue
        prev = months[i - 1]
        cur_s = by_month[m]
        prev_s = by_month[prev]
        for k in ("revenue", "ondPax", "atv", "premium"):
            cur_s["kpis"][k]["mom"] = pct_change(cur_s["kpis"][k]["value"], prev_s["kpis"][k]["value"])

    # vLY: for each month M in YYYY-MM, compare against M-12 if present.
    def shift_year(m, delta):
        y, mo = m.split("-")
        return f"{int(y) + delta:04d}-{mo}"
    for m in months:
        ly = shift_year(m, -1)
        if ly in by_month:
            cur_s = by_month[m]
            ly_s = by_month[ly]
            for k in ("revenue", "ondPax", "atv", "premium"):
                cur_s["kpis"][k]["vly"] = pct_change(cur_s["kpis"][k]["value"], ly_s["kpis"][k]["value"])

    trendline = [
        {"month": m, "revenue": by_month[m]["kpis"]["revenue"]["value"], "pax": by_month[m]["kpis"]["ondPax"]["value"]}
        for m in months
    ]
    return {"months": months, "byMonth": by_month, "trendline": trendline}


def compute_airline_dataset(rows, carrier):
    airline_rows = [r for r in rows if r["carrier"] == carrier]
    if not airline_rows:
        return None

    outbound_view = build_month_view(airline_rows, "outboundmonth")
    order_view = build_month_view(airline_rows, "ordermonth")

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


def compute_metrics(all_rows, carrier, today):
    """Map hover metrics per airline: YTD flown rev, vLY, target-ready, EU-APAC, ondPax, atv."""
    airline_rows = [r for r in all_rows if r["carrier"] == carrier]
    if not airline_rows:
        return None

    year = today.year
    ytd_rows = [r for r in airline_rows if r["outbounddate"].startswith(f"{year}-") and r["outbounddate"][:10] <= today.strftime("%Y-%m-%d")]
    ly_ytd_rows = [r for r in airline_rows if r["outbounddate"].startswith(f"{year - 1}-") and r["outbounddate"][5:10] <= today.strftime("%m-%d")]

    ytd_rev = sum(r["revenue"] for r in ytd_rows)
    ly_ytd_rev = sum(r["revenue"] for r in ly_ytd_rows)
    ytd_pax = sum(r["pax"] for r in ytd_rows)

    eu_apac_rev = sum(
        r["revenue"] for r in ytd_rows
        if (r["dep_country"] in EU_COUNTRIES and r["arr_country"] in APAC_COUNTRIES)
        or (r["dep_country"] in APAC_COUNTRIES and r["arr_country"] in EU_COUNTRIES)
    )
    eu_apac_rev_ly = sum(
        r["revenue"] for r in ly_ytd_rows
        if (r["dep_country"] in EU_COUNTRIES and r["arr_country"] in APAC_COUNTRIES)
        or (r["dep_country"] in APAC_COUNTRIES and r["arr_country"] in EU_COUNTRIES)
    )

    return {
        "iata": carrier,
        "ytdFlownRevUsd": round(ytd_rev, 0),
        "ytdFlownRevLyUsd": round(ly_ytd_rev, 0),
        "ytdFlownRevVlyPct": pct_change(ytd_rev, ly_ytd_rev),
        "euApacRevUsd": round(eu_apac_rev, 0),
        "euApacRevLyUsd": round(eu_apac_rev_ly, 0),
        "euApacRevVlyPct": pct_change(eu_apac_rev, eu_apac_rev_ly),
        "npbrUsd": round(ytd_rev, 0),
        "ondPax": int(ytd_pax),
        "atvUsd": safe_div(ytd_rev, ytd_pax),
        "lastUpdated": today.strftime("%Y-%m-%d"),
        "source": "aggregate.py",
    }


def compute_timeseries(all_rows, carrier):
    """Monthly rev + pax trendline for the account detail page trendline."""
    airline_rows = [r for r in all_rows if r["carrier"] == carrier]
    by_month = defaultdict(lambda: {"revenue": 0.0, "pax": 0.0})
    for r in airline_rows:
        m = r["outboundmonth"]
        if not m:
            continue
        by_month[m]["revenue"] += r["revenue"]
        by_month[m]["pax"] += r["pax"]
    return [
        {"month": m, "revenue": round(v["revenue"], 0), "pax": int(v["pax"])}
        for m, v in sorted(by_month.items())
    ]


def find_default_csv():
    home = Path.home()
    candidates = sorted(glob.glob(str(home / "Downloads" / "noSave_*.csv")), key=os.path.getmtime, reverse=True)
    return candidates[0] if candidates else None


def main():
    if len(sys.argv) < 2:
        csv_path = find_default_csv()
        if not csv_path:
            print("No noSave_*.csv found in ~/Downloads; pass path explicitly.")
            sys.exit(1)
        print(f"[auto] Using newest CSV: {csv_path}")
    else:
        csv_path = sys.argv[1]

    print(f"Loading {csv_path}...")
    rows = load_rows(csv_path)
    print(f"  {len(rows):,} rows loaded (excluding: {sorted(EXCLUDED_CARRIERS)})")

    carriers = sorted({r["carrier"] for r in rows})
    print(f"  {len(carriers)} carriers present: {carriers}")

    today = datetime.now(timezone.utc)

    DATA_VENDOR_DIR.mkdir(parents=True, exist_ok=True)
    TIMESERIES_DIR.mkdir(parents=True, exist_ok=True)

    all_metrics = []
    for carrier in carriers:
        dataset = compute_airline_dataset(rows, carrier)
        if not dataset:
            continue

        out_dir = DATA_VENDOR_DIR / carrier
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "latest.json").write_text(json.dumps(dataset, indent=2))

        m = compute_metrics(rows, carrier, today)
        if m:
            all_metrics.append(m)

        ts = compute_timeseries(rows, carrier)
        (TIMESERIES_DIR / f"{carrier}.json").write_text(json.dumps(ts, indent=2))

        latest = dataset["outbound"]["byMonth"][dataset["outbound"]["months"][-1]]
        k = latest["kpis"]
        print(f"  {carrier:>3} · {AIRLINE_NAMES.get(carrier, carrier):<25} "
              f"rev ${k['revenue']['value']:>14,.0f} | pax {k['ondPax']['value']:>10,} | "
              f"YTD ${m['ytdFlownRevUsd']:>13,.0f} vLY {m['ytdFlownRevVlyPct']:+.1f}%")

    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.write_text(json.dumps(all_metrics, indent=2))
    print(f"\nWrote {len(all_metrics)} metric rows -> {METRICS_PATH.relative_to(REPO_ROOT)}")
    print(f"Wrote {len(carriers)} datasets    -> {DATA_VENDOR_DIR.relative_to(REPO_ROOT)}/<IATA>/latest.json")
    print(f"Wrote {len(carriers)} timeseries  -> {TIMESERIES_DIR.relative_to(REPO_ROOT)}/<IATA>.json")


if __name__ == "__main__":
    main()
