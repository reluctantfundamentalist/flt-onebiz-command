// Timeline items — derived, not stored. Each item is a horizontal Gantt
// bar with an owner (BD) and an account. Sources:
//   - UpdateRecord.nextStep with an inferred deadline
//   - MeetingRecord.when
//   - ContractRecord.periodStart / periodEnd (as a longer bar)

import type {
  UpdateRecord,
  MeetingRecord,
  ContractRecord,
} from "./store";
import { findAccount, findUser } from "./users";

export type TimelineKind = "next_step" | "meeting" | "contract";
export type TimelineStatus = "pending" | "in_progress" | "done" | "missed";

export interface TimelineItem {
  id: string;
  accountIata: string;
  ownerBdId: string;      // BD user id (parent owner if child update)
  label: string;
  startISO: string;
  endISO: string;
  status: TimelineStatus;
  kind: TimelineKind;
  sourceUpdateId?: string;
  sourceMeetingId?: string;
  sourceContract?: string; // account iata
  detail?: string;         // hover: crux of the workstream
  dollarUsd?: number;      // hover: explicit dollar figure if any
  priority?: string;       // hover: high/medium/low
  bdName?: string;         // hover: owning BD
  attendees?: string[];    // hover: meeting attendees
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toISO(d: Date): string {
  return d.toISOString();
}

function parseDate(iso: string): Date {
  return new Date(iso);
}

/**
 * Update -> timeline item. If update.nextStep contains a date-like clause we
 * anchor there; otherwise the bar starts today and runs for 7 days.
 */
function updateToTimeline(update: UpdateRecord): TimelineItem | null {
  if (!update.nextStep) return null;

  const bd = update.parentOwner ?? update.bd;
  const now = new Date();
  const start = update.meetingDate
    ? parseDate(update.meetingDate)
    : parseDate(update.createdAt);
  const end = new Date(start.getTime() + 7 * DAY_MS);

  const status: TimelineStatus =
    end.getTime() < now.getTime() ? "missed" : "pending";

  return {
    id: `ns_${update.id}`,
    accountIata: update.accountIata,
    ownerBdId: bd,
    label: update.nextStep,
    startISO: toISO(start),
    endISO: toISO(end),
    status,
    kind: "next_step",
    sourceUpdateId: update.id,
    detail: update.detail,
    dollarUsd: update.dollarImpact?.amountUsd,
    priority: update.priority,
    bdName: findUser(bd)?.name,
  };
}

function meetingToTimeline(meeting: MeetingRecord): TimelineItem {
  const start = parseDate(meeting.when);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const now = new Date();
  const status: TimelineStatus =
    meeting.outcome
      ? "done"
      : end.getTime() < now.getTime()
        ? "missed"
        : "pending";

  return {
    id: `mtg_${meeting.id}`,
    accountIata: meeting.accountIata,
    ownerBdId: meeting.bd,
    label: meeting.agenda,
    startISO: toISO(start),
    endISO: toISO(end),
    status,
    kind: "meeting",
    sourceMeetingId: meeting.id,
    bdName: findUser(meeting.bd)?.name,
    attendees: meeting.attendees,
  };
}

function contractToTimeline(contract: ContractRecord): TimelineItem {
  const account = findAccount(contract.accountIata);
  const ownerBdId = account?.ownerId ?? "anuj";
  const now = new Date();
  const start = parseDate(contract.periodStart);
  const end = parseDate(contract.periodEnd);

  const status: TimelineStatus =
    end.getTime() < now.getTime()
      ? "done"
      : start.getTime() < now.getTime()
        ? "in_progress"
        : "pending";

  return {
    id: `ctr_${contract.accountIata}`,
    accountIata: contract.accountIata,
    ownerBdId,
    label: `Contract period · target $${(contract.targetUsd / 1_000_000).toFixed(1)}M`,
    startISO: contract.periodStart,
    endISO: contract.periodEnd,
    status,
    kind: "contract",
    sourceContract: contract.accountIata,
  };
}

export function buildTimeline(
  updates: UpdateRecord[],
  meetings: MeetingRecord[],
  contracts: ContractRecord[],
): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const u of updates) {
    const item = updateToTimeline(u);
    if (item) items.push(item);
  }
  for (const m of meetings) items.push(meetingToTimeline(m));
  for (const c of contracts) items.push(contractToTimeline(c));
  return items.sort((a, b) => a.startISO.localeCompare(b.startISO));
}

export function timelineForAccount(items: TimelineItem[], iata: string): TimelineItem[] {
  return items.filter((i) => i.accountIata === iata);
}

export function timelineForBd(items: TimelineItem[], bdId: string): TimelineItem[] {
  return items.filter((i) => i.ownerBdId === bdId);
}

/**
 * Group timeline items by BD for the cross-BD nav strip on /leader.
 * Only counts non-done items (pending/in_progress/missed).
 */
export function timelineByBdSummary(items: TimelineItem[]) {
  const open = items.filter((i) => i.status !== "done");
  const by = new Map<string, { total: number; missed: number; pending: number; nextMeeting?: TimelineItem }>();
  for (const i of open) {
    let entry = by.get(i.ownerBdId);
    if (!entry) {
      entry = { total: 0, missed: 0, pending: 0 };
      by.set(i.ownerBdId, entry);
    }
    entry.total += 1;
    if (i.status === "missed") entry.missed += 1;
    else entry.pending += 1;
    if (i.kind === "meeting" && (!entry.nextMeeting || i.startISO < entry.nextMeeting.startISO)) {
      entry.nextMeeting = i;
    }
  }
  return Array.from(by.entries()).map(([bdId, stats]) => ({
    bd: findUser(bdId),
    ...stats,
  }));
}
