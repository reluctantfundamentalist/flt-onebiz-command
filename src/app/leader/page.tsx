import { getSession } from "@/lib/auth";
import { ACCOUNTS, USERS, findUser } from "@/lib/users";
import { SEED_UPDATES, SEED_CONTRACTS, SEED_MEETINGS } from "@/lib/seed";
import { listMetrics, listUpdates, listContracts, listMeetings } from "@/lib/store";
import { loadMetricsByIata } from "@/lib/metrics-loader";
import { buildTimeline, timelineByBdSummary } from "@/lib/timeline";
import LeaderMapWorkspace from "@/components/leader/LeaderMapWorkspace";
import { readFileSync } from "fs";
import { join } from "path";
import ContractTable from "@/components/leader/ContractTable";
import BdNavStrip from "@/components/leader/BdNavStrip";
import AppHeader from "@/components/AppHeader";

export default async function LeaderPage() {
  const session = await getSession();
  if (!session) return null;

  const [storedMetrics, storedUpdates, storedContracts, storedMeetings, aggregatedMetrics] = await Promise.all([
    listMetrics(),
    listUpdates(),
    listContracts(),
    listMeetings(),
    loadMetricsByIata(),
  ]);

  // Prefer aggregator-written metrics; store-based is currently unused
  const metricsByIata = Object.keys(aggregatedMetrics).length > 0
    ? aggregatedMetrics
    : Object.fromEntries((storedMetrics.length ? storedMetrics : []).map((m) => [m.iata, m]));

  const updates = storedUpdates.length ? storedUpdates : SEED_UPDATES;
  const contracts = storedContracts.length ? storedContracts : SEED_CONTRACTS;
  const meetings = storedMeetings.length ? storedMeetings : SEED_MEETINGS;

  const timeline = buildTimeline(updates, meetings, contracts);
  const bdSummary = timelineByBdSummary(timeline);
  const intel = JSON.parse(
    readFileSync(join(process.cwd(), "src/data/market_intel.json"), "utf8"),
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader session={session} subtitle="Leadership workspace" />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 space-y-6">
        {/* BD nav strip: cross-BD pipeline pointer */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ink)]">BD pipeline</h2>
            <span className="text-[11px] text-[var(--ink-faint)]">click a BD to see their pending tasks</span>
          </div>
          <BdNavStrip summary={bdSummary} />
        </section>

        <LeaderMapWorkspace accounts={ACCOUNTS} metrics={metricsByIata} updates={updates} intel={intel} />

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
          {Object.keys(aggregatedMetrics).length
            ? `Metrics aggregated from noSave_*.csv · ${Object.keys(aggregatedMetrics).length} carriers · last refresh ${(Object.values(aggregatedMetrics)[0] as { lastUpdated: string }).lastUpdated}`
            : "Metrics are seeded placeholders — run `npm run refresh` to aggregate the latest CSV."}
        </p>
      </main>
    </div>
  );
}
