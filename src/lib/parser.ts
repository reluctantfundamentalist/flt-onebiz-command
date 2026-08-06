// Deterministic structuring engine for the Flt OneBiz intake prototype.
// No external model: it parses the BD's free-text note into structured
// commercial-instrument records and disambiguates terms that sound alike
// but are commercially distinct (NDC incentive vs BSP commission vs backend
// vs virtual-card vs marketing incentive).

export type Team = "NDC" | "LCC" | "Ops" | "Marketing";

export interface Instrument {
  id: string;
  type: string;
  shortType: string;
  valueLabel: string; // "5%" | "USD 50,000"
  ratePct?: number;
  amountUsd?: number;
  unit: "%" | "USD" | "—";
  scope: { origin?: string; pos?: string; channel?: string; market?: string };
  scopeLabel: string;
  validity: string;
  release: string; // how it reaches the consumer
  account: string;
  market: string;
  team: Team;
  confidence: number;
  raw: string;
  color: string;
}

export interface ParseResult {
  instruments: Instrument[];
  account: string;
  market: string;
  attachment?: string;
  disambiguation: {
    incentiveClauses: number;
    distinctTypes: string[];
    note: string;
  };
  unknownClauses: string[];
}

const TYPE_RULES: {
  match: RegExp;
  type: string;
  short: string;
  release: string;
  team: Team;
  color: string;
}[] = [
  // order matters: most specific phrases first
  {
    match: /virtual[-\s]?card/,
    type: "Virtual Card Incentive",
    short: "Virtual Card",
    release: "Fare discount (via virtual card settlement)",
    team: "Ops",
    color: "var(--brand)",
  },
  {
    match: /backend/,
    type: "Backend Incentive",
    short: "Backend",
    release: "Fare discount (retro backend)",
    team: "Ops",
    color: "var(--brand)",
  },
  {
    match: /bsp|iata\s*commission/,
    type: "BSP Commission",
    short: "BSP Comm.",
    release: "Fare discount (BSP commission pass-through)",
    team: "Ops",
    color: "var(--brand)",
  },
  {
    match: /ndc/,
    type: "NDC Subsidy",
    short: "NDC",
    release: "Channel development fund (NDC)",
    team: "NDC",
    color: "var(--ndc)",
  },
  {
    match: /marketing\s*cash|marketing\s*fund|mdf/,
    type: "Marketing Cash",
    short: "Mkt Cash",
    release: "Marketing fund (co-op spend)",
    team: "Marketing",
    color: "var(--mkt)",
  },
  {
    match: /marketing\s*incentive/,
    type: "Marketing Incentive",
    short: "Mkt Incentive",
    release: "Fare discount (marketing-linked)",
    team: "Marketing",
    color: "var(--mkt)",
  },
  {
    match: /private\s*fare|private\s*tariff/,
    type: "Private Fare",
    short: "Private Fare",
    release: "Fare discount (private fare)",
    team: "Ops",
    color: "var(--brand)",
  },
  {
    match: /commission/,
    type: "Commission",
    short: "Commission",
    release: "Fare discount (commission pass-through)",
    team: "Ops",
    color: "var(--brand)",
  },
  {
    match: /lcc|low[-\s]?cost/,
    type: "LCC Agreement",
    short: "LCC",
    release: "Fare discount (LCC direct connect)",
    team: "LCC",
    color: "var(--lcc)",
  },
];

function splitClauses(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/,|\n|;\s*|\s+and\s+/i)
    .map((c) => c.trim())
    .filter(Boolean);
}

function parseAmount(clause: string): {
  ratePct?: number;
  amountUsd?: number;
  label: string;
  unit: "%" | "USD" | "—";
} {
  // percent
  const pct = clause.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) {
    return { ratePct: parseFloat(pct[1]), label: `${pct[1]}%`, unit: "%" };
  }
  // currency amount with optional k/m
  const money = clause.match(/(?:usd|us\$|\$|dollars?)?\s*(\d+(?:\.\d+)?)\s*(k|m)\b/i);
  if (money) {
    const n = parseFloat(money[1]);
    const mult = money[2].toLowerCase() === "k" ? 1000 : 1_000_000;
    const usd = n * mult;
    return { amountUsd: usd, label: `USD ${usd.toLocaleString()}`, unit: "USD" };
  }
  const bare = clause.match(/(\d+(?:\.\d+)?)/);
  if (bare) {
    // bare number — treat small numbers as %, large as USD
    const n = parseFloat(bare[1]);
    if (n > 100) {
      const usd = Math.round(n);
      return { amountUsd: usd, label: `USD ${usd.toLocaleString()}`, unit: "USD" };
    }
    return { ratePct: n, label: `${n}%`, unit: "%" };
  }
  return { label: "—", unit: "—" };
}

function extractScope(clause: string) {
  const scope: { origin?: string; pos?: string; channel?: string; market?: string } = {};
  const origin = clause.match(/(?:origin|origins?|from)\s*:?\s*([a-z .]+?)(?:,|$| route| market| flights?)/i);
  if (origin) scope.origin = origin[1].trim();
  else {
    const region = clause.match(/\b(europe|asia|americas?|middle east|gcc|emea|china|india|southeast asia)\b/i);
    if (region) scope.origin = region[1];
  }
  if (/ndc/i.test(clause)) scope.channel = "NDC";
  if (/\bpos\b|point of sale/i.test(clause)) scope.pos = "POS-scoped";
  return scope;
}

function scopeLabel(scope: {
  origin?: string;
  pos?: string;
  channel?: string;
  market?: string;
}): string {
  const parts: string[] = [];
  if (scope.channel) parts.push(`Channel: ${scope.channel}`);
  if (scope.origin) parts.push(`Origin: ${scope.origin}`);
  if (scope.pos) parts.push(scope.pos);
  if (scope.market) parts.push(`Market: ${scope.market}`);
  return parts.join(" · ") || "Global / all routes";
}

let idc = 0;

export function parseDeal(text: string, attachment?: string): ParseResult {
  idc = 0;
  const clauses = splitClauses(text);
  const instruments: Instrument[] = [];
  const unknown: string[] = [];
  let incentiveClauses = 0;

  // detect account + market from the whole text
  const accountMatch =
    text.match(/\b(egypt\s*air|emirates|etihad|qatar\s*airways|saudia|flydubai|turkish|lufthansa|qantas|singapore\s*airlines|air india|vistara)\b/i);
  const account = accountMatch ? titleCaseAirline(accountMatch[1]) : "Airline account";
  const marketMatch = text.match(/\b(uae|dubai|saudi|ksa|gcc|middle east|europe|india|sea|na|kr)\b/i);
  const market = marketMatch ? marketMatch[1].toUpperCase() : "Global";

  for (const clause of clauses) {
    if (/incentive/i.test(clause)) incentiveClauses++;
    const rule = TYPE_RULES.find((r) => r.match.test(clause));
    if (!rule) {
      // skip pure-carrier / connector clauses
      if (clause.length > 3 && !/^(egypt\s*air|and|uae|dubai)$/i.test(clause)) unknown.push(clause);
      continue;
    }
    const amount = parseAmount(clause);
    const scope = extractScope(clause);
    scope.market = market;
    instruments.push({
      id: `ins-${++idc}`,
      type: rule.type,
      shortType: rule.short,
      valueLabel: amount.label,
      ratePct: amount.ratePct,
      amountUsd: amount.amountUsd,
      unit: amount.unit,
      scope,
      scopeLabel: scopeLabel(scope),
      validity: "Per agreement term sheet",
      release: rule.release,
      account: `${account} (Global)`,
      market: `${market} (Local)`,
      team: rule.team,
      confidence: 0.7 + Math.min(0.27, instruments.length * 0.01),
      raw: clause,
      color: rule.color,
    });
  }

  const distinctTypes = [...new Set(instruments.filter((i) => /incentive/i.test(i.type)).map((i) => i.type))];

  return {
    instruments,
    account,
    market,
    attachment,
    disambiguation: {
      incentiveClauses,
      distinctTypes,
      note:
        incentiveClauses > 1 && distinctTypes.length > 1
          ? `${incentiveClauses} clauses said "incentive" — mapped to ${distinctTypes.length} distinct instrument types.`
          : "No conflated terms detected in this note.",
    },
    unknownClauses: unknown,
  };
}

function titleCaseAirline(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const SAMPLE_NOTE =
  "Egypt Air 5% BSP commission, 3% backend, 2% virtual card incentive, 50k to drive NDC, 1% marketing incentive, 300k marketing cash, 5% off private fare Europe origin";
