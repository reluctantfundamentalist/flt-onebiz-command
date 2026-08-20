import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { findAccount, findUser, layersFor, ACCOUNTS } from "@/lib/users";
import { SEED_UPDATES, SEED_MEETINGS, SEED_CONTRACTS } from "@/lib/seed";
import { listUpdates, listMeetings, listContracts, listOpportunities } from "@/lib/store";
import { loadAirlineDataset } from "@/lib/dashboard-loader";
import { loadMetricsByIata } from "@/lib/metrics-loader";
import { buildTimeline, timelineForAccount } from "@/lib/timeline";
import { orgFor } from "@/lib/org-seed";
import { loadEdgesForAccount } from "@/lib/participants";
import { loadStakeholders } from "@/lib/stakeholder-loader";
import AppHeader from "@/components/AppHeader";
import OrgChart from "@/components/leader/OrgChart";
import GanttChart from "@/components/gantt/GanttChart";
import LogUpdateForm from "@/components/LogUpdateForm";
import IntelBuckets from "@/components/leader/IntelBuckets";
import StakeholderPanel from "@/components/leader/StakeholderPanel";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { updatesToItems, intelToItems, meetingsToItems, bucketByTheme } from "@/lib/intel-buckets";
import { fmtUsd } from "@/lib/opportunity-view";
import { STATUS_META } from "@/lib/opportunity-view";
import type { MarketIntel } from "@/lib/signals";
import { readFileSync } from "fs";
import { join } from "path";

const ACCOUNT_TABS = [
  { key: "overview", label: "Overview" },
  { key: "intel", label: "Intel & Activity" },
  { key: "performance", label: "Performance" },
  { key: "people", label: "People" },
] as const;

type AccountTabKey = (typeof ACCOUNT_TABS)[number]["key"];

function fmtM(n: number) {
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

  const [storedUpdates, storedMeetings, storedContracts, dataset, metricsByIata, opportunities, stakeholders, edges] =
    await Promise.all([
      listUpdates(),
      listMeetings(),
      listContracts(),
      loadAirlineDataset(account.iata),
      loadMetricsByIata(),
      listOpportunities(),
      loadStakeholders(account.iata),
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
  const metric = metricsByIata[account.iata];

  const allIntel = JSON.parse(
    readFileSync(join(process.cwd(), "src/data/market_intel.json"), "utf8"),
  ) as MarketIntel[];
  const accountIntel = allIntel.filter((m) => m.iata === account.iata);

  const accountLabelById = Object.fromEntries(ACCOUNTS.map((a) => [a.iata, `${a.iata} · ${a.name}`]));
  const timeline = timelineForAccount(buildTimeline(updates, meetings, contracts), account.iata);

  // One bucketed view across every evidence source: email threads, market
  // intel, calendar/meetings, manual inputs.
  const buckets = bucketByTheme([
    ...updatesToItems(updates),
    ...intelToItems(accountIntel),
    ...meetingsToItems(meetings),
  ]);

  const accountOpps = opportunities.filter((o) => o.accountIata === account.iata);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader session={session} subtitle={`Airline profile · ${account.iata}`} navActive="workspace" />

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

        {/* At-a-glance stats */}
        {(contract || metric) && (
          <div className="grid gap-3 sm:grid-cols-4">
            {contract && (
              <>
                <StatTile label="Contract target" value={fmtM(contract.targetUsd)} />
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
                value={fmtM(metric.ytdFlownRevUsd)}
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

        {/* ── Overview ─────────────────────────────────────────────── */}
        {active === "overview" && (
          <div className="space-y-6">
            <section>
              <SectionLabel
                text="Opportunities & threats"
                hint={`${accountOpps.filter((o) => o.status === "open" || o.status === "stalled").length} live`}
              />
              {accountOpps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-5 text-center text-sm text-[var(--ink-faint)]">
                  No tracked opportunities yet — promote them from the Overview mega updates.
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {accountOpps.map((o) => {
                    const meta = STATUS_META[o.status];
                    return (
                      <div key={o.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                            style={{ background: meta.bg, color: meta.text }}
                          >
                            {meta.label}
                          </span>
                          {o.kind === "threat" && (
                            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                              threat
                            </span>
                          )}
                          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[var(--ink)]">
                            {o.title}
                          </span>
                          {o.valueUsd ? (
                            <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              {fmtUsd(o.valueUsd)}
                            </span>
                          ) : null}
                        </div>
                        {o.nextAction && (
                          <div className="mt-1.5 rounded bg-[var(--brand-soft)] px-2 py-1 text-[11px] text-[var(--brand-dark)]">
                            <span className="font-semibold">Action: </span>{o.nextAction}
                            {o.valueUsd ? (
                              <span className="ml-1.5 font-bold">tied to {fmtUsd(o.valueUsd)}</span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <SectionLabel text="Ownership hierarchy" hint="global layer → local layers, with BD activity" />
              <div className="space-y-0">
                {layers.map((layer, idx) => {
                  const layerUpdates = updates.filter((u) => u.bd === layer.ownerId);
                  const isGlobal = layer.market === "GLOBAL";
                  const bd = findUser(layer.ownerId);
                  return (
                    <div key={layer.market} className={isGlobal ? "" : "ml-6 border-l-2 border-[var(--line)] pl-4"}>
                      {!isGlobal && idx > 0 && (
                        <div className="py-1 text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">
                          ↳ local layer · raises to global when HQ leverage is needed
                        </div>
                      )}
                      <div className="rounded-xl border border-[var(--line)] bg-white p-4">
                        <div className="mb-1 flex items-center justify-between">
                          <div className="text-[13px] font-semibold text-[var(--ink)]">
                            {isGlobal ? "Global" : `Local · ${layer.market}`}
                          </div>
                          <span className="rounded bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand-dark)]">
                            {bd?.name ?? layer.ownerId}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--ink-faint)]">
                          {layerUpdates.length} interaction{layerUpdates.length === 1 ? "" : "s"} on this account
                        </div>
                        {layerUpdates.slice(0, 3).map((u) => (
                          <div key={u.id} className="mt-1.5 border-l-2 border-[var(--line)] pl-2 text-[12px] text-[var(--ink-soft)]">
                            {u.headline}
                          </div>
                        ))}
                      </div>
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

        {/* ── Intel & Activity ─────────────────────────────────────── */}
        {active === "intel" && (
          <div className="space-y-6">
            <section>
              <SectionLabel
                text="Intel by theme × priority"
                hint="email threads · market intel · calendar · manual inputs"
              />
              <IntelBuckets buckets={buckets} />
            </section>

            <section>
              <SectionLabel text="Pipeline" hint="click a bar to open its insight" />
              <GanttChart
                items={timeline}
                groupBy="account"
                accountLabelById={accountLabelById}
                emptyLabel="No pending next-steps, meetings, or milestones."
                accountHrefSuffix="?tab=intel"
              />
            </section>
          </div>
        )}

        {/* ── Performance ──────────────────────────────────────────── */}
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

        {/* ── People ───────────────────────────────────────────────── */}
        {active === "people" && (
          <div className="space-y-6">
            <section>
              <SectionLabel
                text="Stakeholder intelligence"
                hint="influence score · traits · what moves them"
              />
              <StakeholderPanel stakeholders={stakeholders} />
            </section>

            {org && (
              <section>
                <SectionLabel text="Reporting structure" hint="airline chain × Trip.com counterparts" />
                <OrgChart seed={org} edges={edges} />
              </section>
            )}
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
