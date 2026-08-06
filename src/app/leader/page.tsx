import { getSession } from "@/lib/auth";
import { ACCOUNTS } from "@/lib/users";
import { SEED_METRICS } from "@/lib/metrics-seed";
import { SEED_UPDATES, SEED_CONTRACTS } from "@/lib/seed";
import { listMetrics, listUpdates, listContracts } from "@/lib/store";
import AccountMapClient from "@/components/leader/AccountMapClient";
import UpdatesPanel from "@/components/leader/UpdatesPanel";
import ContractTable from "@/components/leader/ContractTable";
import AppHeader from "@/components/AppHeader";

export default async function LeaderPage() {
  const session = await getSession();
  if (!session) return null;

  const [storedMetrics, storedUpdates, storedContracts] = await Promise.all([
    listMetrics(),
    listUpdates(),
    listContracts(),
  ]);

  const metricsList = storedMetrics.length ? storedMetrics : SEED_METRICS;
  const updates = storedUpdates.length ? storedUpdates : SEED_UPDATES;
  const contracts = storedContracts.length ? storedContracts : SEED_CONTRACTS;

  const metricsByIata = Object.fromEntries(metricsList.map((m) => [m.iata, m]));

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader session={session} subtitle="Leadership workspace" />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 space-y-6">
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] bg-white overflow-hidden" style={{ height: 480 }}>
            <AccountMapClient accounts={ACCOUNTS} metrics={metricsByIata} />
          </div>
          <div style={{ maxHeight: 480 }} className="overflow-y-auto scroll-slim pr-1">
            <UpdatesPanel updates={updates} />
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Contract period & completion</h2>
            <span className="text-[11px] text-[var(--ink-faint)]">
              {storedContracts.length ? "live" : "seed data"}
            </span>
          </div>
          <ContractTable contracts={contracts} />
        </section>

        <p className="text-[11px] text-[var(--ink-faint)]">
          {storedMetrics.length
            ? `Metrics from Leadership_Report · updated ${metricsList[0]?.lastUpdated ?? "—"}`
            : "Metrics are seeded placeholders — will swap to Leadership_Report daily file when available."}
        </p>
      </main>
    </div>
  );
}
