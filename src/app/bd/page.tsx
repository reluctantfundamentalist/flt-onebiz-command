import Link from "next/link";
import { getSession } from "@/lib/auth";
import { findUser, accountsForUser, ACCOUNTS } from "@/lib/users";
import { SEED_UPDATES, SEED_MEETINGS, SEED_CONTRACTS } from "@/lib/seed";
import { listUpdates, listMeetings, listContracts } from "@/lib/store";
import { buildTimeline, timelineForBd } from "@/lib/timeline";
import AppHeader from "@/components/AppHeader";
import GanttChart from "@/components/gantt/GanttChart";
import LogUpdateForm from "@/components/LogUpdateForm";
import TopicBoard from "@/components/TopicBoard";

export default async function BdPage() {
  const session = await getSession();
  if (!session) return null;
  const user = findUser(session.uid);
  if (!user) return null;

  const scopedAccounts = accountsForUser(user);
  const scopeSet = new Set(scopedAccounts.map((a) => a.iata));
  const accountLabelById = Object.fromEntries(
    ACCOUNTS.map((a) => [a.iata, `${a.iata} · ${a.name}`]),
  );

  const [storedUpdates, storedMeetings, storedContracts] = await Promise.all([
    listUpdates(),
    listMeetings(),
    listContracts(),
  ]);
  const updates = (storedUpdates.length ? storedUpdates : SEED_UPDATES).filter((u) =>
    scopeSet.has(u.accountIata),
  );
  const meetings = (storedMeetings.length ? storedMeetings : SEED_MEETINGS).filter((m) =>
    scopeSet.has(m.accountIata),
  );
  const contracts = (storedContracts.length ? storedContracts : SEED_CONTRACTS).filter((c) =>
    scopeSet.has(c.accountIata),
  );

  const timeline = timelineForBd(buildTimeline(updates, meetings, contracts), user.id);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader session={session} subtitle={`BD workspace · ${user.title}`} />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 space-y-6">
        <LogUpdateForm accounts={scopedAccounts} />

        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <span>Your pipeline</span>
            <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--ink-faint)]">
              consolidated tasks
            </span>
          </div>
          <GanttChart
            items={timeline}
            groupBy="account"
            accountLabelById={accountLabelById}
            emptyLabel="Nothing pending. Add a next-step to an update to populate this."
          />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--ink)]">Your accounts</h2>
            <span className="text-[11px] text-[var(--ink-faint)]">{scopedAccounts.length} in scope</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scopedAccounts.map((a) => (
              <Link
                key={a.iata}
                href={`/leader/account/${a.iata}`}
                className="rounded-xl border border-[var(--line)] bg-white p-4 transition hover:border-[var(--brand)] hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-dark)]">
                    {a.iata}
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink)]">{a.name}</span>
                </div>
                <div className="mt-1 text-[11px] text-[var(--ink-faint)]">
                  {a.hqCountry} · {a.region}
                </div>
                {a.ownerId !== user.id && (
                  <div className="mt-1 text-[10px] italic text-[var(--ink-faint)]">
                    Reportee: {findUser(a.ownerId)?.name}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <span>Topics from inbox</span>
            <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--ink-faint)]">
              LLM-clustered from Outlook · last 90 days
            </span>
          </div>
          <TopicBoard updates={updates} />
        </section>
      </main>
    </div>
  );
}
