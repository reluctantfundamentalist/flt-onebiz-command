import { findAccount } from "@/lib/users";
import type { ContractRecord } from "@/lib/store";

function fmtUsdShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export default function ContractTable({ contracts }: { contracts: ContractRecord[] }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--bg)] text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Account</th>
            <th className="px-4 py-2 text-left font-semibold">Contract period</th>
            <th className="px-4 py-2 text-right font-semibold">Target</th>
            <th className="px-4 py-2 text-right font-semibold">YTD Flown</th>
            <th className="px-4 py-2 text-right font-semibold">Completion</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => {
            const acct = findAccount(c.accountIata);
            const pct = c.targetUsd ? (c.ytdFlownUsd / c.targetUsd) * 100 : 0;
            const barColor = pct >= 90 ? "var(--good)" : pct >= 60 ? "var(--warn)" : "var(--bad)";
            return (
              <tr key={c.accountIata} className="border-t border-[var(--line)]">
                <td className="px-4 py-3">
                  <span className="mr-2 rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-semibold">
                    {c.accountIata}
                  </span>
                  {acct?.name}
                </td>
                <td className="px-4 py-3 text-[var(--ink-soft)] text-[12px]">
                  {fmtDate(c.periodStart)} — {fmtDate(c.periodEnd)}
                </td>
                <td className="px-4 py-3 text-right font-medium">{fmtUsdShort(c.targetUsd)}</td>
                <td className="px-4 py-3 text-right font-medium">{fmtUsdShort(c.ytdFlownUsd)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded bg-[var(--bg)]">
                      <div
                        className="h-full"
                        style={{ width: `${Math.min(100, pct)}%`, background: barColor }}
                      />
                    </div>
                    <span className="w-12 text-right text-[12px] font-medium" style={{ color: barColor }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
