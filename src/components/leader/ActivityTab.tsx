"use client";
import BdNavStrip from "./BdNavStrip";
import UpdatesPanel from "./UpdatesPanel";
import GanttChart from "@/components/gantt/GanttChart";
import type { TimelineItem } from "@/lib/timeline";
import type { UpdateRecord, AccountMetrics } from "@/lib/store";
import type { User } from "@/lib/users";

interface BdSummary {
  bd: User | undefined;
  total: number;
  missed: number;
  pending: number;
}

export default function ActivityTab({
  summary,
  timeline,
  updates,
  metrics,
  users,
  accountLabelById,
}: {
  summary: BdSummary[];
  timeline: TimelineItem[];
  updates: UpdateRecord[];
  metrics: Record<string, AccountMetrics>;
  users: User[];
  accountLabelById: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-[var(--ink)]">BD workload</h3>
          <span className="text-[10.5px] text-[var(--ink-faint)]">click a BD to open their board</span>
        </div>
        <BdNavStrip summary={summary} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-[var(--ink)]">Cross-account Gantt</h3>
          <span className="text-[10.5px] text-[var(--ink-faint)]">
            next steps · meetings · contract periods
          </span>
        </div>
        <GanttChart
          items={timeline}
          windowDays={150}
          windowStartOffsetDays={30}
          groupBy="account"
          users={users}
          accountLabelById={accountLabelById}
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-[var(--ink)]">Updates feed</h3>
          <span className="text-[10.5px] text-[var(--ink-faint)]">
            {updates.length} records · newest first
          </span>
        </div>
        <UpdatesPanel updates={updates} metrics={metrics} />
      </section>
    </div>
  );
}
