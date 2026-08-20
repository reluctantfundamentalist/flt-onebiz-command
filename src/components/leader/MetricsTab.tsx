import Link from "next/link";
import { ACCOUNTS, findUser } from "@/lib/users";
import type { AccountMetrics } from "@/lib/store";

function fmtUsdShort(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function SummaryCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "var(--good,#16a34a)" : tone === "bad" ? "var(--bad,#dc2626)" : "var(--ink)";
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
      <div className="text-[20px] font-semibold" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--ink-soft)]">{sub}</div>}
    </div>
  );
}

export default function MetricsTab({
  metricsByIata,
}: {
  metricsByIata: Record<string, AccountMetrics>;
}) {
  const rows = Object.entries(metricsByIata)
    .map(([iata, m]) => {
      const acct = ACCOUNTS.find((a) => a.iata === iata);
      const bd = acct ? findUser(acct.ownerId) : undefined;
      return { iata, m, acct, bd };
    })
    .sort((a, b) => b.m.ytdFlownRevUsd - a.m.ytdFlownRevUsd);

  const totalRev = rows.reduce((s, r) => s + r.m.ytdFlownRevUsd, 0);
  const totalRevLy = rows.reduce((s, r) => s + (r.m.ytdFlownRevLyUsd ?? 0), 0);
  const totalPax = rows.reduce((s, r) => s + (r.m.ondPax ?? 0), 0);
  const blendedYoY = totalRevLy ? ((totalRev - totalRevLy) / totalRevLy) * 100 : undefined;
  const lastUpdated = rows[0]?.m.lastUpdated;

  // BD-by-BD split (global owner; layered accounts count for their global owner)
  const byBd = new Map<string, number>();
  for (const r of rows) {
    const owner = r.acct?.ownerId ?? "other";
    byBd.set(owner, (byBd.get(owner) ?? 0) + r.m.ytdFlownRevUsd);
  }
  const bdRows = Array.from(byBd.entries())
    .map(([id, rev]) => ({ bd: findUser(id), rev }))
    .sort((a, b) => b.rev - a.rev);
  const maxBdRev = bdRows[0]?.rev ?? 1;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Portfolio YTD flown" value={fmtUsdShort(totalRev)} sub={`${rows.length} carriers aggregated`} />
        <SummaryCard
          label="Blended vLY"
          value={blendedYoY !== undefined ? `${blendedYoY >= 0 ? "+" : ""}${blendedYoY.toFixed(1)}%` : "—"}
          sub={fmtUsdShort(totalRevLy) + " last year"}
          tone={blendedYoY !== undefined ? (blendedYoY >= 0 ? "good" : "bad") : undefined}
        />
        <SummaryCard label="O&D pax" value={totalPax ? totalPax.toLocaleString() : "—"} sub="across aggregated carriers" />
        <SummaryCard label="Last refresh" value={lastUpdated ?? "—"} sub="noSave CSV aggregation" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        {/* Carrier table with drill-through */}
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg)] text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Carrier</th>
                <th className="px-4 py-2 text-left font-semibold">BD</th>
                <th className="px-4 py-2 text-right font-semibold">YTD Flown</th>
                <th className="px-4 py-2 text-right font-semibold">vLY</th>
                <th className="px-4 py-2 text-right font-semibold">Pax</th>
                <th className="px-4 py-2 text-right font-semibold">ATV</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ iata, m, acct, bd }) => {
                const yoy = m.ytdFlownRevVlyPct;
                return (
                  <tr key={iata} className="border-t border-[var(--line)] hover:bg-[var(--bg)]">
                    <td className="px-4 py-2.5">
                      <span className="mr-2 rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-semibold">{iata}</span>
                      {acct?.name ?? iata}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[var(--ink-soft)]">{bd?.name.split(" ")[0] ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{fmtUsdShort(m.ytdFlownRevUsd)}</td>
                    <td
                      className="px-4 py-2.5 text-right font-semibold"
                      style={{ color: yoy === undefined ? "var(--ink-faint)" : yoy >= 0 ? "var(--good,#16a34a)" : "var(--bad,#dc2626)" }}
                    >
                      {yoy === undefined ? "—" : `${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%`}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-[var(--ink-soft)]">
                      {m.ondPax ? m.ondPax.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[12px] text-[var(--ink-soft)]">
                      {m.atvUsd ? `$${m.atvUsd.toFixed(0)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/leader/account/${iata}`}
                        className="rounded-md border border-[var(--line)] px-2 py-0.5 text-[11px] font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)]"
                      >
                        Dashboard →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BD-by-BD split */}
        <div className="rounded-xl border border-[var(--line)] bg-white p-4">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            Revenue by BD
          </div>
          <div className="space-y-3">
            {bdRows.map(({ bd, rev }) => (
              <div key={bd?.id ?? "other"}>
                <div className="mb-1 flex items-baseline justify-between text-[12px]">
                  <span className="font-medium text-[var(--ink)]">{bd?.name ?? "Other"}</span>
                  <span className="font-semibold text-[var(--ink-soft)]">{fmtUsdShort(rev)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded bg-[var(--bg)]">
                  <div
                    className="h-full rounded bg-[var(--brand)]"
                    style={{ width: `${(rev / maxBdRev) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] leading-relaxed text-[var(--ink-faint)]">
            Accounts without aggregated metrics yet appear on the map and in contracts. Run the CSV
            refresh to extend coverage beyond {rows.length} carriers.
          </p>
        </div>
      </div>
    </div>
  );
}
