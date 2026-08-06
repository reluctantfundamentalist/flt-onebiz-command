import Link from "next/link";
import { getSession } from "@/lib/auth";
import { findUser, accountsForUser } from "@/lib/users";
import { SEED_UPDATES, SEED_MEETINGS } from "@/lib/seed";
import { listUpdates, listMeetings } from "@/lib/store";
import AppHeader from "@/components/AppHeader";
import UpdatesPanel from "@/components/leader/UpdatesPanel";

export default async function BdPage() {
  const session = await getSession();
  if (!session) return null;
  const user = findUser(session.uid);
  if (!user) return null;

  const scopedAccounts = accountsForUser(user);
  const scopeSet = new Set(scopedAccounts.map((a) => a.iata));

  const [storedUpdates, storedMeetings] = await Promise.all([listUpdates(), listMeetings()]);
  const updates = (storedUpdates.length ? storedUpdates : SEED_UPDATES).filter((u) =>
    scopeSet.has(u.accountIata),
  );
  const meetings = (storedMeetings.length ? storedMeetings : SEED_MEETINGS).filter((m) =>
    scopeSet.has(m.accountIata),
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader session={session} subtitle={`BD workspace · ${user.title}`} />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 space-y-6">
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

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-sm font-semibold text-[var(--ink)]">Airline updates</div>
            <UpdatesPanel updates={updates} />
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold text-[var(--ink)]">Meeting pipeline</div>
            <div className="rounded-xl border border-[var(--line)] bg-white p-4">
              {meetings.length === 0 && (
                <p className="text-xs text-[var(--ink-faint)]">No meetings on record.</p>
              )}
              <ul className="space-y-3">
                {meetings.map((m) => (
                  <li key={m.id} className="border-b border-[var(--line)] pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 text-[10px] text-[var(--ink-faint)]">
                      <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 font-medium">
                        {new Date(m.when).toLocaleDateString()}
                      </span>
                      <span>{m.accountIata}</span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-[var(--ink)]">{m.agenda}</div>
                    <div className="mt-1 text-[11px] text-[var(--ink-soft)]">
                      {m.attendees.join(" · ")}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] italic text-[var(--ink-faint)]">
                Outlook calendar pull wires in v1.
              </p>
            </div>
          </div>
        </section>

        <p className="text-[11px] italic text-[var(--ink-faint)]">
          Deal-modeling flows removed — this workspace focuses on airline updates, POS performance,
          and meeting pipeline. Lark-bot ingest wires in v2.
        </p>
      </main>
    </div>
  );
}
