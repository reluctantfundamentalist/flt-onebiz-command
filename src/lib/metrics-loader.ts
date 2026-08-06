// Prefer the aggregator-written metrics.json; fall back to seed when the
// file is missing (e.g. first clone before any refresh).

import { promises as fs } from "node:fs";
import path from "node:path";
import type { AccountMetrics } from "./store";

const METRICS_PATH = path.join(process.cwd(), "src", "data", "metrics.json");

export async function loadMetrics(): Promise<AccountMetrics[]> {
  try {
    const buf = await fs.readFile(METRICS_PATH, "utf-8");
    const parsed = JSON.parse(buf);
    if (Array.isArray(parsed)) return parsed as AccountMetrics[];
  } catch {
    // fall through
  }
  return [];
}

export async function loadMetricsByIata(): Promise<Record<string, AccountMetrics>> {
  const list = await loadMetrics();
  return Object.fromEntries(list.map((m) => [m.iata, m]));
}

export interface TimeseriesPoint { month: string; revenue: number; pax: number; }
const TIMESERIES_DIR = path.join(process.cwd(), "src", "data", "timeseries");

export async function loadTimeseries(iata: string): Promise<TimeseriesPoint[]> {
  try {
    const buf = await fs.readFile(path.join(TIMESERIES_DIR, `${iata}.json`), "utf-8");
    return JSON.parse(buf) as TimeseriesPoint[];
  } catch {
    return [];
  }
}
