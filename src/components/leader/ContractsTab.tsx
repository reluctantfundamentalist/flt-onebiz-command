import Link from "next/link";
import { findAccount, findUser } from "@/lib/users";
import type { ContractRecord } from "@/lib/store";

const DAY_MS = 24 * 60 * 60 * 1000;

function fmtUsdShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
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

export default function ContractsTab({ contracts }: { contracts: ContractRecord[] }) {
  const now = new Date();
  const totalTarget = contracts.reduce((s, c) => s + c.targetUsd, 0);
  const totalYtd = contracts.reduce((s, c) => s + c.ytdFlownUsd, 0);

  const enriched = contracts.map((c) => {
    const start = new Date(c.periodStart).getTime();
    const end = new Date(c.periodEnd).getTime();
    const daysToEnd = Math.ceil((end - now.getTime()) / DAY_MS);
    const elapsedFrac = Math.max(0, Math.min(1, (now.getTime() - start) / (end - start)));
    const completionPct = c.targetUsd ? (c.ytdFlownUsd / c.targetUsd) * 100 : 0;
    const expectedPct = elapsedFrac * 100;
    const acct = findAccount(c.accountIata);
    const bd = acct ? findUser(acct.ownerId) : undefined;
    return { c, daysToEnd, completionPct, expectedPct, acct, bd, renewalWindow: daysToEnd <= 90 };
  });

  const atRisk = enriched.filter((e) => e.renewalWindow && e.daysToEnd >= 0);
  const revenueAtRisk = atRisk.reduce((s, e) => s + e.c.targetUsd, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total contract target" value={fmtUsdShort(totalTarget)} sub={`${contracts.length} active contracts`} />
        <SummaryCard label="YTD flown" value={fmtUsdShort(totalYtd)} sub={`${totalTarget ? ((totalYtd / totalTarget) * 100).toFixed(0) : 0}% of target`} />
        <SummaryCard
          label="Renewal window (≤90d)"
          value={String(atRisk.length)}
          sub={atRisk.length ? atRisk.map((e) => e.c.accountIata).join(", ") : "none upcoming"}
          tone={atRisk.length ? "bad" : "good"}
        />
        <SummaryCard label="Target in renewal window" value={fmtUsdShort(revenueAtRisk)} sub="revenue to defend" />
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg)] text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Account</th>
              <th className="px-4 py-2 text-left font-semibold">BD</th>
              <th className="px-4 py-2 text-left font-semibold">Contract period</th>
              <th className="px-4 py-2 text-right font-semibold">Target</th>
              <th className="px-4 py-2 text-right font-semibold">YTD Flown</th>
              <th className="px-4 py-2 text-right font-semibold">Completion</th>
              <th className="px-4 py-2 text-right font-semibold">Renewal</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map(({ c, daysToEnd, completionPct, expectedPct, acct, bd, renewalWindow }) => {
              const barColor = completionPct >= 90 ? "var(--good)" : completionPct >= 60 ? "var(--warn)" : "var(--bad)";
              const pace = completionPct >= expectedPct - 5;
              return (
                <tr key={c.accountIata} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3">
                    <Link href={`/leader/account/${c.accountIata}`} className="hover:text-[var(--brand)]">
                      <span className="mr-2 rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-semibold">
                        {c.accountIata}
                      </span>
                      {acct?.name ?? c.accountIata}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--ink-soft)]">{bd?.name.split(" ")[0] ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)] text-[12px]">
                    {fmtDate(c.periodStart)} — {fmtDate(c.periodEnd)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{fmtUsdShort(c.targetUsd)}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmtUsdShort(c.ytdFlownUsd)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded bg-[var(--bg)]">
                        <div className="h-full" style={{ width: `${Math.min(100, completionPct)}%`, background: barColor }} />
                      </div>
                      <span
                        className="w-20 text-right text-[12px] font-medium"
                        style={{ color: barColor }}
                        title={`Period elapsed ${expectedPct.toFixed(0)}% — ${pace ? "on pace" : "behind pace"}`}
                      >
                        {completionPct.toFixed(0)}% {pace ? "▲" : "▼"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {daysToEnd < 0 ? (
                      <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--ink-faint)]">
                        expired
                      </span>
                    ) : (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                          renewalWindow ? "bg-red-50 text-red-700" : "bg-[var(--bg)] text-[var(--ink-soft)]"
                        }`}
                      >
                        {daysToEnd}d
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10.5px] text-[var(--ink-faint)]">
        ▲/▼ = completion pace vs period elapsed. Renewal column counts down to contract end; ≤90 days enters the renewal window.
      </p>
    </div>
  );
}
