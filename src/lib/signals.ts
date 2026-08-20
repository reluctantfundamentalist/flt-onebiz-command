import type { UpdateRecord, AccountMetrics, MeetingRecord } from "@/lib/store";

export interface MarketIntel {
  iata: string;
  kind: "opportunity" | "threat";
  when: "coming" | "happening";
  headline: string;
  source: string;
}

export interface Signal {
  kind: "opportunity" | "threat" | "info";
  text: string;
  source: string;
  dollar?: number;   // explicit dollar figure to surface
  detail?: string;   // hover / below description
  iata?: string;     // account tag for keyword shine
  short?: string;    // concise keyword line for a leader glance
  priority?: string; // high/medium/low when the source carries one
  updateId?: string; // source update id, so promotion keeps the thread link
}

function concise(text: string, words = 5): string {
  const w = text.split(/\s+/).filter(Boolean);
  return w.length <= words ? text : w.slice(0, words).join(" ") + "…";
}

export interface SourceBucket {
  key: string;
  label: string;
  opportunities: Signal[];
  threats: Signal[];
}

export interface SignalGroups {
  coming: Signal[];
  happening: Signal[];
  happened: Signal[];
}

const THREAT = /refund|disput|undercut|penalt|ban|void|reject|issue|problem|risk|loss|leak|suspend/i;
// Administrative noise — scheduling chatter, OOO replies — is never a signal.
const NOISE = /scheduling\s*(?:&|and)?\s*ooo|out of office|ooo noise|auto-?repl/i;
// An opportunity needs a commercial substance, not just a meeting having happened.
const COMMERCIAL =
  /incentive|fare|campaign|contract|commission|fund|marketing|revenue|partnership|agreement|promotion|promo|sale|loyalty|ndc|route|launch|enablement|activation|co-invest|co-brand|rebate|qbr|commercial|exclusive|member|ancillar|interline|authority|iata/i;

export function isNoise(text: string): boolean {
  return NOISE.test(text);
}

function emailKind(text: string): Signal["kind"] {
  if (NOISE.test(text)) return "info";
  if (THREAT.test(text)) return "threat";
  if (COMMERCIAL.test(text)) return "opportunity";
  return "info"; // neutral — a meeting fact, admin, structure: not board material
}

// Synthesizes the three sources (metrics, market intel, BD inputs/emails) into
// what's coming / happening / happened for one account.
export function buildSignals(
  iata: string,
  metric: AccountMetrics | undefined,
  updates: UpdateRecord[],
  intel: MarketIntel[],
): SignalGroups {
  const coming: Signal[] = [];
  const happening: Signal[] = [];
  const happened: Signal[] = [];

  // Market intel (web search) → what's coming.
  for (const m of intel.filter((x) => x.iata === iata)) {
    coming.push({ kind: m.kind, text: m.headline, source: "market intel" });
  }

  for (const u of updates.filter((x) => x.accountIata === iata)) {
    if (isNoise(u.headline)) continue;
    const status = (u.status || "").toLowerCase();
    if (status === "closed") {
      happened.push({ kind: emailKind(u.headline), text: u.headline, source: "BD email" });
    } else {
      happening.push({ kind: emailKind(u.headline), text: u.headline, source: "BD email" });
    }
    if (u.nextStep) {
      coming.push({ kind: "opportunity", text: `Next: ${u.nextStep}`, source: "BD email" });
    }
  }

  // Metrics → realized performance (happened) and a forward risk read.
  if (metric?.ytdFlownRevVlyPct !== undefined) {
    const p = metric.ytdFlownRevVlyPct;
    happened.push({
      kind: p >= 0 ? "opportunity" : "threat",
      text: `YTD flown revenue ${p >= 0 ? "+" : ""}${p.toFixed(1)}% vLY`,
      source: "metrics",
    });
    if (p <= -15) {
      coming.push({
        kind: "threat",
        text: `Revenue trending ${p.toFixed(1)}% vLY — intervention needed to protect target`,
        source: "metrics",
      });
    } else if (p >= 10) {
      coming.push({
        kind: "opportunity",
        text: `Revenue growing +${p.toFixed(1)}% vLY — room to push upsell`,
        source: "metrics",
      });
    }
  }

  return { coming, happening, happened };
}

// Portfolio-level board: the three sources, each split into opportunities and
// threats. This is the clean leader-home view (no time buckets, no clutter).
export function buildSourceBoard(
  metricsByIata: Record<string, AccountMetrics>,
  updates: UpdateRecord[],
  intel: MarketIntel[],
): SourceBucket[] {
  const market: SourceBucket = { key: "market", label: "Market Intel", opportunities: [], threats: [] };
  const metrics: SourceBucket = { key: "metrics", label: "Internal Metrics", opportunities: [], threats: [] };
  const mail: SourceBucket = { key: "mail", label: "Mail Scraping", opportunities: [], threats: [] };

  for (const m of intel) {
    (m.kind === "threat" ? market.threats : market.opportunities).push({
      kind: m.kind, text: m.headline, source: "market intel", iata: m.iata,
      short: concise(m.headline),
    });
  }

  for (const [iata, met] of Object.entries(metricsByIata)) {
    const p = met.ytdFlownRevVlyPct;
    if (p === undefined) continue;
    if (p >= 10) {
      metrics.opportunities.push({
        kind: "opportunity", iata, dollar: met.ytdFlownRevUsd,
        text: `${iata} revenue +${p.toFixed(1)}% vLY`, source: "metrics",
        detail: "Growing account — room to push upsell and share.",
        short: `${iata} +${p.toFixed(1)}% vLY`,
      });
    } else if (p <= -15) {
      metrics.threats.push({
        kind: "threat", iata, dollar: met.ytdFlownRevUsd,
        text: `${iata} revenue ${p.toFixed(1)}% vLY`, source: "metrics",
        detail: "Declining against last year — protect the target.",
        short: `${iata} ${p.toFixed(1)}% vLY`,
      });
    }
  }

  for (const u of updates) {
    const kind = emailKind(u.headline);
    // Noise and neutral items (plain meeting facts, admin) don't belong on the board.
    if (kind === "info") continue;
    (kind === "threat" ? mail.threats : mail.opportunities).push({
      kind, text: u.headline, source: "mail", iata: u.accountIata,
      dollar: u.dollarImpact?.amountUsd, detail: u.detail,
      short: concise(u.headline),
      updateId: u.id,
    });
  }

  return [market, metrics, mail];
}

// ── Mega updates ──
// The home page shows only mega updates: dollar impact ≥ $100K, high priority,
// or a strategic keyword. Everything else stays out of the leader's glance.

const MEGA_KEYWORD =
  /contract.*(sign|won|renew|award)|framework|go.?live|mega|11\.11|9\.9|8\.8|marketing fund|exclusive fare|share.recovery|strategic partnership|incentive.*(sign|agree|confirm)|fund.*(confirm|arrive)/i;

export const MEGA_DOLLAR_THRESHOLD = 100_000;

export function isMegaUpdate(u: UpdateRecord): boolean {
  if (u.dollarImpact && u.dollarImpact.amountUsd >= MEGA_DOLLAR_THRESHOLD) return true;
  if (u.priority === "high") return true;
  return MEGA_KEYWORD.test(u.headline);
}

export function isMegaSignal(s: Signal): boolean {
  // Curated market intel is mega by definition; the rule filters machine noise.
  if (s.source === "market intel") return true;
  if (s.dollar !== undefined && s.dollar >= MEGA_DOLLAR_THRESHOLD) return true;
  if (s.priority === "high") return true;
  return MEGA_KEYWORD.test(s.text);
}

// Scoped coming / happening / happened for any slice of the portfolio:
// the whole book, one BD's carriers (optionally one region), or one account.
export function buildScopedSignals(
  iatas: string[],
  metricsByIata: Record<string, AccountMetrics>,
  updates: UpdateRecord[],
  intel: MarketIntel[],
  meetings: MeetingRecord[],
): SignalGroups {
  const scope = new Set(iatas);
  const inScope = (iata: string) => scope.has(iata);

  const coming: Signal[] = [];
  const happening: Signal[] = [];
  const happened: Signal[] = [];

  // Market intel carries its own time bucket.
  for (const m of intel.filter((x) => inScope(x.iata))) {
    const sig: Signal = { kind: m.kind, text: m.headline, source: "market intel", iata: m.iata };
    (m.when === "happening" ? happening : coming).push(sig);
  }

  for (const u of updates.filter((x) => inScope(x.accountIata))) {
    if (isNoise(u.headline)) continue;
    const base: Signal = {
      kind: emailKind(u.headline),
      text: u.headline,
      source: "BD update",
      iata: u.accountIata,
      detail: u.detail,
      dollar: u.dollarImpact?.amountUsd,
      priority: u.priority,
      updateId: u.id,
    };
    if ((u.status || "").toLowerCase() === "closed") happened.push(base);
    else happening.push(base);
    if (u.nextStep) {
      coming.push({
        kind: "opportunity",
        text: `Next: ${u.nextStep}`,
        source: "BD update",
        iata: u.accountIata,
        priority: u.priority,
        updateId: u.id,
      });
    }
  }

  const now = Date.now();
  for (const m of meetings.filter((x) => inScope(x.accountIata))) {
    const past = new Date(m.when).getTime() < now;
    const sig: Signal = {
      kind: "info",
      text: m.agenda,
      source: "meeting",
      iata: m.accountIata,
      detail: m.attendees?.length ? `With: ${m.attendees.join(", ")}` : undefined,
    };
    if (past && m.outcome) happened.push(sig);
    else if (!past) coming.push(sig);
  }

  // Realized performance per account, only when it moves (≥10% either way).
  for (const iata of iatas) {
    const p = metricsByIata[iata]?.ytdFlownRevVlyPct;
    if (p === undefined) continue;
    if (p >= 10 || p <= -15) {
      happened.push({
        kind: p >= 0 ? "opportunity" : "threat",
        text: `${iata} YTD flown ${p >= 0 ? "+" : ""}${p.toFixed(1)}% vLY`,
        source: "metrics",
        iata,
        dollar: metricsByIata[iata]?.ytdFlownRevUsd,
      });
    }
  }

  return { coming, happening, happened };
}
