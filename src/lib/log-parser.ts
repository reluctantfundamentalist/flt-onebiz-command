// Enhanced log parser: detects form type + extracts field values from free-text notes.
// Dual-path extraction: labeled fields (GDS Type:, Selling Period:, etc.) AND
// natural-language extraction from casual chat-style notes with no field labels.

import { classify, type Clause } from "./classify";
import { type FormCategory } from "./log-schemas";

export interface ParsedEntry {
  category: FormCategory;
  confidence: "high" | "medium" | "low";
  reason: string;
  clauses: Clause[];
  extractedValues: Record<string, string>;
}

// ── Classification signals ──

const SIGNALS: Record<FormCategory, { strong: RegExp[]; weak: RegExp[] }> = {
  "flight-incentive": {
    strong: [
      /selling\s*period/i,
      /fare\s*brand/i,
      /incentive\s*program/i,
      /outbound\s*period/i,
      /\b(gds\s*type)\b/i,
      /\b(rbd)\b.*\b(basic|value|comfort|deluxe)\b/i,
      /backend\s*incentive\s*(amount|rate)\s*per\s*ticket/i,
      /priority\s*agent\s*code/i,
    ],
    weak: [
      /\b(inbound|outbound)\b.*\bperiod\b/i,
      /fare\s*(type|basis)/i,
      /agent\s*code/i,
    ],
  },
  commission: {
    strong: [
      /upfront\s*commission\s*(type|rate)/i,
      /commission\s*(amount|rate)\s*[-–]\s*(economy|business)/i,
      /commission\s*management/i,
      /\b(newtravelfusion|travelfusion)\b/i,
      /form\s*of\s*tour\s*code/i,
      /\b(bsp|iata)\s*commission\b/i,
    ],
    weak: [
      /upfront\s*commission/i,
      /\bcommission\b/i,
      /\bbackend(\s+incentive)?\b/i,
      /\b(virtual\s*card|vcf)\b/i,
      /(economy|business|premium\s*economy)\s*[-–]\s*\d+%/i,
      /designated\s*airport\s*restriction/i,
    ],
  },
  campaign: {
    strong: [
      /\b(coupon|campaign)\b/i,
      /ladder\s*discount/i,
      /\b(crm)\b/i,
      /coupon\s*(mechanism|drop|quantity|type)/i,
      /spend\s*\d+.*discount/i,
      /\b(od\s*pair)\b/i,
      /budget\s*(currency|fund|source)/i,
      /targeted\s*airline/i,
      /cost\s*center/i,
    ],
    weak: [
      /cabin\s*class.*(economy|business)/i,
      /coupon\s*(effective|code)/i,
      /\b(sar|aed)\s*\d+/i,
      /min\s*spend/i,
    ],
  },
};

function scoreCategory(text: string, cat: FormCategory): number {
  const signals = SIGNALS[cat];
  let score = 0;
  for (const re of signals.strong) {
    if (re.test(text)) score += 3;
  }
  for (const re of signals.weak) {
    if (re.test(text)) score += 1;
  }
  return score;
}

export function detectFormCategory(text: string): ParsedEntry["category"] {
  const scores: Record<FormCategory, number> = {
    "flight-incentive": scoreCategory(text, "flight-incentive"),
    commission: scoreCategory(text, "commission"),
    campaign: scoreCategory(text, "campaign"),
  };

  const entries = Object.entries(scores) as [FormCategory, number][];
  entries.sort((a, b) => b[1] - a[1]);

  if (entries[0][1] === 0) {
    const lower = text.toLowerCase();
    if (/\b(coupon|campaign|crm|ladder|spend\s*\d+.*off)\b/i.test(lower)) return "campaign";
    if (/commission|bsp\b|backend|upfront|virtual\s*card|vcf|ndc\b/i.test(lower)) return "commission";
    return "flight-incentive";
  }

  if (entries[0][1] >= entries[1][1] + 2) return entries[0][0];
  return entries[0][0];
}

// ── Labeled field extraction ──

const LABELED_EXTRACTORS: { key: string; pattern: RegExp; transform?: (m: RegExpMatchArray) => string }[] = [
  { key: "agentCode", pattern: /agent\s*code[:\s]*([A-Z0-9, ]+)/i },
  { key: "priorityAgentCode", pattern: /priority\s*agent\s*code[:\s]*([\w,]+)/i },
  { key: "vc", pattern: /\bVC[:\s]*(\w{2,3})\b/i },
  { key: "mc", pattern: /\bMC[:\s]*(\w{2,3})\b/i },
  { key: "oc", pattern: /\bOC[:\s]*(\w{2,3})\b/i },
  { key: "gdsType", pattern: /GDS\s*Type[:\s]*([A-Za-z, ]+?)(?:\s*\n|$|\.|,)/i },
  { key: "sellingPeriod", pattern: /selling\s*period[:\s]*([\d\/>]+)/i },
  { key: "outboundPeriod", pattern: /outbound\s*period[:\s]*([\d\/>]+)/i },
  { key: "inboundPeriod", pattern: /inbound\s*period[:\s]*([\d\/>]+)/i },
  { key: "travelPeriod", pattern: /travel\s*period[:\s]*([\d\/>]+)/i },
  { key: "salesPeriod", pattern: /sales\s*period[:\s]*([\d\/>]+)/i },
  { key: "campaignPeriod", pattern: /campaign\s*period[:\s]*([\d\/>]+)/i },
  { key: "fareType", pattern: /fare\s*type[:\s]*(publish|private)/i, transform: (m) => m[1].charAt(0).toUpperCase() + m[1].slice(1) },
  { key: "cabin", pattern: /cabin[:\s]*(economy|business|first|premium\s*economy|all)/i },
  { key: "tripType", pattern: /trip\s*type[:\s]*(OW|RT|OJ|All)/i },
  { key: "routeOriginDest", pattern: /route\s*[:\s]*Origin\s*\n?\s*([\w\/, \n-]+)/i },
  { key: "reverseRoute", pattern: /revers(?:ed|e)\s*routes?.*?(Yes|No)/i },
  { key: "tourCode", pattern: /tour\s*code[:\s]*(\w+)/i },
  { key: "accountCode", pattern: /account\s*code[:\s]*(\w+)/i },
  { key: "ticketDesignator", pattern: /ticket\s*designator[:\s]*(\w+)/i },
  { key: "fareBasis", pattern: /fare\s*basis[:\s]*(\w+)/i },
  { key: "passengerType", pattern: /passenger\s*type[:\s]*(ADT|CHD|INF|ALL)/i },
  { key: "upfrontCommissionType", pattern: /upfront\s*commission\s*type[:\s]*(rate|amount)/i },
  { key: "currency", pattern: /currency[:\s]*(USD|AED|SAR|GBP|EUR)/i },
  { key: "campaignName", pattern: /campaign\s*name[:\s]*(.+?)(?:\n|$)/i },
  { key: "costCenter", pattern: /cost\s*center[:\s]*(\d+)/i },
  { key: "totalBudget", pattern: /(?:total\s*budget\s*amount|budget)[:\s]*(\d[\d,]*)/i },
  { key: "couponDropMarket", pattern: /coupon\s*drop\s*market[:\s]*(\w+)/i },
  { key: "couponDiscountType", pattern: /coupon\s*discount\s*type[:\s]*(ladder\s*discount|flat\s*discount|percentage\s*off)/i },
  { key: "couponQuantity", pattern: /coupon\s*quantity[:\s]*(\d+)/i },
  { key: "maxUsagesPerUid", pattern: /max\s*count\s*usages\s*per\s*uid[:\s]*(\d+)/i },
  { key: "cabinClass", pattern: /cabin\s*class[:\s]*([\w, ]+)/i },
  { key: "stackedWithExisting", pattern: /stacked\s*with\s*(?:the\s*)?existing\s*deals[:\s]*(Y|N|Yes|No)/i, transform: (m) => m[1].startsWith("Y") ? "Y" : "N" },
  { key: "stackingRequirements", pattern: /stacking\s*requirements[:\s]*(.+?)(?:\n|$)/i },
  { key: "paymentMethod", pattern: /payment\s*method[:\s]*(\w[\w ]+)/i },
  { key: "paymentDate", pattern: /payment\s*date[:\s]*(.+?)(?:\n|$)/i },
  { key: "tripEntity", pattern: /trip\s*entity[:\s]*(.+?)(?:\n|$)/i },
];

function extractLabeled(text: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const ex of LABELED_EXTRACTORS) {
    const m = text.match(ex.pattern);
    if (m) {
      values[ex.key] = ex.transform ? ex.transform(m) : (m[1] || m[0]).trim();
    }
  }
  return values;
}

// ── Natural-language extraction (no field labels needed) ──

const AIRLINE_PATTERNS: [RegExp, string][] = [
  [/\b(emirates)\b/i, "EK"],
  [/\b(etihad)\b/i, "EY"],
  [/\b(qatar\s*airways?)\b/i, "QR"],
  [/\b(saudia)\b/i, "SV"],
  [/\b(egypt\s*air)\b/i, "MS"],
  [/\b(air\s*india)\b/i, "AI"],
];

const CARRIER_NAME_MAP: Record<string, string> = {
  EK: "Emirates", EY: "Etihad Airways", QR: "Qatar Airways",
  SV: "Saudia Airlines", MS: "Egypt Air", AI: "Air India",
};

const GDS_NAMES = ["Abacus", "Amadeus", "Sabre", "Travelport", "Travelsky", "Infini", "NewTravelFusion"];
const CABIN_TYPES = ["Economy", "Premium Economy", "Business", "First"];

function extractNaturalLanguage(text: string, category: FormCategory): Record<string, string> {
  const v: Record<string, string> = {};
  const lower = text.toLowerCase();

  // ── Percentages ──
  const pctMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*%/g)];
  const pctValues = pctMatches.map((m) => parseFloat(m[1]));

  // ── Labeled dollar amounts: "Basic $20", "Value USD 30", "Basic - USD 20" ──
  const labeledUsd = [...text.matchAll(
    /(\bBasic\b|\bValue\b|\bComfort\b|\bDeluxe\b|\bEconomy\b|\bPremium\s*Economy\b|\bBusiness\b|\bFirst\b)\s*(?:[-–]\s*)?(?:USD\s*)?\$?\s*(\d+(?:\.\d+)?)\s*k?\b/gi
  )];

  // ── Airline detection ──
  for (const [re, code] of AIRLINE_PATTERNS) {
    if (re.test(lower)) {
      v.vc = code; v.mc = code; v.oc = code;
      break;
    }
  }

  // ── Cabin ──
  for (const cabin of CABIN_TYPES) {
    if (lower.includes(cabin.toLowerCase())) { v.cabin = cabin; break; }
  }

  // ── GDS (match only known names, not greedy) ──
  const foundGDS = GDS_NAMES.filter((g) => lower.includes(g.toLowerCase()));
  if (foundGDS.length > 0) v.gdsType = foundGDS.join(",");

  // ── Trip type ──
  if (/\bOW\b|one[- ]way/i.test(text)) v.tripType = "OW";
  else if (/\bRT\b|round[- ]trip/i.test(text)) v.tripType = "RT";

  // ── Carrier codes ──
  const ccMatch = text.match(/\b(EK|EY|QR|SV|MS|AI)\b/);
  if (ccMatch && !v.vc) {
    v.vc = ccMatch[1]; v.mc = ccMatch[1]; v.oc = ccMatch[1];
  }

  // ── Request summary ──
  v.requestSummary = text.slice(0, 300).trim();

  // ── Currency ──
  for (const cur of ["USD", "AED", "SAR", "GBP", "EUR"]) {
    if (text.toUpperCase().includes(cur)) { v.currency = cur; break; }
  }
  if (!v.currency && pctValues.length > 0) v.currency = "USD";

  // ── Category-specific ──

  if (category === "flight-incentive") {
    // Labeled dollar amounts → backend incentive
    if (labeledUsd.length > 0) {
      const seen = new Set<string>();
      const lines: string[] = [];
      for (const m of labeledUsd) {
        const key = m[1].toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          lines.push(`${m[1]} - USD ${m[2]}`);
        }
      }
      if (lines.length > 0) v.backendIncentive = lines.join("\n");
    } else if (pctValues.length > 0) {
      v.backendIncentive = pctValues.map((p) => `${p}%`).join(", ");
    }

    // Fare brands section
    const brandSection = text.match(
      /fare\s*brands?\s*[-:]*\s*((?:\b(?:Basic|Value|Comfort|Deluxe)\b\s*\$?\s*\d+[\s,]*)+)/i
    );
    if (brandSection) {
      const cleaned = brandSection[1]
        .replace(/\s*\$\s*/g, " USD ")
        .replace(/(\d+)\s*(?=[A-Z])/g, "$1\n")
        .trim();
      v.rbd = `As per fare brands below\n\n${cleaned}`;
    }
  }

  if (category === "commission") {
    // By-cabin rates: "Economy – 5%", "Business – 8%"
    const cabinRateRe = /(Economy|Premium\s*Economy|Business|First|All)\s*[-–]\s*(\d+(?:\.\d+)?)\s*%/gi;
    const lines: string[] = [];
    let m;
    while ((m = cabinRateRe.exec(text)) !== null) {
      lines.push(`${m[1]} – ${m[2]}%`);
    }
    if (lines.length > 0) v.commissionRate = lines.join("\n");
    else if (pctValues.length > 0) v.commissionRate = pctValues.map((p) => `${p}%`).join(", ");

    v.upfrontCommissionType = "Rate";
  }

  if (category === "campaign") {
    const nameMatch = text.match(/(?:CRM|campaign)\s*[-:]\s*(.+?)(?:[,\n]|$)/i);
    v.campaignName = nameMatch ? nameMatch[1].trim() : text.slice(0, 80).trim();

    // Budget: "Budget USD 6000"
    const budgetMatch = text.match(/(?:budget|total)\s*(?:USD|SAR|AED)?\s*(\d[\d,]*)/i);
    if (budgetMatch) v.totalBudget = budgetMatch[1].replace(/,/g, "");

    // Ladder SAR: "Spend 500-999: SAR 30"
    const sarLadder = [...text.matchAll(
      /spend\s*(\d+)\s*[-–]\s*(\d+)\s*:\s*(?:SAR|USD|AED)?\s*(\d+)/gi
    )];
    if (sarLadder.length >= 1) {
      v.couponDiscountType = "Ladder Discount";
      v.valuePerCoupon = sarLadder.map((m) => `Spend ${m[1]} - ${m[2]}: ${m[3]}`).join("\n");
      v.cappingAmount = sarLadder[sarLadder.length - 1][3];
    }

    // Bare SAR amounts (no "spend" label)
    const sarAmounts = [...text.matchAll(/SAR\s*(\d+)/gi)].map((m) => m[1]);
    if (sarLadder.length === 0 && sarAmounts.length >= 2) {
      v.couponDiscountType = "Ladder Discount";
      v.budgetCurrency = "SAR";
      v.valuePerCoupon = sarAmounts.map((a) => `SAR ${a}`).join("\n");
      v.cappingAmount = `SAR ${sarAmounts[sarAmounts.length - 1]}`;
    }

    const cabins = CABIN_TYPES.filter((c) => lower.includes(c.toLowerCase()));
    if (cabins.length > 0) v.cabinClass = cabins.join(",");
    v.objectives = text.slice(0, 300).trim();
  }

  // ── Date ranges ──
  // Match the first date range in the text (selling/travel/sales/outbound/inbound/campaign)
  // and populate ALL relevant period fields regardless of category.
  const dateRanges = [...text.matchAll(/(\d{4}\/\d{2}\/\d{2})\s*[>–-]\s*(\d{4}\/\d{2}\/\d{2})/g)];
  if (dateRanges.length > 0) {
    // First date range found
    const range1 = `${dateRanges[0][1]}>${dateRanges[0][2]}`;
    // Second date range found (for cases like "selling period X, outbound period Y")
    const range2 = dateRanges.length >= 2 ? `${dateRanges[1][1]}>${dateRanges[1][2]}` : null;

    // Always populate selling period if we have a labeled match or any date in flight-incentive context
    if (category === "flight-incentive") {
      v.sellingPeriod = v.sellingPeriod || range1;
      if (range2) v.outboundPeriod = v.outboundPeriod || range2;
    } else if (category === "commission") {
      v.travelPeriod = v.travelPeriod || range1;
      v.salesPeriod = v.salesPeriod || range1;
      v.sellingPeriod = v.sellingPeriod || range1;
      if (range2) {
        v.travelPeriod = range1;
        v.salesPeriod = range2;
        v.sellingPeriod = range2;
      }
    } else {
      v.campaignPeriod = v.campaignPeriod || range1;
      if (range2) v.travelPeriod = v.travelPeriod || range2;
    }
  }

  // ── Stacking ──
  if (!v.stackedWithExisting) {
    v.stackedWithExisting = /exclusiv|not\s*stack|no\s*other\s*deal/i.test(lower) ? "N" : "Y";
  }

  return v;
}

// ── Attachment OCR extraction ──

function extractFromAttachment(attText: string, category: FormCategory): Record<string, string> {
  const v: Record<string, string> = {};
  if (!attText?.trim()) return v;

  const rbdMatch = attText.match(/\bRBD[:\s]+([A-Z0-9, ]+)/i);
  if (rbdMatch) v.rbd = rbdMatch[1].trim();

  const fbMatch = attText.match(/\bfare\s*basis[:\s]+([A-Z0-9]+)/i);
  if (fbMatch) v.fareBasis = fbMatch[1].trim();

  const acMatch = attText.match(/\baccount\s*code[:\s]+([A-Z0-9]+)/i);
  if (acMatch) v.accountCode = acMatch[1].trim();

  const brandMatch = attText.match(/\bbrand[:\s]+([A-Za-z0-9, ]+)/i);
  if (brandMatch) v.rbd = v.rbd || `As per fare brands below\n\n${brandMatch[1].trim()}`;

  const brandLines = attText.match(
    /((?:Basic|Value|Comfort|Deluxe|Economy|Business|First|Premium)\s*[-–]\s*(?:USD|SAR|AED|GBP|EUR)?\s*\$?\d+[\s\S]*?){2,}/i
  );
  if (brandLines) {
    const cleaned = brandLines[0].split(/\n/).map((l) => l.trim()).filter((l) => l && /[-–]/.test(l)).join("\n");
    if (cleaned) {
      v.rbd = v.rbd ? `${v.rbd}\n\n${cleaned}` : `As per fare brands below\n\n${cleaned}`;
      if (category === "commission") {
        v.commissionRate = cleaned.split("\n").map((l) => l.replace(/\s*[-–]\s*(?:USD|SAR|AED|GBP|EUR)?\s*/, " – ")).join("\n");
      }
    }
  }

  const sellMatch = attText.match(/(?:selling|sales)\s*period[:\s]*([\d\/>]+)/i);
  if (sellMatch) v.sellingPeriod = sellMatch[1].trim();

  const travMatch = attText.match(/(?:travel|outbound)\s*period[:\s]*([\d\/>]+)/i);
  if (travMatch) {
    if (category === "flight-incentive") v.outboundPeriod = travMatch[1].trim();
    else v.travelPeriod = travMatch[1].trim();
  }

  const tourMatch = attText.match(/\btour\s*code[:\s]+([A-Z0-9]+)/i);
  if (tourMatch) v.tourCode = tourMatch[1].trim();

  const tdMatch = attText.match(/\bticket\s*designator[:\s]+([A-Z0-9]+)/i);
  if (tdMatch) v.ticketDesignator = tdMatch[1].trim();

  const agentMatch = attText.match(/\bagent\s*code[:\s]+([A-Z0-9, ]+)/i);
  if (agentMatch) v.agentCode = agentMatch[1].trim();

  for (const cur of ["USD", "AED", "SAR", "GBP", "EUR"]) {
    if (attText.toUpperCase().includes(cur)) { v.currency = cur; break; }
  }

  return v;
}

// ── OD pair extraction ──

function extractOdPairs(text: string): string {
  const odMatch = text.match(/(?:OD\s*Pair\(?s?\)?)[:\s]*\n?([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
  if (odMatch) return odMatch[1].trim();
  // Fallback: "OD pairs: SA-AE, SA-EG" (single line)
  const odMatch2 = text.match(/(?:OD\s*Pairs?)[:\s]*([\w\-, \n]+)/i);
  return odMatch2 ? odMatch2[1].trim() : "";
}

// ── Main extraction ──

export function extractValues(text: string, category: FormCategory, attachmentText?: string): Record<string, string> {
  const labeled = extractLabeled(text);
  const nl = extractNaturalLanguage(text, category);
  const att = extractFromAttachment(attachmentText || "", category);

  // Merge: NL base → attachment overrides → labeled wins
  const merged: Record<string, string> = { ...nl, ...att, ...labeled };

  // Forward: any date field populates sibling period fields so the form always shows dates
  // regardless of whether the user wrote "selling", "sales", or "travel" period.
  const anyDate = merged.sellingPeriod || merged.travelPeriod || merged.salesPeriod;
  if (anyDate) {
    if (!merged.sellingPeriod) merged.sellingPeriod = anyDate;
    if (!merged.travelPeriod) merged.travelPeriod = anyDate;
    if (!merged.salesPeriod) merged.salesPeriod = anyDate;
  }

  // OD pairs extracted from text
  const odPairs = extractOdPairs(text);
  if (odPairs) merged.odPairs = odPairs;

  // Clean up empty/blank entries
  for (const key of Object.keys(merged)) {
    const val = merged[key];
    if (!val || (typeof val === "string" && val.trim() === "")) delete merged[key];
  }

  return merged;
}

// ── Public API ──

export function parseLog(note: string, attachmentText?: string): ParsedEntry {
  const combined = note + (attachmentText ? "\n" + attachmentText : "");
  const category = detectFormCategory(combined);
  const clauses = classify(note);
  const extractedValues = extractValues(note, category, attachmentText);

  const scores: Record<FormCategory, number> = {
    "flight-incentive": scoreCategory(note, "flight-incentive"),
    commission: scoreCategory(note, "commission"),
    campaign: scoreCategory(note, "campaign"),
  };
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]) as [FormCategory, number][];
  const margin = sorted[0][1] - (sorted[1]?.[1] ?? 0);
  const confidence = margin >= 5 ? "high" : margin >= 2 ? "medium" : "low";

  const reason =
    category === "flight-incentive"
      ? "Detected flight incentive program signals"
      : category === "commission"
        ? "Detected commission management signals"
        : "Detected promotional campaign signals";

  return { category, confidence, reason, clauses, extractedValues };
}
