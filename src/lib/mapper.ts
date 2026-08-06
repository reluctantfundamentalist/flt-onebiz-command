// Maps classified clauses + extracted attachment text into populated form
// values per sheet type, applying the BD-confirmed rules:
//  - BSP commission => Upfront Commission, Commission type = "Market commission"
//  - Stacking = Yes, unless exclusivity language => No
//  - Ringfence = No by default; Yes if note specifies
//  - Theme auto = Agentcode_AirlineCode_ApplicationDate (agent code flagged if unknown)
//  - "from time to time" => dates left blank + flagged
//  - RBD / farebasis / accountcode / brandnames come from the attachment

import { classify, detectStackingNo, detectRingfence, type SheetType, type Clause } from "./classify";
import { resolveCarrier, resolveMarket } from "./carriers";
import { PROMO_FUND_SCHEMA, UPFRONT_COMMISSION_SCHEMA, type FormSchema, type Field } from "./forms";
import type { Lever } from "./levers";

export interface MappedForm {
  sheetType: SheetType;
  clause: string;
  schema: FormSchema;
  values: Record<string, string>;
  flags: string[];
  lever?: Lever;
}

function parseAmount(clause: string): { ratePct?: string; amountUsd?: string } {
  const pct = clause.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) return { ratePct: `${pct[1]}%` };
  const money = clause.match(/(\d[\d.,]*)\s*k/i);
  if (money) {
    const usd = Math.round(parseFloat(money[1]) * 1000);
    return { amountUsd: `USD ${usd.toLocaleString()}` };
  }
  const bare = clause.match(/(\d[\d.,]+)/);
  if (bare) {
    const n = parseFloat(bare[1].replace(/,/g, ""));
    if (n > 100) return { amountUsd: `USD ${Math.round(n).toLocaleString()}` };
    return { ratePct: `${n}%` };
  }
  return {};
}

function todayAppDate(): string {
  const d = new Date();
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dd}${months[d.getMonth()]}${d.getFullYear()}`;
}

// --- date parsing ---
const MON3 = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MON_FULL = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function monthNum(name: string): number | null {
  const n = name.toLowerCase().trim();
  let i = MON_FULL.indexOf(n);
  if (i >= 0) return i + 1;
  i = MON3.indexOf(n.slice(0, 3));
  return i >= 0 ? i + 1 : null;
}

function fmt(d: number, m: number, y?: number | null): string {
  if (!d || !m) return "";
  const mm = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m];
  const yr = y || new Date().getFullYear();
  return `${String(d).padStart(2, "0")}${mm}${String(yr).slice(-2)}`;
}

export interface DateRange {
  start: string;
  end: string;
  label: string;
  context: "sales" | "travel";
}

interface DateHit {
  i: number;
  raw: string;
  d: number;
  mo: number;
  y?: number | null;
}

// Finds all date ranges in the text. Month-anchored so it survives OCR noise
// on ordinal suffixes (Tesseract reads "1st" as "15", "31st" as "315t"):
// months OCR cleanly, so we anchor on the month and recover the day (longest
// leading run <= 31) + year. Supports clean prose ("from 1st July 2026 until
// 31st July 2026"), ATPCO ("01SEP26-31OCT26"), and chat ("1Sep-31Oct").
function dayFromPrefix(pre: string): number | null {
  const m = pre.match(/(\d{1,4})\D*$/);
  if (!m) return null;
  const dg = m[1];
  if (+dg >= 1 && +dg <= 31) return +dg;
  if (dg.length >= 2) {
    const f2 = +dg.slice(0, 2);
    if (f2 >= 1 && f2 <= 31) return f2;
  }
  const f1 = +dg.slice(0, 1);
  return f1 >= 1 && f1 <= 31 ? f1 : null;
}

export function parseAllDateRanges(text: string): DateRange[] {
  const t = ` ${text.toLowerCase()} `;
  const hits: DateHit[] = [];
  let m: RegExpExecArray | null;

  // month-anchored: match a month token (full or 3-letter) as a whole word,
  // then take the day from the digits just before it and the year just after.
  const monRe =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/g;
  while ((m = monRe.exec(t))) {
    const mn = monthNum(m[1]);
    if (!mn) continue;
    const pre = t.slice(Math.max(0, m.index - 6), m.index);
    const post = t.slice(m.index + m[0].length, m.index + m[0].length + 8);
    const day = dayFromPrefix(pre);
    const ym = post.match(/^\D{0,3}(\d{4})/);
    const yr = ym ? +ym[1] : null;
    if (day) hits.push({ i: m.index, raw: m[0], d: day, mo: mn, y: yr });
  }
  // ATPCO (digit+month, no space): 01Jul2026 / 01Jul
  const atpcoRe = /(\d{1,2})(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(\d{2,4})?/g;
  while ((m = atpcoRe.exec(t))) {
    const mn = monthNum(m[2]);
    if (mn) {
      const yr = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : null;
      hits.push({ i: m.index, raw: m[0], d: +m[1], mo: mn, y: yr });
    }
  }

  hits.sort((a, b) => a.i - b.i);
  const seen: DateHit[] = [];
  for (const h of hits) {
    if (!seen.some((s) => Math.abs(s.i - h.i) < 2)) seen.push(h);
  }

  const ranges: DateRange[] = [];
  for (let k = 0; k < seen.length - 1; k++) {
    const a = seen[k];
    const b = seen[k + 1];
    const gap = t.slice(a.i + a.raw.length, b.i);
    const gapLen = b.i - (a.i + a.raw.length);
    const sep = /\b(until|to|through)\b|[-–—]/.test(gap);
    if (gapLen > 50 || !sep) continue;
    const back = t.slice(Math.max(0, a.i - 50), a.i);
    let context: "sales" | "travel" = "travel";
    if (/sale/.test(back)) context = "sales";
    else if (/travel|season/.test(back)) context = "travel";
    ranges.push({
      start: fmt(a.d, a.mo, a.y),
      end: fmt(b.d, b.mo, b.y),
      label: `${fmt(a.d, a.mo, a.y)} - ${fmt(b.d, b.mo, b.y)}`,
      context,
    });
  }
  return ranges;
}

export function parseDateRange(text: string): DateRange | null {
  return parseAllDateRanges(text)[0] || null;
}

function findInAttachment(attText: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const m = attText.match(p);
    if (m) return m[1] || m[0];
  }
  return "";
}

export interface StructureResult {
  forms: MappedForm[];
  flaggedClauses: Clause[];
  disambiguation: string;
}

export function structure(
  note: string,
  attachmentText: string
): StructureResult {
  const clauses = classify(note);
  const stackingNo = detectStackingNo(note);
  const carrier = resolveCarrier(note) || { code: "XX", name: "Unknown" };
  const market = resolveMarket(note) || "";
  const agentCode = "AEXC"; // unknown per-market agent code — flagged (Lever_Commission sheet fallback)
  const appDate = todayAppDate();

  const forms: MappedForm[] = [];
  const flagged: Clause[] = [];

  for (const clause of clauses) {
    if (clause.sheetType === "other") {
      flagged.push(clause);
      continue;
    }
    const schema =
      clause.sheetType === "Upfront Commission" ? UPFRONT_COMMISSION_SCHEMA : PROMO_FUND_SCHEMA;
    const values: Record<string, string> = {};
    const flags: string[] = [];
    const amount = parseAmount(clause.text);
    const ringfence = detectRingfence(clause.text + " " + note);

    // shared fields
    values.theme = `${agentCode}_${carrier.code}_${appDate}`;
    values.agentCode = agentCode; // taken from the theme (per Lever_Commission sheet)
    values.validatingCarrier = `${carrier.code} (${carrier.name})`;
    values.market = market;
    values.sheetType = clause.sheetType;
    values.requestSummary = clause.text;
    values.approvers = "Kirk Wong, Jeff Wang"; // fixed per market (untouched)
    values.ccList = "";
    flags.push("Agent code in Theme is a placeholder — confirm per-market agent code.");

    // attachment-sourced fields
    values.rbd = findInAttachment(attachmentText, [/\bRBD[:\s]+([A-Z0-9, ]+)/i, /\bbooking\s*class[:\s]+([A-Z0-9, ]+)/i]) || "";
    values.farebasis = findInAttachment(attachmentText, [/\bfare\s*basis[:\s]+([A-Z0-9]+)/i]) || "";
    values.accountCode = findInAttachment(attachmentText, [/\baccount\s*code[:\s]+([A-Z0-9]+)/i, /\bTour\s*code[:\s]+([A-Z0-9]+)/i]) || "";
    values.brandnames = findInAttachment(attachmentText, [/\bbrand[:\s]+([A-Za-z0-9 ,]+)/i]) || "";
    if (!values.rbd) flags.push("RBD not found in attachment — add manually.");
    if (!values.farebasis) flags.push("Farebasis not found in attachment — add manually.");

    if (clause.sheetType === "Upfront Commission") {
      values.commissionType = "Market Commission";
      values.amountType = amount.ratePct ? "%" : amount.amountUsd ? "Absolute" : "";
      values.routeRestriction = ringfence ? "POC = POS only (SITI only)" : "All POS";
      values.stackedCommission = stackingNo ? "No" : "Yes";
      values.stackedIncentive = stackingNo ? "No" : "Yes";

      const combined = note + "\n" + attachmentText;
      const ranges = parseAllDateRanges(combined);
      const sales = ranges.find((r) => r.context === "sales");
      const travel = ranges.find((r) => r.context === "travel");
      if (sales) {
        values.salesStart = sales.start;
        values.salesEnd = sales.end;
        flags.push(`Sales validity parsed: ${sales.label}.`);
      }
      if (travel) {
        values.outboundTravel = travel.label;
        values.inboundTravel = travel.label;
        flags.push(`Travel validity parsed: ${travel.label}.`);
      }
      if (!sales && !travel) {
        if (/from time to time|periodically/i.test(combined)) {
          flags.push("Validity is 'from time to time' — pick dates or set 'All dates'.");
        } else {
          flags.push("No sales/travel dates found in note or attachment — pick dates or set 'All dates'.");
        }
      }
    } else {
      // Promo Fund
      values.totalBudget = amount.amountUsd || amount.ratePct || "";
      values.currency = "USD";
      values.ringfence = ringfence ? "Yes" : "No";
      const pfRanges = parseAllDateRanges(note + "\n" + attachmentText);
      const pfFirst = pfRanges[0];
      if (pfFirst) {
        values.validity = pfFirst.label;
        flags.push(`Fund validity parsed: ${pfFirst.label}.`);
      } else if (/from time to time|periodically/i.test(note + " " + attachmentText)) {
        flags.push("Validity 'from time to time' — pick dates or set 'All dates'.");
      }
      if (!amount.amountUsd && amount.ratePct) {
        flags.push("Promo Fund budget entered as % — confirm if a USD total applies.");
      }
    }

    forms.push({ sheetType: clause.sheetType, clause: clause.text, schema, values, flags, lever: clause.lever });
  }

  const incentiveClauses = clauses.filter((c) => /incentive|commission/i.test(c.text));
  const distinctSheets = [...new Set(incentiveClauses.map((c) => c.sheetType))];
  const disambiguation =
    incentiveClauses.length > 1
      ? `${incentiveClauses.length} clauses mentioned "incentive/commission" — routed to ${distinctSheets.length > 1 ? "distinct sheet types" : "one sheet type"} (${[...new Set(clauses.map((c) => c.sheetType))].join(", ")}).`
      : "No conflated terms.";

  return { forms, flaggedClauses: flagged, disambiguation };
}

// Mark a field as flagged in the schema copy used for rendering.
export function withFlags(schema: FormSchema, values: Record<string, string>): FormSchema {
  return {
    ...schema,
    sections: schema.sections.map((s) => ({
      ...s,
      fields: s.fields.map((f) => ({
        ...f,
        flag: f.flag || (f.required && !values[f.key] && f.type !== "fixed" && f.type !== "people" && f.key !== "ccList"),
      })),
    })),
  };
}
