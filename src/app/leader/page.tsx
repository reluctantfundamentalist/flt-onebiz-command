import { getSession } from "@/lib/auth";
import { SEED_UPDATES, SEED_MEETINGS } from "@/lib/seed";
import { listUpdates, listMeetings, listOpportunities } from "@/lib/store";
import { loadMetricsByIata } from "@/lib/metrics-loader";
import HomeWorkspace from "@/components/leader/HomeWorkspace";
import { readFileSync } from "fs";
import { join } from "path";
import AppHeader from "@/components/AppHeader";

export default async function LeaderPage() {
  const session = await getSession();
  if (!session) return null;

  const [storedUpdates, storedMeetings, aggregatedMetrics, opportunities] = await Promise.all([
    listUpdates(),
    listMeetings(),
    loadMetricsByIata(),
    listOpportunities(),
  ]);

  const updates = storedUpdates.length ? storedUpdates : SEED_UPDATES;
  const meetings = storedMeetings.length ? storedMeetings : SEED_MEETINGS;
  const intel = JSON.parse(
    readFileSync(join(process.cwd(), "src/data/market_intel.json"), "utf8"),
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader session={session} subtitle="Leadership workspace" navActive="overview" />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 space-y-6">
        <HomeWorkspace
          metrics={aggregatedMetrics}
          updates={updates}
          intel={intel}
          meetings={meetings}
          opportunities={opportunities}
        />
      </main>
    </div>
  );
}
