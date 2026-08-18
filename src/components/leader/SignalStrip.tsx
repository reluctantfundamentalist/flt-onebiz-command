import type { SignalGroups, Signal } from "@/lib/signals";

const DOT: Record<Signal["kind"], string> = {
  opportunity: "var(--good, #16a34a)",
  threat: "var(--bad, #dc2626)",
  info: "var(--brand, #0b66c2)",
};

function Row({ s }: { s: Signal }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: DOT[s.kind] }} />
      <span className="text-[12px] leading-snug text-[var(--ink-soft)]">
        {s.text}
        <span className="ml-1 rounded bg-[var(--bg)] px-1 py-0.5 text-[9px] uppercase tracking-wide text-[var(--ink-faint)]">
          {s.source}
        </span>
      </span>
    </li>
  );
}

function Bucket({ title, hint, items }: { title: string; hint: string; items: Signal[] }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-3">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink)]">{title}</span>
        <span className="text-[9px] text-[var(--ink-faint)]">{hint}</span>
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] text-[var(--ink-faint)]">Nothing flagged.</div>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 4).map((s, i) => (
            <Row key={i} s={s} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SignalStrip({ groups }: { groups: SignalGroups }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Bucket title="Coming" hint="what's ahead" items={groups.coming} />
      <Bucket title="Happening" hint="in flight now" items={groups.happening} />
      <Bucket title="Happened" hint="already landed" items={groups.happened} />
    </div>
  );
}
