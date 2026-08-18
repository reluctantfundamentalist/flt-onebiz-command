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
