"use client";
import { useRouter } from "next/navigation";
import type { OpportunityRecord, UpdateRecord, ContractRecord, AccountMetrics } from "@/lib/store";
import type { SourceBucket } from "@/lib/signals";
import type { TimelineItem } from "@/lib/timeline";
import type { User } from "@/lib/users";
import OpportunitiesTab from "./OpportunitiesTab";
import ActivityTab from "./ActivityTab";
import ContractsTab from "./ContractsTab";
import MetricsTab from "./MetricsTab";

export type HomeTabKey = "opportunities" | "activity" | "contracts" | "metrics";

export const HOME_TABS: { key: HomeTabKey; label: string }[] = [
  { key: "opportunities", label: "Opportunities & Threats" },
  { key: "activity", label: "Activity" },
  { key: "contracts", label: "Contracts & Financials" },
  { key: "metrics", label: "Metrics" },
];

interface BdSummary {
  bd: User | undefined;
  total: number;
  missed: number;
  pending: number;
}

export default function HomeTabs({
  tab,
  opportunities,
  board,
  summary,
  timeline,
  updates,
  contracts,
  metricsByIata,
  users,
  accountLabelById,
}: {
  tab: HomeTabKey;
  opportunities: OpportunityRecord[];
  board: SourceBucket[];
  summary: BdSummary[];
  timeline: TimelineItem[];
  updates: UpdateRecord[];
  contracts: ContractRecord[];
  metricsByIata: Record<string, AccountMetrics>;
  users: User[];
  accountLabelById: Record<string, string>;
}) {
  const router = useRouter();
  const liveCount = opportunities.filter(
    (o) => o.status === "open" || o.status === "stalled",
  ).length;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--line)]">
        {HOME_TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => router.replace(`/leader/workspace?tab=${t.key}`, { scroll: false })}
              className={`relative -mb-px flex items-center gap-1.5 rounded-t-lg border px-3.5 py-2 text-[12px] font-semibold transition ${
                active
                  ? "border-[var(--line)] border-b-white bg-white text-[var(--brand)]"
                  : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink)]"
              }`}
            >
              {t.label}
              {t.key === "opportunities" && liveCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${
                    active ? "bg-[var(--brand-soft)] text-[var(--brand-dark)]" : "bg-[var(--bg)] text-[var(--ink-faint)]"
                  }`}
                >
                  {liveCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div className="pt-5">
        {tab === "opportunities" && (
          <OpportunitiesTab opportunities={opportunities} board={board} />
        )}
        {tab === "activity" && (
          <ActivityTab
            summary={summary}
            timeline={timeline}
            updates={updates}
            metrics={metricsByIata}
            users={users}
            accountLabelById={accountLabelById}
          />
        )}
        {tab === "contracts" && <ContractsTab contracts={contracts} />}
        {tab === "metrics" && <MetricsTab metricsByIata={metricsByIata} />}
      </div>
    </div>
  );
}
