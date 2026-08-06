import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { findAccount, findUser, ACCOUNTS } from "@/lib/users";
import { SEED_UPDATES, SEED_MEETINGS, SEED_CONTRACTS } from "@/lib/seed";
import { listUpdates, listMeetings, listContracts } from "@/lib/store";
import { loadAirlineDataset } from "@/lib/dashboard-loader";
import { loadMetricsByIata } from "@/lib/metrics-loader";
import { buildTimeline, timelineForAccount } from "@/lib/timeline";
import { orgFor } from "@/lib/org-seed";
import AppHeader from "@/components/AppHeader";
import UpdatesPanel from "@/components/leader/UpdatesPanel";
import OrgChart from "@/components/leader/OrgChart";
import GanttChart from "@/components/gantt/GanttChart";
import RecentEvents from "@/components/RecentEvents";
import LogUpdateForm from "@/components/LogUpdateForm";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ iata: string }>;
}) {
  const { iata } = await params;
  const account = findAccount(iata);
  if (!account) notFound();

  const session = await getSession();
  if (!session) return null;

  const [storedUpdates, storedMeetings, storedContracts, dataset, metricsByIata] = await Promise.all([
    listUpdates(),
    listMeetings(),
    listContracts(),
    loadAirlineDataset(account.iata),
    loadMetricsByIata(),
  ]);
  const updates = (storedUpdates.length ? storedUpdates : SEED_UPDATES).filter(
    (u) => u.accountIata === account.iata,
  );
  const meetings = (storedMeetings.length ? storedMeetings : SEED_MEETINGS).filter(
    (m) => m.accountIata === account.iata,
  );
  const contracts = (storedContracts.length ? storedContracts : SEED_CONTRACTS).filter(
    (c) => c.accountIata === account.iata,
  );
  const contract = contracts[0];
  const owner = findUser(account.ownerId);
  const org = orgFor(account.iata);

  const accountLabelById = Object.fromEntries(ACCOUNTS.map((a) => [a.iata, `${a.iata} · ${a.name}`]));
  const timeline = timelineForAccount(buildTimeline(updates, meetings, contracts), account.iata);
  const metric = metricsByIata[account.iata];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader session={session} subtitle={`${account.iata} · ${account.name}`} />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 space-y-6">
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={session.role === "leader" ? "/leader" : "/bd"}
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] hover:bg-[var(--bg)]"
          >
            ← Back
          </Link>
          <div>
            <div className="text-xl font-semibold text-[var(--ink)]">
              {account.name} <span className="text-[var(--ink-faint)]">({account.iata})</span>
            </div>
            <div className="text-[11px] text-[var(--ink-faint)]">
              {account.hqCountry} · {account.region} · Owner: {owner?.name ?? "—"}
            </div>
          </div>
        </div>

        {(contract || metric) && (
          <div className="grid gap-3 sm:grid-cols-4">
            {contract && (
              <>
                <StatTile label="Contract target" value={fmtUsd(contract.targetUsd)} />
                <StatTile
                  label="Completion"
                  value={`${((contract.ytdFlownUsd / contract.targetUsd) * 100).toFixed(0)}%`}
                />
                <StatTile label="Period ends" value={new Date(contract.periodEnd).toLocaleDateString()} />
              </>
            )}
            {metric && (
              <StatTile
                label="YTD Flown Rev"
                value={fmtUsd(metric.ytdFlownRevUsd)}
                delta={metric.ytdFlownRevVlyPct}
              />
            )}
          </div>
        )}

        <section>
          <div className="mb-3 text-sm font-semibold text-[var(--ink)]">Pipeline (Gantt)</div>
          <GanttChart
            items={timeline}
            groupBy="account"
            accountLabelById={accountLabelById}
            emptyLabel="No pending next-steps, meetings, or milestones."
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-3 text-sm font-semibold text-[var(--ink)]">Updates</div>
            <UpdatesPanel updates={updates} accountName={account.name} metrics={metricsByIata} />
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
                      <span>{findUser(m.bd)?.name ?? m.bd}</span>
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

        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <span>Hierarchy</span>
            <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--ink-faint)]">
              airline reporting chain × Trip.com counterparts
            </span>
          </div>
          {org ? (
            <OrgChart seed={org} />
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-6 text-center text-sm text-[var(--ink-faint)]">
              Hierarchy for {account.iata} not yet seeded — will populate from update participants in v1.
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 text-sm font-semibold text-[var(--ink)]">Recent events</div>
          <RecentEvents updates={updates} meetings={meetings} contracts={contracts} />
        </section>

        <section>
          <LogUpdateForm accounts={ACCOUNTS} defaultAccountIata={account.iata} />
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <span>Performance dashboard</span>
            {dataset ? (
              <span className="rounded bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--brand-dark)]">
                {dataset.meta.airlineName} · report {dataset.meta.reportMonth}
              </span>
            ) : (
              <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--ink-faint)]">
                dataset pending — run `npm run refresh`
              </span>
            )}
          </div>
          {dataset ? (
            <div className="rounded-xl border border-[var(--line)] bg-white p-4">
              <DashboardShell data={dataset} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg)] text-2xl">
                📊
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)]">Dataset not yet vendored</h3>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Run <code>npm run refresh</code> against the latest noSave_*.csv to populate
                <code> src/data-vendor/{account.iata}/latest.json</code>.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatTile({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const deltaColor = delta === undefined ? undefined : delta >= 0 ? "var(--good)" : "var(--bad)";
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-lg font-semibold text-[var(--ink)]">{value}</div>
        {delta !== undefined && (
          <span className="text-[11px] font-semibold" style={{ color: deltaColor }}>
            {delta >= 0 ? "+" : ""}{delta.toFixed(1)}% vLY
          </span>
        )}
      </div>
    </div>
  );
}
