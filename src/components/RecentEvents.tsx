import Link from "next/link";
import { findUser } from "@/lib/users";
import { isNoise } from "@/lib/signals";
import type { UpdateRecord, MeetingRecord, ContractRecord } from "@/lib/store";

type Event = {
  when: string;
  kind: "update" | "meeting" | "contract";
  label: string;
  by: string;
  href: string;
};

function toEvents(
  updates: UpdateRecord[],
  meetings: MeetingRecord[],
  contracts: ContractRecord[],
): Event[] {
  const ev: Event[] = [];
  for (const u of updates) {
    if (isNoise(u.headline)) continue;
    ev.push({
      when: u.createdAt,
      kind: "update",
      label: u.headline,
      by: findUser(u.createdBy)?.name ?? u.createdBy,
      href: `/leader/account/${u.accountIata}`,
    });
  }
  for (const m of meetings) {
    ev.push({
      when: m.when,
      kind: "meeting",
      label: m.agenda,
      by: findUser(m.bd)?.name ?? m.bd,
      href: `/leader/account/${m.accountIata}`,
    });
  }
  for (const c of contracts) {
    ev.push({
      when: c.updatedAt || c.periodStart,
      kind: "contract",
      label: `Contract update · target $${(c.targetUsd / 1_000_000).toFixed(1)}M`,
      by: "—",
      href: `/leader/account/${c.accountIata}`,
    });
  }
  return ev.sort((a, b) => b.when.localeCompare(a.when)).slice(0, 10);
}

const KIND_STYLE: Record<Event["kind"], { bg: string; fg: string; label: string }> = {
  update:   { bg: "#e8f1fb", fg: "#0a4f96", label: "Update" },
  meeting:  { bg: "#fff7ed", fg: "#c2410c", label: "Meeting" },
  contract: { bg: "#f3e8ff", fg: "#6d4aff", label: "Contract" },
};

export default function RecentEvents({
  updates,
  meetings,
  contracts,
}: {
  updates: UpdateRecord[];
  meetings: MeetingRecord[];
  contracts: ContractRecord[];
}) {
  const events = toEvents(updates, meetings, contracts);

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-white p-4 text-sm text-[var(--ink-faint)]">
        No recent events on record.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white">
      <ol className="divide-y divide-[var(--line)]">
        {events.map((e, i) => {
          const style = KIND_STYLE[e.kind];
          return (
            <li key={i}>
              <Link
                href={e.href}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg)]"
              >
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ background: style.bg, color: style.fg }}
                >
                  {style.label}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]">
                  {e.label}
                </span>
                <span className="shrink-0 text-[11px] text-[var(--ink-faint)]">{e.by}</span>
                <span className="shrink-0 text-[11px] font-medium text-[var(--ink-faint)]">
                  {new Date(e.when).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
