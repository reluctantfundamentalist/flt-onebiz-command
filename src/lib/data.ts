// Illustrative account-health data for the Egypt Air case study.
// Numbers are realistic placeholders, not real commercial figures.
// Per-airline KPI data for Account Health tab (placeholders — user to supply actuals).

import type { AirlineName } from "./accounts";

export const ACCOUNT = {
  airline: "Egypt Air",
  globalAccount: "Egypt Air (Global)",
  localMarket: "UAE (Local)",
  bd: "Snehal",
  contractedTarget: { segments: 128000, revenueUsd: 18_600_000 },
  yoy: { segments: 9.2, revenue: 6.4 },
  mom: { segments: 3.1, revenue: 2.2 },
  wow: { segments: 1.4, revenue: 0.8 },
  // quarterly actuals vs target
  quarters: [
    { q: "Q1", segments: 104_200, revenue: 14_900_000, targetSeg: 120_000 },
    { q: "Q2", segments: 112_800, revenue: 16_100_000, targetSeg: 124_000 },
    { q: "Q3", segments: 118_400, revenue: 16_950_000, targetSeg: 126_000 },
    { q: "Q4 (proj)", segments: 131_500, revenue: 18_900_000, targetSeg: 128_000 },
  ],
  bottlenecks: [
    { label: "NDC share at 14% vs 25% target", severity: "high", team: "NDC" },
    { label: "Europe-origin private fare unfiled in 3 POS", severity: "high", team: "Ops" },
    { label: "Marketing cash utilization 41%", severity: "med", team: "Marketing" },
    { label: "BSP commission lag — 6-day settlement drift", severity: "low", team: "Ops" },
  ],
  stakeholders: [
    { name: "Mostafa W.", role: "Egypt Air · Chief Commercial Officer", relation: "Global sponsor", market: "Global" },
    { name: "Amira S.", role: "Egypt Air · Head of NDC & Distribution", relation: "NDC owner", market: "Global" },
    { name: "Khalid R.", role: "Egypt Air · UAE Country Manager", relation: "Local decision-maker", market: "UAE" },
    { name: "Lina H.", role: "Egypt Air · Finance / Settlements", relation: "Commission & cash", market: "Global" },
    { name: "Snehal", role: "Trip.com · BD (account owner)", relation: "Internal owner", market: "UAE" },
  ],
  parentChild: [
    { id: "global", label: "Egypt Air (Global)", kind: "global", parent: null },
    { id: "uae", label: "UAE (Local market)", kind: "market", parent: "global" },
    { id: "emea", label: "Europe-origin scope", kind: "scope", parent: "uae" },
    { id: "ndc", label: "NDC channel scope", kind: "scope", parent: "uae" },
  ],
};

// ── Per-airline KPI data (adapted from trippy-analytics patterns) ──

export interface KpiDatum {
  id: string;
  label: string;
  value: string;
  sub: string;
  mom: number;
  spark: number[];
}

export interface AirlineAccountData {
  revenue: KpiDatum;
  ondPax: KpiDatum;
  atv: KpiDatum;
  premiumCabin: KpiDatum;
  quarters: { q: string; revenue: number; target: number }[];
  bottlenecks: { label: string; severity: string; team: string }[];
  stakeholders: { name: string; role: string; market: string }[];
}

// Placeholder data per airline — user will supply actual numbers later.
// Spark arrays are 7-month trend values in raw units.

function makeSparkVals(base: number, trend: number): number[] {
  const vals: number[] = [];
  for (let i = 0; i < 7; i++) {
    vals.push(Math.round(base * (1 + trend * (i - 3) * 0.03)));
  }
  return vals;
}

export const AIRLINE_KPIS: Partial<Record<AirlineName, AirlineAccountData>> = {
  "Emirates Airline": {
    revenue: {
      id: "revenue", label: "Revenue", value: "$18.9M", sub: "Net Flown Revenue · Q4 proj",
      mom: 3.2, spark: makeSparkVals(17_500_000, 1.15),
    },
    ondPax: {
      id: "pax", label: "OND Pax", value: "145.2K", sub: "Origin-Destination Passengers · Q4",
      mom: 4.1, spark: makeSparkVals(135_000, 1.12),
    },
    atv: {
      id: "atv", label: "ATV", value: "$1,245", sub: "Average Ticket Value · 2026-07",
      mom: 1.8, spark: makeSparkVals(1_200, 1.05),
    },
    premiumCabin: {
      id: "premium", label: "Premium Cabin", value: "$2.84M", sub: "F/J Revenue · 10.5% of total",
      mom: 2.5, spark: makeSparkVals(2_600_000, 1.10),
    },
    quarters: [
      { q: "Q1", revenue: 16_200_000, target: 15_800_000 },
      { q: "Q2", revenue: 17_500_000, target: 17_200_000 },
      { q: "Q3", revenue: 18_100_000, target: 18_000_000 },
      { q: "Q4 (proj)", revenue: 18_900_000, target: 18_600_000 },
    ],
    bottlenecks: [
      { label: "FE POO booster tracking lag — 14-day reporting", severity: "med", team: "Marketing" },
      { label: "EGW wastage 8% — GDS abuse", severity: "high", team: "NDC" },
      { label: "Student fare exclusion reducing Q2-4 payout base", severity: "low", team: "Ops" },
    ],
    stakeholders: [
      { name: "Dina Al Herais", role: "EK · VP Commercial Products B2B", market: "Global" },
      { name: "Rehab Mansoor", role: "EK · Contract Owner", market: "Global" },
      { name: "Shrey Nayar", role: "Trip.com · Regional BD", market: "UAE" },
    ],
  },
  "Etihad Airways": {
    revenue: {
      id: "revenue", label: "Revenue", value: "$12.4M", sub: "Net Flown Revenue · Q4 proj",
      mom: 2.1, spark: makeSparkVals(11_500_000, 1.10),
    },
    ondPax: {
      id: "pax", label: "OND Pax", value: "98.6K", sub: "Origin-Destination Passengers · Q4",
      mom: 1.5, spark: makeSparkVals(93_000, 1.08),
    },
    atv: {
      id: "atv", label: "ATV", value: "$1,087", sub: "Average Ticket Value · 2026-07",
      mom: -0.8, spark: makeSparkVals(1_100, 0.97),
    },
    premiumCabin: {
      id: "premium", label: "Premium Cabin", value: "$1.15M", sub: "F/J Revenue · 9.3% of total",
      mom: 1.2, spark: makeSparkVals(1_080_000, 1.06),
    },
    quarters: [
      { q: "Q1", revenue: 11_200_000, target: 11_000_000 },
      { q: "Q2", revenue: 11_800_000, target: 11_500_000 },
      { q: "Q3", revenue: 12_100_000, target: 12_000_000 },
      { q: "Q4 (proj)", revenue: 12_400_000, target: 12_500_000 },
    ],
    bottlenecks: [
      { label: "Share recovery lagging — -29% YoY on in-scope", severity: "high", team: "BD" },
      { label: "NDC penetration 10% vs 40% TFC target", severity: "high", team: "NDC" },
    ],
    stakeholders: [
      { name: "EY Commercial", role: "EY · VP Commercial", market: "Global" },
      { name: "Praveen D.", role: "Trip.com · Regional BD", market: "UAE" },
    ],
  },
  "Qatar Airways": {
    revenue: {
      id: "revenue", label: "Revenue", value: "$15.2M", sub: "Net Flown Revenue · Q4 proj",
      mom: 3.5, spark: makeSparkVals(14_000_000, 1.12),
    },
    ondPax: {
      id: "pax", label: "OND Pax", value: "112.3K", sub: "Origin-Destination Passengers · Q4",
      mom: 2.8, spark: makeSparkVals(105_000, 1.10),
    },
    atv: {
      id: "atv", label: "ATV", value: "$1,352", sub: "Average Ticket Value · 2026-07",
      mom: 2.2, spark: makeSparkVals(1_300, 1.06),
    },
    premiumCabin: {
      id: "premium", label: "Premium Cabin", value: "$3.12M", sub: "F/J Revenue · 20.5% of total",
      mom: 4.0, spark: makeSparkVals(2_800_000, 1.15),
    },
    quarters: [
      { q: "Q1", revenue: 13_800_000, target: 13_500_000 },
      { q: "Q2", revenue: 14_400_000, target: 14_200_000 },
      { q: "Q3", revenue: 14_900_000, target: 14_800_000 },
      { q: "Q4 (proj)", revenue: 15_200_000, target: 15_000_000 },
    ],
    bottlenecks: [
      { label: "Qsuite promotion under-indexing in EU", severity: "med", team: "Marketing" },
    ],
    stakeholders: [
      { name: "QR Commercial", role: "QR · VP Distribution", market: "Global" },
      { name: "Dinit M.", role: "Trip.com · BD (account owner)", market: "UAE" },
    ],
  },
  "Saudia Airlines": {
    revenue: {
      id: "revenue", label: "Revenue", value: "$8.7M", sub: "Net Flown Revenue · Q4 proj",
      mom: 5.5, spark: makeSparkVals(7_500_000, 1.20),
    },
    ondPax: {
      id: "pax", label: "OND Pax", value: "87.4K", sub: "Origin-Destination Passengers · Q4",
      mom: 4.8, spark: makeSparkVals(78_000, 1.15),
    },
    atv: {
      id: "atv", label: "ATV", value: "$995", sub: "Average Ticket Value · 2026-07",
      mom: 1.0, spark: makeSparkVals(970, 1.04),
    },
    premiumCabin: {
      id: "premium", label: "Premium Cabin", value: "$0.52M", sub: "F/J Revenue · 6.0% of total",
      mom: 3.0, spark: makeSparkVals(480_000, 1.10),
    },
    quarters: [
      { q: "Q1", revenue: 7_200_000, target: 7_000_000 },
      { q: "Q2", revenue: 7_800_000, target: 7_500_000 },
      { q: "Q3", revenue: 8_300_000, target: 8_200_000 },
      { q: "Q4 (proj)", revenue: 8_700_000, target: 8_500_000 },
    ],
    bottlenecks: [
      { label: "SA coupon campaign ROI 3:1 vs 10:1 target", severity: "high", team: "Marketing" },
      { label: "Saudization compliance — agent code restrictions", severity: "med", team: "Ops" },
    ],
    stakeholders: [
      { name: "SV Commercial", role: "SV · Head of Distribution", market: "Global" },
      { name: "Nabil D.", role: "Trip.com · BD", market: "KSA" },
    ],
  },
  "Egypt Air": {
    revenue: {
      id: "revenue", label: "Revenue", value: "$5.4M", sub: "Net Flown Revenue · Q4 proj",
      mom: 1.2, spark: makeSparkVals(5_100_000, 1.07),
    },
    ondPax: {
      id: "pax", label: "OND Pax", value: "52.1K", sub: "Origin-Destination Passengers · Q4",
      mom: 0.8, spark: makeSparkVals(50_000, 1.05),
    },
    atv: {
      id: "atv", label: "ATV", value: "$876", sub: "Average Ticket Value · 2026-07",
      mom: -0.3, spark: makeSparkVals(880, 0.99),
    },
    premiumCabin: {
      id: "premium", label: "Premium Cabin", value: "$0.42M", sub: "F/J Revenue · 7.8% of total",
      mom: 1.5, spark: makeSparkVals(400_000, 1.06),
    },
    quarters: [
      { q: "Q1", revenue: 4_900_000, target: 4_800_000 },
      { q: "Q2", revenue: 5_100_000, target: 5_000_000 },
      { q: "Q3", revenue: 5_250_000, target: 5_300_000 },
      { q: "Q4 (proj)", revenue: 5_400_000, target: 5_500_000 },
    ],
    bottlenecks: [
      { label: "NDC share at 14% vs 25% target", severity: "high", team: "NDC" },
      { label: "BSP commission lag — 6-day settlement drift", severity: "low", team: "Ops" },
    ],
    stakeholders: [
      { name: "Mostafa W.", role: "MS · Chief Commercial Officer", market: "Global" },
      { name: "Snehal B.", role: "Trip.com · BD (account owner)", market: "UAE" },
    ],
  },
  "Air India": {
    revenue: {
      id: "revenue", label: "Revenue", value: "$6.8M", sub: "Net Flown Revenue · Q4 proj",
      mom: 6.2, spark: makeSparkVals(5_800_000, 1.22),
    },
    ondPax: {
      id: "pax", label: "OND Pax", value: "78.3K", sub: "Origin-Destination Passengers · Q4",
      mom: 5.5, spark: makeSparkVals(68_000, 1.18),
    },
    atv: {
      id: "atv", label: "ATV", value: "$868", sub: "Average Ticket Value · 2026-07",
      mom: 0.5, spark: makeSparkVals(855, 1.02),
    },
    premiumCabin: {
      id: "premium", label: "Premium Cabin", value: "$0.68M", sub: "F/J Revenue · 10.0% of total",
      mom: 3.2, spark: makeSparkVals(620_000, 1.12),
    },
    quarters: [
      { q: "Q1", revenue: 5_600_000, target: 5_400_000 },
      { q: "Q2", revenue: 6_100_000, target: 6_000_000 },
      { q: "Q3", revenue: 6_500_000, target: 6_400_000 },
      { q: "Q4 (proj)", revenue: 6_800_000, target: 6_700_000 },
    ],
    bottlenecks: [
      { label: "AI merger integration — fare filing gaps", severity: "high", team: "Ops" },
      { label: "LCC competition on DEL-DXB corridor", severity: "med", team: "BD" },
    ],
    stakeholders: [
      { name: "AI Commercial", role: "AI · VP Revenue", market: "Global" },
      { name: "Anuj B.", role: "Trip.com · BD (account owner)", market: "India" },
    ],
  },
};

export const TEAMS = [
  { key: "NDC", label: "NDC Team", color: "var(--ndc)", lead: "Distributes & drives NDC share" },
  { key: "LCC", label: "LCC Team", color: "var(--lcc)", lead: "Low-cost carrier direct connect" },
  { key: "Ops", label: "Ops (Fare filing & commission)", color: "var(--ops)", lead: "Files fares, settles commission/backend/VCF" },
  { key: "Marketing", label: "Marketing", color: "var(--mkt)", lead: "Deploys marketing cash & co-op" },
] as const;

// Approvers that already exist in flt onebiz today — the existing flow we reuse.
export const APPROVERS = [
  { name: "Carrie W.", role: "Product approval" },
  { name: "Finance Ops", role: "Fund Hub routing" },
  { name: "Regional Head", role: "Market sign-off" },
];
