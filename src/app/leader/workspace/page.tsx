import { getSession } from "@/lib/auth";
import { ACCOUNTS, USERS } from "@/lib/users";
import { SEED_UPDATES, SEED_CONTRACTS, SEED_MEETINGS } from "@/lib/seed";
import {
  listMetrics,
  listUpdates,
  listContracts,
  listMeetings,
  listOpportunities,
} from "@/lib/store";
import { loadMetricsByIata } from "@/lib/metrics-loader";
import { buildTimeline, timelineByBdSummary } from "@/lib/timeline";
import HomeTabs, { type HomeTabKey } from "@/components/leader/HomeTabs";
import AppHeader from "@/components/AppHeader";

const VALID_TABS: HomeTabKey[] = ["opportunities", "activity", "contracts", "metrics"];

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const tab: HomeTabKey = VALID_TABS.includes(params.tab as HomeTabKey)
    ? (params.tab as HomeTabKey)
    : "opportunities";

  const [storedMetrics, storedUpdates, storedContracts, storedMeetings, aggregatedMetrics, opportunities] =
    await Promise.all([
      listMetrics(),
      listUpdates(),
      listContracts(),
      listMeetings(),
      loadMetricsByIata(),
      listOpportunities(),
    ]);

  const metricsByIata = Object.keys(aggregatedMetrics).length > 0
    ? aggregatedMetrics
    : Object.fromEntries((storedMetrics.length ? storedMetrics : []).map((m) => [m.iata, m]));

  const updates = storedUpdates.length ? storedUpdates : SEED_UPDATES;
  const contracts = storedContracts.length ? storedContracts : SEED_CONTRACTS;
  const meetings = storedMeetings.length ? storedMeetings : SEED_MEETINGS;

  const timeline = buildTimeline(updates, meetings, contracts);
  const bdSummary = timelineByBdSummary(timeline);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader session={session} subtitle="Leadership workspace" navActive="workspace" />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 space-y-6">
        <HomeTabs
          tab={tab}
          opportunities={opportunities}
          summary={bdSummary}
          timeline={timeline}
          updates={updates}
          contracts={contracts}
          metricsByIata={metricsByIata}
          users={USERS}
          accountLabelById={Object.fromEntries(ACCOUNTS.map((a) => [a.iata, `${a.iata} · ${a.name}`]))}
        />

        <p className="text-[11px] text-[var(--ink-faint)]">
          {Object.keys(aggregatedMetrics).length
            ? `Metrics aggregated from noSave_*.csv · ${Object.keys(aggregatedMetrics).length} carriers · last refresh ${(Object.values(aggregatedMetrics)[0] as { lastUpdated: string }).lastUpdated}`
            : "Metrics are seeded placeholders — run `npm run refresh` to aggregate the latest CSV."}
        </p>
      </main>
    </div>
  );
}
