import type { UpdateRecord, AccountMetrics } from "@/lib/store";

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

function emailKind(text: string): Signal["kind"] {
  return THREAT.test(text) ? "threat" : "opportunity";
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
      });
    } else if (p <= -15) {
      metrics.threats.push({
        kind: "threat", iata, dollar: met.ytdFlownRevUsd,
        text: `${iata} revenue ${p.toFixed(1)}% vLY`, source: "metrics",
        detail: "Declining against last year — protect the target.",
      });
    }
  }

  for (const u of updates) {
    const kind = emailKind(u.headline);
    (kind === "threat" ? mail.threats : mail.opportunities).push({
      kind, text: u.headline, source: "mail", iata: u.accountIata,
      dollar: u.dollarImpact?.amountUsd, detail: u.detail,
    });
  }

  return [market, metrics, mail];
}
