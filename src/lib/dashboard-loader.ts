// Loader for airline-performance datasets vendored from trippy-analytics.
// Data lives under src/data-vendor/<IATA>/latest.json; loader mirrors the
// trippy shape (AirlineDataset) so DashboardShell can consume it as-is.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { AirlineDataset } from "./dashboard-types";

const VENDOR_DIR = path.join(process.cwd(), "src", "data-vendor");

export async function loadAirlineDataset(iata: string): Promise<AirlineDataset | null> {
  try {
    const file = path.join(VENDOR_DIR, iata.toUpperCase(), "latest.json");
    const buf = await fs.readFile(file, "utf-8");
    return JSON.parse(buf) as AirlineDataset;
  } catch {
    return null;
  }
}
