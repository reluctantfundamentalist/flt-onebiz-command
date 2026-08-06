// Clause classifier: splits a free-text note into instrument clauses and
// classifies each clause into a sheet type (Promo Fund / Upfront Commission /
// ORC / other) via the commission-lever taxonomy in levers.ts. Per the BD
// rules: BSP commission => Upfront Commission (market commission); marketing
// incentive / marketing cash => Promo Fund; backend / virtual-card / NDC /
// private fare => flagged "other" for the BD to pick the sheet type (never
// silently misrouted). The matched lever also carries its release treatment,
// owning team and approver chain for the review UI.

import { classifyLever, type Lever } from "./levers";

export type SheetType = "Upfront Commission" | "Promo Fund" | "ORC" | "other";

export interface Clause {
  text: string;
  sheetType: SheetType;
  reason: string;
  lever?: Lever;
}

function splitClauses(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/,|\n|;\s*|\s+and\s+/i)
    .map((c) => c.trim())
    .filter(Boolean);
}

export function classify(text: string): Clause[] {
  return splitClauses(text).map((clause) => {
    const c = clause.toLowerCase();
    if (/\borc\b|overriding/.test(c)) {
      return { text: clause, sheetType: "ORC", reason: "ORC keyword" };
    }
    // Try the commission-lever taxonomy first — a matched lever both routes
    // the sheet type and carries release-treatment metadata downstream.
    const lever = classifyLever(clause);
    if (lever) {
      return { text: clause, sheetType: lever.sheetType, reason: `${lever.name} keyword`, lever };
    }
    if (/promo|marketing\s*(cash|fund|budget|incentive)|mdf/.test(c)) {
      return { text: clause, sheetType: "Promo Fund", reason: "promo / marketing-fund keyword" };
    }
    if (/upfront|bsp\s*commission|commission/.test(c)) {
      return { text: clause, sheetType: "Upfront Commission", reason: "commission keyword" };
    }
    return { text: clause, sheetType: "other", reason: "no sheet-type keyword — flag for BD" };
  });
}

// Exclusivity language => stacking = No.
export function detectStackingNo(fullText: string): boolean {
  return /not\s*eligible\s*for\s*any\s*other|cannot\s*be\s*combined|not\s*stackable|standalone|exclusive\s*of|in\s*lieu\s*of/.test(
    fullText.toLowerCase()
  );
}

// Ringfence language => POS=POC ringfence = Yes.
export function detectRingfence(text: string): boolean {
  return /ringfence|poc\s*=\s*pos|siti|specific\s*agent\s*only|restricted\s*to\s*agent|only\s*for\s*agent/.test(
    text.toLowerCase()
  );
}
