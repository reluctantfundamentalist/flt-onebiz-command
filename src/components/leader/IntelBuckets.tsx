"use client";
import Link from "next/link";
import {
  type BucketItem,
  type ThemeBucket,
  SOURCE_META,
  priorityMatrix,
} from "@/lib/intel-buckets";
import { THEMES, THEME_BY_ID } from "@/lib/themes";
import { fmtUsd } from "@/lib/opportunity-view";

const PRIO_META = {
  high:   { label: "P1", bg: "#fee2e2", text: "#991b1b" },
  medium: { label: "P2", bg: "#fef3c7", text: "#92400e" },
  low:    { label: "P3", bg: "#f3f4f6", text: "#6b7280" },
} as const;

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  active:      { label: "Active",      bg: "#dcfce7", text: "#166534" },
  in_progress: { label: "In progress", bg: "#dbeafe", text: "#0a4f96" },
  dormant:     { label: "Dormant",     bg: "#fef3c7", text: "#92400e" },
  closed:      { label: "Closed",      bg: "#e5e7eb", text: "#374151" },
};

function ItemRow({ item, showAccount }: { item: BucketItem; showAccount?: boolean }) {
  const p = PRIO_META[item.priority] ?? PRIO_META.medium;
  const st = item.status ? STATUS_LABEL[item.status] : undefined;
  const done = item.status === "closed";
  return (
    <li className="rounded-lg border border-[var(--line)] bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
          style={{ background: p.bg, color: p.text }}
        >
          {p.label}
        </span>
        {item.kind === "threat" && (
          <span className="shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
            threat
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--ink)]" title={item.detail || item.headline}>
          {item.headline}
        </span>
        {item.dollar !== undefined && item.dollar >= 100_000 && (
          <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
            {fmtUsd(item.dollar)}
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {showAccount && (
          <Link
            href={`/leader/account/${item.iata}`}
            className="rounded bg-[var(--brand-soft)] px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--brand-dark)] hover:bg-[var(--brand)] hover:text-white"
          >
            {item.iata}
          </Link>
        )}
        <span
          title={SOURCE_META[item.source].label}
          className="rounded border border-[var(--line)] bg-[var(--bg)] px-1.5 py-0.5 text-[9.5px] font-semibold text-[var(--ink-soft)]"
        >
          {SOURCE_META[item.source].short}
        </span>
        {st && (
          <span
            className="rounded px-1.5 py-0.5 text-[9.5px] font-semibold"
            style={{ background: st.bg, color: st.text }}
          >
            {done ? `${st.label} — insight captured` : st.label}
          </span>
        )}
        {item.themes.slice(1, 3).map((t) => {
          const th = THEME_BY_ID[t];
          return th ? (
            <span key={t} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9.5px] font-semibold text-indigo-700">
              {th.short}
            </span>
          ) : null;
        })}
        {item.nextStep && !done && (
          <span className="text-[10px] text-[var(--ink-faint)]">
            Next: <span className="font-medium text-[var(--ink-soft)]">{item.nextStep}</span>
          </span>
        )}
      </div>
    </li>
  );
}

export default function IntelBuckets({
  buckets,
  showAccount,
  title,
}: {
  buckets: ThemeBucket[];
  showAccount?: boolean;
  title?: string;
}) {
  const allItems = buckets.flatMap((b) => b.items);
  const matrix = priorityMatrix(allItems);

  if (allItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-6 text-center text-sm text-[var(--ink-faint)]">
        No intel captured yet for this view.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Priority × theme matrix */}
      <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--bg)]">
              <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                {title ?? "Priority × theme"}
              </th>
              {matrix.themes.map((t) => (
                <th key={t.id} className="px-2 py-2 text-center font-semibold text-[var(--ink-soft)]" title={t.label}>
                  {t.short}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-semibold text-[var(--ink-faint)]">Σ</th>
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => {
              const p = PRIO_META[row.priority];
              return (
                <tr key={row.priority} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-3 py-1.5">
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: p.bg, color: p.text }}>
                      {p.label}
                    </span>
                  </td>
                  {row.cells.map((c) => (
                    <td key={c.themeId} className="px-2 py-1.5 text-center">
                      {c.count > 0 ? (
                        <span className={`font-bold ${row.priority === "high" ? "text-red-700" : "text-[var(--ink)]"}`}>
                          {c.count}
                        </span>
                      ) : (
                        <span className="text-[var(--ink-faint)]">·</span>
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-center font-bold text-[var(--ink-soft)]">{row.total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Theme buckets */}
      <div className="grid gap-3 lg:grid-cols-2">
        {buckets.map((b) => (
          <div key={b.themeId ?? "none"} className="rounded-xl border border-[var(--line)] bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[12px] font-semibold text-[var(--ink)]">{b.label}</span>
              <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ink-faint)]">
                {b.items.length}
              </span>
            </div>
            <ul className="space-y-1.5">
              {b.items.slice(0, 8).map((it) => (
                <ItemRow key={it.id} item={it} showAccount={showAccount} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
