// Intel bucketing: every captured item (email thread, market intel, calendar,
// meeting, manual input) gets theme-tagged with the PJ taxonomy and a
// priority, then grouped into buckets. One item lives in one primary bucket —
// its first matched theme — with the rest of its tags shown as chips.

import { suggestThemes, THEMES } from "./themes";
import { isNoise } from "./signals";
import type { UpdateRecord, MeetingRecord } from "./store";
import type { MarketIntel } from "./signals";

export type SourceKind = "email" | "calendar" | "intel" | "manual";

export const SOURCE_META: Record<SourceKind, { label: string; short: string }> = {
  email:    { label: "BD email thread", short: "✉ email" },
  calendar: { label: "Calendar / meeting", short: "▦ calendar" },
  intel:    { label: "Market intel", short: "◎ intel" },
  manual:   { label: "Manual input", short: "✍ manual" },
};

export type BucketPriority = "high" | "medium" | "low";

export interface BucketItem {
  id: string;
  headline: string;
  detail?: string;
  themes: string[];          // first = primary bucket
  priority: BucketPriority;
  status?: string;           // active / in_progress / dormant / closed for topics
  dollar?: number;
  source: SourceKind;
  iata: string;
  createdAt: string;
  nextStep?: string;
  kind?: "opportunity" | "threat" | "info";
}

function sourceKind(u: UpdateRecord): SourceKind {
  const by = u.createdBy ?? "";
  if (u.source === "outlook_clustered" || by.startsWith("graph_pull")) return "email";
  if (u.source === "calendar") return "calendar";
  if (by === "manual" || !u.source) return "manual";
  return "manual";
}

export function updatesToItems(updates: UpdateRecord[]): BucketItem[] {
  const items: BucketItem[] = [];
  for (const u of updates) {
    if (isNoise(u.headline)) continue;
    const themes = suggestThemes(`${u.headline} ${u.detail ?? ""}`);
    items.push({
      id: u.id,
      headline: u.headline,
      detail: u.detail,
      themes,
      priority: (u.priority as BucketPriority) ?? "medium",
      status: u.status,
      dollar: u.dollarImpact?.amountUsd,
      source: sourceKind(u),
      iata: u.accountIata,
      createdAt: u.createdAt,
      nextStep: u.nextStep ?? undefined,
      kind: "info",
    });
  }
  return items;
}

export function intelToItems(intel: MarketIntel[]): BucketItem[] {
  return intel.map((m, i) => ({
    id: `intel_${i}`,
    headline: m.headline,
    themes: suggestThemes(m.headline),
    priority: "medium" as BucketPriority,
    source: "intel" as SourceKind,
    iata: m.iata,
    createdAt: "",
    kind: m.kind,
  }));
}

// Meetings become calendar-sourced items. Past meetings with an outcome are
// closed — their value is the insight, not open work.
export function meetingsToItems(meetings: MeetingRecord[]): BucketItem[] {
  const now = Date.now();
  return meetings.map((m) => {
    const past = new Date(m.when).getTime() < now;
    const done = past && !!m.outcome;
    return {
      id: `mtg_${m.id}`,
      headline: m.agenda,
      detail: m.attendees?.length ? `With: ${m.attendees.join(", ")}` : undefined,
      themes: suggestThemes(m.agenda),
      priority: "medium" as BucketPriority,
      status: done ? "closed" : past ? "closed" : "active",
      source: "calendar" as SourceKind,
      iata: m.accountIata,
      createdAt: m.when,
      kind: "info" as const,
    };
  });
}

export interface ThemeBucket {
  themeId: string | null;    // null = unclassified
  label: string;
  items: BucketItem[];
}

const PRIO_WEIGHT: Record<BucketPriority, number> = { high: 0, medium: 1, low: 2 };

export function bucketByTheme(items: BucketItem[]): ThemeBucket[] {
  const byTheme = new Map<string, BucketItem[]>();
  const unclassified: BucketItem[] = [];
  for (const it of items) {
    const primary = it.themes[0];
    if (!primary) {
      unclassified.push(it);
      continue;
    }
    if (!byTheme.has(primary)) byTheme.set(primary, []);
    byTheme.get(primary)!.push(it);
  }
  const sortItems = (list: BucketItem[]) =>
    list.sort(
      (a, b) =>
        PRIO_WEIGHT[a.priority] - PRIO_WEIGHT[b.priority] ||
        (b.dollar ?? 0) - (a.dollar ?? 0),
    );
  const buckets: ThemeBucket[] = THEMES.filter((t) => byTheme.has(t.id)).map((t) => ({
    themeId: t.id,
    label: t.label,
    items: sortItems(byTheme.get(t.id)!),
  }));
  buckets.sort((a, b) => b.items.length - a.items.length);
  if (unclassified.length) {
    buckets.push({ themeId: null, label: "Unclassified", items: sortItems(unclassified) });
  }
  return buckets;
}

// Priority × theme matrix: counts for the leader glance.
export function priorityMatrix(items: BucketItem[]) {
  const themes = THEMES.filter((t) => items.some((i) => i.themes.includes(t.id)));
  const rows: { priority: BucketPriority; cells: { themeId: string; count: number }[]; total: number }[] = [];
  (["high", "medium", "low"] as BucketPriority[]).forEach((p) => {
    const cells = themes.map((t) => ({
      themeId: t.id,
      count: items.filter((i) => i.priority === p && i.themes.includes(t.id)).length,
    }));
    rows.push({ priority: p, cells, total: items.filter((i) => i.priority === p).length });
  });
  return { themes, rows };
}
