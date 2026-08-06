// Emirates FY25-26 Ticketing Agreement — full contract data model.
// All values extracted from Trip.com FY2526_Agreement_Final.docx.pdf
// Effective: 01 April 2025 – 31 March 2026 (originally 7 months, per terms)

export interface TierThreshold {
  minRevenue: number;        // USD
  maxRevenue: number | null; // null = "Above" (open-ended)
  incentivePct: number;
  marketingPct: number;
  partnershipMarketingPct?: number;
  totalPct: number;
}

export interface ContractQuarter {
  label: string;
  period: string;
  tiers: TierThreshold[];
}

export interface Booster {
  key: string;
  name: string;
  tableRef: string;        // "Table 2", "Table 3", etc.
  period: string;
  valueDescription: string;
  terms: string[];
  focusDestinations?: string;
}

export interface ContractData {
  agreementDate: string;
  parties: string;
  quarters: ContractQuarter[];
  boosters: Booster[];
  egwCoupon: {
    description: string;
    perSegmentUsd: number;
    terms: string[];
  };
  marketing: {
    description: string;
    process: string[];
    roiTarget: string;
  };
  keyExclusions: string[];
}

// ── Schedule 2: Global Override Incentive ──

const QUARTERS: ContractQuarter[] = [
  {
    label: "Q1",
    period: "01 April 2025 – 30 June 2025",
    tiers: [
      { minRevenue: 28_800_000, maxRevenue: 32_600_000, incentivePct: 0.70, marketingPct: 0.25, totalPct: 0.95 },
      { minRevenue: 32_600_001, maxRevenue: 36_400_000, incentivePct: 0.90, marketingPct: 0.25, totalPct: 1.15 },
      { minRevenue: 36_400_001, maxRevenue: 40_100_000, incentivePct: 1.00, marketingPct: 0.25, totalPct: 1.25 },
      { minRevenue: 40_100_001, maxRevenue: null, incentivePct: 1.10, marketingPct: 0.25, totalPct: 1.35 },
    ],
  },
  {
    label: "Q2",
    period: "01 July 2025 – 30 September 2025",
    tiers: [
      { minRevenue: 48_700_001, maxRevenue: 53_200_000, incentivePct: 0.70, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.05 },
      { minRevenue: 53_200_001, maxRevenue: 55_400_000, incentivePct: 0.90, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.25 },
      { minRevenue: 55_400_001, maxRevenue: 57_600_000, incentivePct: 1.00, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.35 },
      { minRevenue: 57_600_001, maxRevenue: 62_000_000, incentivePct: 1.10, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.45 },
    ],
  },
  {
    label: "Q3",
    period: "01 October 2025 – 31 December 2025",
    tiers: [
      { minRevenue: 60_900_001, maxRevenue: 65_200_000, incentivePct: 0.70, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.05 },
      { minRevenue: 65_200_001, maxRevenue: 69_100_000, incentivePct: 0.90, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.25 },
      { minRevenue: 69_100_001, maxRevenue: 74_500_000, incentivePct: 1.00, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.35 },
      { minRevenue: 74_500_001, maxRevenue: null, incentivePct: 1.10, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.45 },
    ],
  },
  {
    label: "Q4",
    period: "01 January 2026 – 31 March 2026",
    tiers: [
      { minRevenue: 59_000_001, maxRevenue: 64_400_000, incentivePct: 0.70, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.05 },
      { minRevenue: 64_400_001, maxRevenue: 67_000_000, incentivePct: 0.90, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.25 },
      { minRevenue: 67_000_001, maxRevenue: 69_700_000, incentivePct: 1.00, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.35 },
      { minRevenue: 69_700_001, maxRevenue: 75_100_000, incentivePct: 1.10, marketingPct: 0.25, partnershipMarketingPct: 0.10, totalPct: 1.45 },
    ],
  },
];

// ── Schedule 3: Boosters ──

const BOOSTERS: Booster[] = [
  {
    key: "premium",
    name: "Premium Booking Class Booster",
    tableRef: "Table 2",
    period: "01 April 2025 – 31 March 2026",
    valueDescription: "0.60% on First & Business (Flex and Flex Plus only)",
    terms: [
      "Applicable on all routes, payable on Flex and Flex Plus fare brands in First (F) and Business (J) cabins only",
      "Flights originating from Dubai (3rd freedom) are excluded from payout",
      "Student fares SWW2 (Global) and STU2, STN2 (Local) excluded from trigger and payout",
    ],
  },
  {
    key: "fe-poo",
    name: "Far East (FE) Point of Origin Booster",
    tableRef: "Table 3",
    period: "01 September 2025 – 31 March 2026 (Ticketing: 11 Aug 2025 – 31 Mar 2026)",
    valueDescription: "$5 per OD Pax (Economy/Premium Economy) · $7 per OD Pax (First/Business Flex/Flex Plus)",
    terms: [
      "POO Far East (excluding JP and HK point of sale and point of origin)",
      "TH-HK route excluded from trigger & payout",
      "RBD V included for trigger only, excluded from payout",
      "RBD G excluded from trigger & payout",
      "EK-marketed FZ-operated flights included for trigger only, excluded from payout",
    ],
  },
  {
    key: "china-dest",
    name: "Destination China OD Pax Incentive",
    tableRef: "Table 4",
    period: "01 Sep 2025 – 31 March 2026 (Ticketing: 11 Aug 2025 – 31 Mar 2026)",
    valueDescription: "Tiered: $10 (9,205-9,978 pax) · $20 (9,979-11,527 pax) · $30 (11,528+ pax)",
    terms: [
      "POO all regions excluding Far East, Australia & New Zealand, and DXB",
      "Travel periods 01-30 Sep 2025 and 01-30 Nov 2025 excluded from trigger and payout out of Europe",
      "RBD V included for trigger only, excluded from payout",
      "RBD G excluded from trigger & payout",
    ],
  },
  {
    key: "eu-poo-may",
    name: "Point of Origin Europe Pax Incentives (May–Jun)",
    tableRef: "Table 5",
    period: "01 May 2025 – 31 June 2025",
    valueDescription: "Roll-back to base 1,502 pax: $15 (1,503-4,499) · $30 (4,500-7,299) · $60 (7,300+) per True OD Pax",
    terms: [
      "All slabs roll back to base of 1,502 True OD Pax EU-Focus Destinations",
      "RBD V excluded from trigger & payout",
      "RBD G excluded from trigger & payout",
      "EK-marketed EK-operated flights only",
    ],
    focusDestinations: "Far East: TH, VN, CN, SG, MY, HK, KH, KIX, DPS | West Asia & Indian Ocean: KHI, MU, MV, SC, MG, LK | Africa: ALL (excl CPT) | AU/NZ: ALL",
  },
  {
    key: "eu-poo-sep",
    name: "Point of Origin Europe Pax Incentives (Sep)",
    tableRef: "Table 6",
    period: "01 September 2025 – 30 September 2025",
    valueDescription: "Roll-back to base 715 pax: $10 (2,725-3,599) · $20 (3,600-4,699) · $30 (4,700+) per True OD Pax",
    terms: [
      "All slabs roll back to base of 715 True OD Pax EU-Focus Destinations",
      "RBD V excluded from trigger & payout",
      "RBD G excluded from trigger & payout",
      "EK-marketed EK-operated flights only",
      "Student fares SWW2/STU2/STN2 excluded",
    ],
    focusDestinations: "GMEI: All excl AE | Far East: TH, VN, CN, SG, MY, HK, KH, PH, TW | West Asia & IO: PK, BD, MV, SC, MG, LK, IN | Africa: ALL (excl CPT/CKY/DSS/ACC/ABJ) | AU/NZ: ADL, PER",
  },
  {
    key: "eu-poo-nov",
    name: "Point of Origin Europe Pax Incentives (Nov)",
    tableRef: "Table 7",
    period: "01 November 2025 – 30 November 2025",
    valueDescription: "Roll-back to base 580 pax: $10 (4,674-5,699) · $20 (5,200-7,999) · $30 (7,000+) per True OD Pax",
    terms: [
      "All slabs roll back to base of 580 True OD Pax EU-Focus Destinations",
      "RBD V excluded from trigger & payout",
      "RBD G excluded from trigger & payout",
      "EK-marketed EK-operated flights only",
      "Student fares SWW2/STU2/STN2 excluded",
    ],
    focusDestinations: "GMEI: ALL excl AE | Far East: BKK, SGN, HND, ICN, CN, SG, MY, HK, DPS | West Asia & IO: KHI, PEW, SKT, BD, MU, MV, SC, MG, LK, MAA/TRV | Africa: ALL (excl CPT/ACC/ABJ/CKY/DSS)",
  },
];

// ── Schedule 3: EGW Coupon ──

const EGW_COUPON = {
  description: "Coupon incentive: USD 2.5 per flown segment applicable on all points of sale",
  perSegmentUsd: 2.5,
  terms: [
    "Payments made within 90 days after end of each 12-month period from Effective Date",
    "Payments in USD",
    "Trip.com agrees to use pre-approved form of payments for bookings on EGW",
    "NDC bookings through GDS (Amadeus, Travelport, Sabre, Travelsky, Infini) shall NOT qualify",
  ],
};

// ── Schedule 4: Marketing Payouts ──

const MARKETING = {
  description: "The Carrier retains the Marketing Payouts for each quarter to be used for marketing activities as agreed by the parties.",
  process: [
    "Trip.com submits a marketing plan with detailed costs at the end of each financial quarter",
    "Carrier approves the marketing plan",
    "Trip.com carries out the campaign and creates a closing report",
    "Trip.com submits an invoice alongside the closing report",
    "Within 90 days of receiving the closing report and invoice, the Carrier releases the Marketing Payouts",
  ],
  roiTarget: "10:1 (10 to 1 return on investment for each campaign)",
};

// ── Key Exclusions (from Schedule 2 Terms & Conditions) ──

const KEY_EXCLUSIONS = [
  "Flights originating from Dubai (3rd freedom): trigger only, excluded from payout",
  "EU origin Economy cabin to DXB (4th freedom): trigger only, excluded from payout (Q2-Q4)",
  "Student fares SWW2 (Global) and STU2, STN2 (Local): excluded from trigger and payout (Q2-Q4)",
  "RBD 'V': included for trigger only, excluded from payout",
  "RBD 'G': excluded from trigger and payout",
  "EK-marketed FZ-operated flights: trigger only, excluded from payout",
  "Payments made 90 days after quarter close, in USD",
  "Payouts on base fare + YQ (Fuel Surcharge)",
];

export const EK_CONTRACT: ContractData = {
  agreementDate: "01 April 2025",
  parties: "Emirates & Trip.com (Trip.com Travel Singapore Pte Ltd + Group Affiliates)",
  quarters: QUARTERS,
  boosters: BOOSTERS,
  egwCoupon: EGW_COUPON,
  marketing: MARKETING,
  keyExclusions: KEY_EXCLUSIONS,
};

// Helper: format USD revenue in millions
export function fmtRevenueM(n: number): string {
  return `$${(n / 1_000_000).toFixed(1)}M`;
}

// Helper: find which tier a given revenue falls into for a quarter
export function findTier(quarter: ContractQuarter, revenue: number): { tier: TierThreshold; index: number } | null {
  for (let i = 0; i < quarter.tiers.length; i++) {
    const t = quarter.tiers[i];
    if (revenue >= t.minRevenue && (t.maxRevenue === null || revenue <= t.maxRevenue)) {
      return { tier: t, index: i };
    }
  }
  return null;
}
