import type { SourceBucket, Signal } from "@/lib/signals";

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function Item({ s }: { s: Signal }) {
  const hover = s.detail ? `${s.text} — ${s.detail}` : s.text;
  return (
    <li
      title={hover}
      className="flex items-start gap-2 rounded-md border border-[var(--line)] bg-white px-2 py-1.5"
    >
      {s.iata && (
        <span className="mt-0.5 shrink-0 rounded bg-[var(--brand-soft)] px-1 py-0.5 text-[9px] font-bold text-[var(--brand-dark)]">
          {s.iata}
        </span>
      )}
      <span className="min-w-0 text-[11.5px] leading-snug text-[var(--ink-soft)]">
        <span className="font-semibold text-[var(--ink)]">{s.short ?? s.text}</span>
        {s.dollar !== undefined && (
          <span className="ml-1.5 rounded bg-emerald-50 px-1 py-0.5 text-[10px] font-bold text-emerald-800">
            {fmtUsd(s.dollar)}
          </span>
        )}
      </span>
    </li>
  );
}

function Column({
  title,
  color,
  items,
}: {
  title: string;
  color: string;
  items: Signal[];
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
        {title} · {items.length}
      </div>
      {items.length === 0 ? (
        <div className="text-[10.5px] text-[var(--ink-faint)]">Nothing flagged.</div>
      ) : (
        <ul className="space-y-1.5">{items.slice(0, 4).map((s, i) => <Item key={i} s={s} />)}</ul>
      )}
    </div>
  );
}

export default function SourceBoard({ board }: { board: SourceBucket[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {board.map((b) => (
        <div key={b.key} className="rounded-xl border border-[var(--line)] bg-white p-3">
          <div className="mb-2 text-[12px] font-semibold text-[var(--ink)]">{b.label}</div>
          <div className="flex gap-3">
            <Column title="Opportunities" color="var(--good, #16a34a)" items={b.opportunities} />
            <Column title="Threats" color="var(--bad, #dc2626)" items={b.threats} />
          </div>
        </div>
      ))}
    </div>
  );
}
