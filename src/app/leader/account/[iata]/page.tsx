import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { findAccount, findUser, layersFor, ACCOUNTS } from "@/lib/users";
import { SEED_UPDATES, SEED_MEETINGS, SEED_CONTRACTS } from "@/lib/seed";
import { listUpdates, listMeetings, listContracts } from "@/lib/store";
import { loadAirlineDataset } from "@/lib/dashboard-loader";
import { loadMetricsByIata } from "@/lib/metrics-loader";
import { loadEdgesForAccount } from "@/lib/participants";
import { buildTimeline, timelineForAccount } from "@/lib/timeline";
import { orgFor } from "@/lib/org-seed";
import AppHeader from "@/components/AppHeader";
import OrgChart from "@/components/leader/OrgChart";
import GanttChart from "@/components/gantt/GanttChart";
import RecentEvents from "@/components/RecentEvents";
import LogUpdateForm from "@/components/LogUpdateForm";
import TopicBoard from "@/components/TopicBoard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import SignalStrip from "@/components/leader/SignalStrip";
import { buildSignals } from "@/lib/signals";
import { readFileSync } from "fs";
import { join } from "path";

const ACCOUNT_TABS = [
  { key: "overview", label: "Overview" },
  { key: "performance", label: "Performance" },
  { key: "activity", label: "Intel & Activity" },
  { key: "people", label: "People" },
] as const;

type AccountTabKey = (typeof ACCOUNT_TABS)[number]["key"];

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function SectionLabel({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
      <span>{text}</span>
      {hint && (
        <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--ink-faint)]">
          {hint}
        </span>
      )}
    </div>
  );
}

export default async function AccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ iata: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { iata } = await params;
  const account = findAccount(iata);
  if (!account) notFound();

  const session = await getSession();
  if (!session) return null;

  const { tab } = await searchParams;
  const active: AccountTabKey = ACCOUNT_TABS.some((t) => t.key === tab)
    ? (tab as AccountTabKey)
    : "overview";

  const [storedUpdates, storedMeetings, storedContracts, dataset, metricsByIata, edges] = await Promise.all([
    listUpdates(),
    listMeetings(),
    listContracts(),
    loadAirlineDataset(account.iata),
    loadMetricsByIata(),
    loadEdgesForAccount(account.iata),
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
  const layers = layersFor(account);
  const org = orgFor(account.iata);

  const accountLabelById = Object.fromEntries(ACCOUNTS.map((a) => [a.iata, `${a.iata} · ${a.name}`]));
  const timeline = timelineForAccount(buildTimeline(updates, meetings, contracts), account.iata);
  const metric = metricsByIata[account.iata];
  const intel = JSON.parse(
    readFileSync(join(process.cwd(), "src/data/market_intel.json"), "utf8"),
  );
  const signals = buildSignals(account.iata, metric, updates, intel);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader session={session} subtitle={`${account.iata} · ${account.name}`} navActive="workspace" />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 space-y-5">
        {/* Title row */}
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

        {/* At-a-glance stats, always visible */}
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

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 border-b border-[var(--line)]">
          {ACCOUNT_TABS.map((t) => {
            const isActive = t.key === active;
            return (
              <Link
                key={t.key}
                href={`/leader/account/${account.iata}?tab=${t.key}`}
                className={`relative -mb-px rounded-t-lg border px-3.5 py-2 text-[12px] font-semibold transition ${
                  isActive
                    ? "border-[var(--line)] border-b-white bg-white text-[var(--brand)]"
                    : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink)]"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* Tab content */}
        {active === "overview" && (
          <div className="space-y-6">
            <section>
              <SectionLabel text="Signals" hint="metrics + market intel + BD inbox" />
              <SignalStrip groups={signals} />
            </section>

            <section>
              <SectionLabel text="Ownership layers" hint="global + local hierarchy" />
              <div className="grid gap-3 lg:grid-cols-2">
                {layers.map((layer) => {
                  const layerUpdates = updates.filter((u) => u.bd === layer.ownerId);
                  const isGlobal = layer.market === "GLOBAL";
                  return (
                    <div key={layer.market} className="rounded-xl border border-[var(--line)] bg-white p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-[13px] font-semibold text-[var(--ink)]">
                          {isGlobal ? "Global" : `Local · ${layer.market}`}
                        </div>
                        <span className="rounded bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand-dark)]">
                          {findUser(layer.ownerId)?.name ?? layer.ownerId}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--ink-faint)]">
                        {layerUpdates.length} intel topics from inbox
                      </div>
                      {layerUpdates.slice(0, 2).map((u) => (
                        <div key={u.id} className="mt-1.5 border-l-2 border-[var(--line)] pl-2 text-[12px] text-[var(--ink-soft)]">
                          {u.headline}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <LogUpdateForm accounts={ACCOUNTS} defaultAccountIata={account.iata} />
            </section>
          </div>
        )}

        {active === "performance" && (
          <section>
            <SectionLabel
              text="Performance dashboard"
              hint={
                dataset
                  ? `${dataset.meta.airlineName} · report ${dataset.meta.reportMonth}`
                  : "dataset pending — run `npm run refresh`"
              }
            />
            {dataset ? (
              <div className="rounded-xl border border-[var(--line)] bg-white p-4">
                <DashboardShell data={dataset} />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center">
                <h3 className="text-lg font-semibold text-[var(--ink)]">Dataset not yet vendored</h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Run <code>npm run refresh</code> against the latest noSave_*.csv to populate
                  <code> src/data-vendor/{account.iata}/latest.json</code>.
                </p>
              </div>
            )}
          </section>
        )}

        {active === "activity" && (
          <div className="space-y-6">
            <section>
              <SectionLabel text="Topics from inbox" hint="LLM-clustered from Outlook · last 90 days" />
              <TopicBoard updates={updates} />
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SectionLabel text="Pipeline" hint="next steps · meetings · contract period" />
                <GanttChart
                  items={timeline}
                  groupBy="account"
                  accountLabelById={accountLabelById}
                  emptyLabel="No pending next-steps, meetings, or milestones."
                />
              </div>
              <div>
                <SectionLabel text="Meetings" />
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
                </div>
              </div>
            </section>

            <section>
              <SectionLabel text="Recent events" />
              <RecentEvents updates={updates} meetings={meetings} contracts={contracts} />
            </section>
          </div>
        )}

        {active === "people" && (
          <div className="space-y-6">
            <section>
              <SectionLabel text="Hierarchy" hint="airline reporting chain × Trip.com counterparts" />
              {org ? (
                <OrgChart seed={org} edges={edges} />
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-6 text-center text-sm text-[var(--ink-faint)]">
                  Hierarchy for {account.iata} not yet seeded — will populate from update participants in v1.
                </div>
              )}
            </section>

            <section>
              <SectionLabel
                text="Contact rollup"
                hint={`${edges.length} airline contacts from email threads · last 90 days`}
              />
              {edges.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-6 text-center text-sm text-[var(--ink-faint)]">
                  No email-thread participants captured yet for {account.iata}.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--bg)] text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Airline contact</th>
                        <th className="px-4 py-2 text-left font-semibold">Trip counterpart</th>
                        <th className="px-4 py-2 text-right font-semibold">Threads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...edges]
                        .sort((a, b) => b.threads - a.threads)
                        .slice(0, 15)
                        .map((e, i) => (
                          <tr key={i} className="border-t border-[var(--line)]">
                            <td className="px-4 py-2.5 font-medium text-[var(--ink)]">{e.airline}</td>
                            <td className="px-4 py-2.5 text-[12px] text-[var(--ink-soft)]">{e.trip}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="rounded bg-[var(--brand-soft)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--brand-dark)]">
                                {e.threads}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
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
