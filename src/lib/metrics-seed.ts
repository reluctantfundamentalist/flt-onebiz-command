// Seed hover metrics — pending Leadership_Report daily file. Replace with
// real reads from src/data/metrics.json when the first Leadership_Report
// arrives. Numbers here are placeholders sized to look plausible.

import type { AccountMetrics } from "./store";

export const SEED_METRICS: AccountMetrics[] = [
  { iata: "EK", ytdFlownRevUsd: 71_400_000, euApacRevUsd: 42_800_000, npbrUsd:  9_650_000, lastUpdated: "2026-08-05", source: "seed" },
  { iata: "EY", ytdFlownRevUsd: 12_400_000, euApacRevUsd:  7_200_000, npbrUsd:  1_240_000, lastUpdated: "2026-08-05", source: "seed" },
  { iata: "QR", ytdFlownRevUsd: 15_200_000, euApacRevUsd:  9_100_000, npbrUsd:  1_820_000, lastUpdated: "2026-08-05", source: "seed" },
  { iata: "SV", ytdFlownRevUsd:  8_700_000, euApacRevUsd:  2_100_000, npbrUsd:    780_000, lastUpdated: "2026-08-05", source: "seed" },
  { iata: "MS", ytdFlownRevUsd:  5_400_000, euApacRevUsd:  1_800_000, npbrUsd:    412_000, lastUpdated: "2026-08-05", source: "seed" },
  { iata: "AI", ytdFlownRevUsd:  6_800_000, euApacRevUsd:  3_400_000, npbrUsd:    614_000, lastUpdated: "2026-08-05", source: "seed" },
  { iata: "6E", ytdFlownRevUsd:  4_100_000, euApacRevUsd:  1_200_000, npbrUsd:    345_000, lastUpdated: "2026-08-05", source: "seed" },
  { iata: "FZ", ytdFlownRevUsd:  3_400_000, euApacRevUsd:  1_900_000, npbrUsd:    285_000, lastUpdated: "2026-08-05", source: "seed" },
  { iata: "ET", ytdFlownRevUsd:  2_800_000, euApacRevUsd:    980_000, npbrUsd:    218_000, lastUpdated: "2026-08-05", source: "seed" },
  { iata: "KQ", ytdFlownRevUsd:  1_100_000, euApacRevUsd:    380_000, npbrUsd:     84_000, lastUpdated: "2026-08-05", source: "seed" },
];

export function metricsFor(iata: string): AccountMetrics | undefined {
  return SEED_METRICS.find((m) => m.iata === iata);
}
