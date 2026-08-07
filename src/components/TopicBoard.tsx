import type { UpdateRecord } from "@/lib/store";

interface Props {
  updates: UpdateRecord[];
  title?: string;
}

const STATUS_ORDER = ["active", "in_progress", "dormant", "closed"] as const;
const STATUS_STYLE = {
  active:      { bg: "#dcfce7", text: "#166534", label: "Active" },
  in_progress: { bg: "#dbeafe", text: "#0a4f96", label: "In progress" },
  dormant:     { bg: "#fef3c7", text: "#92400e", label: "Dormant" },
  closed:      { bg: "#e5e7eb", text: "#374151", label: "Closed" },
} as const;

const PRIORITY_STYLE = {
  high:   { bg: "#fee2e2", text: "#991b1b", label: "High" },
  medium: { bg: "#f3f4f6", text: "#4b5563", label: "Med" },
  low:    { bg: "#f9fafb", text: "#9ca3af", label: "Low" },
} as const;

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function TopicBoard({ updates, title = "Active topics" }: Props) {
  const topics = updates.filter((u) => u.status !== undefined);
  const grouped: Record<string, UpdateRecord[]> = {};
  for (const t of topics) {
    const s = t.status ?? "active";
    (grouped[s] ??= []).push(t);
  }

  if (topics.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-6 text-center text-sm text-[var(--ink-faint)]">
        No clustered topics — run <code>python3 scripts/cluster_topics.py</code>.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {STATUS_ORDER.map((status) => {
        const items = (grouped[status] || []).sort((a, b) => {
          // High priority first, then most recent
          const pw = { high: 0, medium: 1, low: 2 };
          const dp = (pw[a.priority ?? "medium"] ?? 1) - (pw[b.priority ?? "medium"] ?? 1);
          if (dp !== 0) return dp;
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        });
        if (items.length === 0) return null;
        const s = STATUS_STYLE[status];
        return (
          <div key={status}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ background: s.bg, color: s.text }}
              >
                {s.label}
              </span>
              <span className="text-[11px] text-[var(--ink-faint)]">{items.length} {items.length === 1 ? "topic" : "topics"}</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {items.map((t) => <TopicCard key={t.id} topic={t} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopicCard({ topic }: { topic: UpdateRecord }) {
  const priority = topic.priority ?? "medium";
  const p = PRIORITY_STYLE[priority];
  const airline = topic.airlineOwners ?? [];
  const trip = topic.tripOwners ?? [];
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-3 transition hover:border-[var(--brand)] hover:shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h4 className="text-[13px] font-semibold leading-tight text-[var(--ink)]">
          {topic.headline}
        </h4>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
          style={{ background: p.bg, color: p.text }}
        >
          {p.label}
        </span>
      </div>
      {topic.detail && (
        <p className="text-[11.5px] leading-snug text-[var(--ink-soft)]">{topic.detail}</p>
      )}
      {topic.dollarImpact && (
        <div className="mt-2 inline-flex items-baseline gap-1.5 rounded bg-emerald-50 px-2 py-1 text-[11px] text-emerald-900">
          <span className="font-bold">{fmtUsd(topic.dollarImpact.amountUsd)}</span>
          {topic.dollarImpact.note && <span>{topic.dollarImpact.note}</span>}
        </div>
      )}
      {topic.nextStep && (
        <div className="mt-2 rounded bg-[var(--brand-soft)] px-2 py-1 text-[11px] text-[var(--brand-dark)]">
          <span className="font-semibold">Next: </span>
          {topic.nextStep}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--ink-faint)]">
        {airline.length > 0 && (
          <span>
            <span className="font-semibold text-orange-700">Airline: </span>
            {airline.join(", ")}
          </span>
        )}
        {trip.length > 0 && (
          <span>
            <span className="font-semibold text-[var(--brand-dark)]">Trip: </span>
            {trip.join(", ")}
          </span>
        )}
        {topic.threadCount != null && (
          <span className="ml-auto">{topic.threadCount} email{topic.threadCount === 1 ? "" : "s"}</span>
        )}
      </div>
    </div>
  );
}
