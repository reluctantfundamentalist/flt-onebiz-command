// Commission-lever taxonomy — the "Lever_Commission" reference sheet.
// One row per commission instrument a BD raises, carrying the release
// treatment, owning team, approver chain, scope and fund-hub key pattern
// that flt-onebiz needs to route it.
//
// `trigger` -> auto-classify a free-text clause to a lever.
// `distinguishFrom` -> the disambiguation rule a human applies ("incentive"
// alone is ambiguous; backend vs NDC vs marketing incentive, etc.).
// Levers with no fltonebiz sheet type (backend / VCF / NDC / private fare)
// route to "other" and are flagged for the BD to pick the sheet — never
// silently misrouted (per the BD rules encoded in classify.ts).

import type { SheetType } from "./classify";

export interface Lever {
  name: string;
  sheetType: SheetType; // where this lever routes in fltonebiz
  fltonebizSheetType: string; // exact "Sheet type" dropdown value ("" = BD picks)
  valueType: "%" | "USD";
  trigger: RegExp; // keyword(s) that identify this lever in free text
  distinguishFrom: string; // disambiguation note
  scopeDimensions: string;
  owningTeam: string;
  approverChain: string;
  fundHubKeyPattern: string;
  releaseTreatment: string;
}

export const LEVERS: Lever[] = [
  {
    name: "BSP Commission",
    sheetType: "Upfront Commission",
    fltonebizSheetType: "Upfront Commission",
    valueType: "%",
    trigger: /\b(bsp|iata)\s*commission\b/i,
    distinguishFrom: '"incentive" alone is ambiguous; backend is a different instrument',
    scopeDimensions: "market;origin?",
    owningTeam: "Ops",
    approverChain: "Finance Ops",
    fundHubKeyPattern: "",
    releaseTreatment: "Fare discount (BSP pass-through)",
  },
  {
    name: "Backend Incentive",
    sheetType: "other",
    fltonebizSheetType: "",
    valueType: "%",
    trigger: /\bbackend\b/i,
    distinguishFrom: "distinct from NDC incentive and marketing incentive",
    scopeDimensions: "market",
    owningTeam: "Ops",
    approverChain: "Finance Ops",
    fundHubKeyPattern: "",
    releaseTreatment: "Fare discount (retro backend)",
  },
  {
    name: "Virtual Card Incentive",
    sheetType: "other",
    fltonebizSheetType: "",
    valueType: "%",
    trigger: /\b(virtual\s+card|vcf)\b/i,
    distinguishFrom: "distinct from backend",
    scopeDimensions: "market",
    owningTeam: "Ops",
    approverChain: "",
    fundHubKeyPattern: "",
    releaseTreatment: "Fare discount (VCF settlement)",
  },
  {
    name: "NDC Subsidy",
    sheetType: "other",
    fltonebizSheetType: "",
    valueType: "USD",
    trigger: /\bndc\b/i,
    distinguishFrom: '"incentive" alone is ambiguous',
    scopeDimensions: "channel;market",
    owningTeam: "NDC",
    approverChain: "NDC lead",
    fundHubKeyPattern: "",
    releaseTreatment: "Channel development fund",
  },
  {
    name: "Marketing Cash",
    sheetType: "Promo Fund",
    fltonebizSheetType: "Promo Fund",
    valueType: "USD",
    trigger: /\bmarketing\s+(cash|fund)\b|\bmdf\b/i,
    distinguishFrom: "distinct from marketing incentive",
    scopeDimensions: "market",
    owningTeam: "Marketing",
    approverChain: "Marketing",
    fundHubKeyPattern: "team_market_External Marketing Fund_amount_id",
    releaseTreatment: "Marketing fund (co-op)",
  },
  {
    name: "Marketing Incentive",
    sheetType: "Promo Fund",
    fltonebizSheetType: "Promo Fund",
    valueType: "%",
    trigger: /\bmarketing\s+incentive\b/i,
    distinguishFrom: "distinct from marketing cash",
    scopeDimensions: "market",
    owningTeam: "Marketing",
    approverChain: "",
    fundHubKeyPattern: "",
    releaseTreatment: "Fare discount (marketing-linked)",
  },
  {
    name: "Private Fare",
    sheetType: "other",
    fltonebizSheetType: "",
    valueType: "%",
    trigger: /\b(private|net)\s+fare\b/i,
    distinguishFrom: "",
    scopeDimensions: "origin;POS",
    owningTeam: "Ops",
    approverChain: "Fare filing",
    fundHubKeyPattern: "",
    releaseTreatment: "Fare discount (private fare)",
  },
];

// First lever whose trigger matches a clause; null if none.
export function classifyLever(clause: string): Lever | null {
  const c = clause.toLowerCase();
  return LEVERS.find((l) => l.trigger.test(c)) ?? null;
}
