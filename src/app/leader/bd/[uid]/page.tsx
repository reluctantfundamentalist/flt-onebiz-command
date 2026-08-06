import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { findUser, accountsForUser } from "@/lib/users";
import { SEED_UPDATES, SEED_MEETINGS, SEED_CONTRACTS } from "@/lib/seed";
import { listUpdates, listMeetings, listContracts } from "@/lib/store";
import { buildTimeline, timelineForBd } from "@/lib/timeline";
import AppHeader from "@/components/AppHeader";
import GanttChart from "@/components/gantt/GanttChart";
import UpdatesPanel from "@/components/leader/UpdatesPanel";
import { USERS, findAccount, ACCOUNTS } from "@/lib/users";

export default async function BdDetailPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const bd = findUser(uid);
  if (!bd || bd.role !== "bd") notFound();

  const session = await getSession();
  if (!session) return null;

  const scoped = accountsForUser(bd);
  const scopeSet = new Set(scoped.map((a) => a.iata));
  const accountLabelById = Object.fromEntries(
    ACCOUNTS.map((a) => [a.iata, `${a.iata} · ${a.name}`]),
  );

  const [storedUpdates, storedMeetings, storedContracts] = await Promise.all([
    listUpdates(),
    listMeetings(),
    listContracts(),
  ]);
  const updates = (storedUpdates.length ? storedUpdates : SEED_UPDATES).filter((u) => scopeSet.has(u.accountIata));
  const meetings = (storedMeetings.length ? storedMeetings : SEED_MEETINGS).filter((m) => scopeSet.has(m.accountIata));
  const contracts = (storedContracts.length ? storedContracts : SEED_CONTRACTS).filter((c) => scopeSet.has(c.accountIata));

  const timeline = timelineForBd(buildTimeline(updates, meetings, contracts), bd.id);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader session={session} subtitle={`BD board · ${bd.name}`} />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/leader"
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] hover:bg-[var(--bg)]"
          >
            ← Leaders
          </Link>
          <div>
            <div className="text-xl font-semibold text-[var(--ink)]">{bd.name}</div>
            <div className="text-[11px] text-[var(--ink-faint)]">{bd.title} · {scoped.length} accounts</div>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            Pending pipeline (Gantt)
          </div>
          <GanttChart
            items={timeline}
            groupBy="account"
            accountLabelById={accountLabelById}
            emptyLabel="Nothing pending on this BD's board."
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-sm font-semibold text-[var(--ink)]">Accounts owned</div>
            <div className="grid gap-2">
              {scoped.map((a) => (
                <Link
                  key={a.iata}
                  href={`/leader/account/${a.iata}`}
                  className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 hover:border-[var(--brand)]"
                >
                  <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-dark)]">
                    {a.iata}
                  </span>
                  <span className="text-sm text-[var(--ink)]">{a.name}</span>
                  <span className="ml-auto text-[10px] text-[var(--ink-faint)]">{a.hqCountry}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold text-[var(--ink)]">Recent updates</div>
            <UpdatesPanel updates={updates} />
          </div>
        </section>
      </main>
    </div>
  );
}
