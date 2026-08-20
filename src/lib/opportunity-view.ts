// Client-safe view helpers for the opportunity board. store.ts imports
// node:fs, so date math and display metadata live here instead.

import type { OpportunityRecord, OpportunityStatus } from "@/lib/store";

export const STALE_AFTER_DAYS = 14;

export function dwellDays(rec: OpportunityRecord, now = new Date()): number {
  const ms = now.getTime() - new Date(rec.statusChangedAt).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

export function isStale(rec: OpportunityRecord, now = new Date()): boolean {
  if (rec.status === "won" || rec.status === "lost") return false;
  return dwellDays(rec, now) > STALE_AFTER_DAYS;
}

// Past due: the dated event behind this item (campaign, go-live, review)
// has passed and the item is still open — it should be closed.
export function isPastDue(rec: OpportunityRecord, now = new Date()): boolean {
  if (!rec.dueDate) return false;
  if (rec.status === "won" || rec.status === "lost") return false;
  return new Date(rec.dueDate).getTime() < now.getTime();
}

export const STATUS_META: Record<
  OpportunityStatus,
  { label: string; bg: string; text: string }
> = {
  open:    { label: "Open",    bg: "#dbeafe", text: "#0a4f96" },
  won:     { label: "Won",     bg: "#dcfce7", text: "#166534" },
  lost:    { label: "Lost",    bg: "#e5e7eb", text: "#374151" },
  stalled: { label: "Stalled", bg: "#fef3c7", text: "#92400e" },
};

export function fmtUsd(n: number | undefined | null) {
  if (n === undefined || n === null) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}
