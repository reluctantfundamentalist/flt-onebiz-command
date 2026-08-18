"use client";
import Link from "next/link";
import { useMemo } from "react";
import type { TimelineItem, TimelineStatus, TimelineKind } from "@/lib/timeline";
import type { User } from "@/lib/users";

const DAY_MS = 24 * 60 * 60 * 1000;

interface Props {
  items: TimelineItem[];
  windowDays?: number;
  windowStartOffsetDays?: number;
  groupBy?: "account" | "bd";
  users?: User[];
  accountLabelById?: Record<string, string>;
  emptyLabel?: string;
}

const KIND_COLOR: Record<TimelineKind, string> = {
  next_step: "#0b66c2",
  meeting:   "#ea580c",
  contract:  "#6d4aff",
};

const STATUS_STYLE: Record<TimelineStatus, { bg: string; text: string }> = {
  pending:     { bg: "#dbeafe", text: "#0a4f96" },
  in_progress: { bg: "#dcfce7", text: "#166534" },
  done:        { bg: "#e5e7eb", text: "#374151" },
  missed:      { bg: "#fee2e2", text: "#991b1b" },
};

export default function GanttChart({
  items,
  windowDays = 60,
  windowStartOffsetDays = 14,
  groupBy = "account",
  users,
  accountLabelById,
  emptyLabel = "No open items.",
}: Props) {
  const { windowStart, windowEnd, today, groups } = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const ws = new Date(t.getTime() - windowStartOffsetDays * DAY_MS);
    const we = new Date(ws.getTime() + windowDays * DAY_MS);

    const grouped = new Map<string, TimelineItem[]>();
    for (const i of items) {
      const key = groupBy === "account" ? i.accountIata : i.ownerBdId;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(i);
    }
    return { windowStart: ws, windowEnd: we, today: t, groups: Array.from(grouped.entries()) };
  }, [items, windowDays, windowStartOffsetDays, groupBy]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-white p-4 text-sm text-[var(--ink-faint)]">
        {emptyLabel}
      </div>
    );
  }

  const totalMs = windowEnd.getTime() - windowStart.getTime();

  function pct(iso: string): number {
    return ((new Date(iso).getTime() - windowStart.getTime()) / totalMs) * 100;
  }
  function clip(v: number): number {
    return Math.max(0, Math.min(100, v));
  }

  const tickDays = [-14, -7, 0, 7, 14, 21, 30, 45];
  const ticks = tickDays.map((d) => {
    const t = today.getTime() + d * DAY_MS;
    return {
      offset: d,
      label:
        d === 0
          ? "Today"
          : `${d > 0 ? "+" : ""}${d}d`,
      date: new Date(t).toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
      pct: clip(((t - windowStart.getTime()) / totalMs) * 100),
    };
  });

  const todayPct = pct(today.toISOString());

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
      {/* Axis */}
      <div className="grid grid-cols-[140px_1fr] border-b border-[var(--line)] bg-[var(--bg)]">
        <div className="border-r border-[var(--line)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
          {groupBy === "bd" ? "BD" : "Account"}
        </div>
        <div className="relative h-9">
          {ticks.map((t) => (
            <div
              key={t.offset}
              className="absolute inset-y-0 flex flex-col items-center justify-center text-[10px]"
              style={{ left: `${t.pct}%`, transform: "translateX(-50%)" }}
            >
              <span className={`font-semibold ${t.offset === 0 ? "text-[var(--brand)]" : "text-[var(--ink-soft)]"}`}>
                {t.label}
              </span>
              <span className="text-[var(--ink-faint)]">{t.date}</span>
            </div>
          ))}
          {/* today line */}
          <div className="absolute inset-y-0 w-px bg-[var(--brand)]" style={{ left: `${todayPct}%` }} />
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[var(--line)]">
        {groups.map(([key, groupItems]) => (
          <div key={key} className="grid grid-cols-[140px_1fr] items-stretch hover:bg-[var(--bg)]">
            <div className="flex items-center border-r border-[var(--line)] px-3 py-2">
              <div className="truncate text-[12px] font-semibold text-[var(--ink)]">
                {groupBy === "bd"
                  ? users?.find((u) => u.id === key)?.name ?? key
                  : accountLabelById?.[key] ?? key}
              </div>
            </div>
            <RowLane
              items={groupItems}
              pct={pct}
              clip={clip}
              todayPct={todayPct}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-[10px]">
        <span className="font-semibold text-[var(--ink-faint)]">STATUS:</span>
        <LegendDot color={STATUS_STYLE.pending.bg} label="Pending" />
        <LegendDot color={STATUS_STYLE.in_progress.bg} label="In progress" />
        <LegendDot color={STATUS_STYLE.done.bg} label="Done" />
        <LegendDot color={STATUS_STYLE.missed.bg} label="Missed" />
        <span className="ml-auto font-semibold text-[var(--ink-faint)]">KIND:</span>
        <LegendOutline color={KIND_COLOR.next_step} label="Next step" />
        <LegendOutline color={KIND_COLOR.meeting} label="Meeting" />
        <LegendOutline color={KIND_COLOR.contract} label="Contract" />
      </div>
    </div>
  );
}

function RowLane({
  items,
  pct,
  clip,
  todayPct,
}: {
  items: TimelineItem[];
  pct: (iso: string) => number;
  clip: (v: number) => number;
  todayPct: number;
}) {
  // Stack items in rows within the same swim-lane so they don't overlap.
  const laneCount = items.length;
  const laneHeight = 28;
  const totalHeight = Math.max(1, laneCount) * laneHeight + 8;

  return (
    <div className="relative" style={{ height: totalHeight }}>
      {/* today line */}
      <div className="absolute inset-y-0 w-px bg-[var(--brand)] opacity-60" style={{ left: `${todayPct}%` }} />
      {items.map((it, idx) => {
        const left = clip(pct(it.startISO));
        const right = clip(pct(it.endISO));
        const width = Math.max(2, right - left);
        const outline = KIND_COLOR[it.kind];
        const status = STATUS_STYLE[it.status];
        if (right <= 0 || left >= 100) return null;
        const tip = [
          `[${it.accountIata}] ${it.label}`,
          `Kind: ${it.kind.replace("_", " ")} · Status: ${it.status.replace("_", " ")}`,
          it.bdName ? `BD: ${it.bdName}` : null,
          `${new Date(it.startISO).toLocaleDateString()} → ${new Date(it.endISO).toLocaleDateString()}`,
          it.dollarUsd ? `Value: $${(it.dollarUsd / 1_000_000).toFixed(2)}M` : null,
          it.priority ? `Priority: ${it.priority}` : null,
          it.attendees?.length ? `With: ${it.attendees.join(", ")}` : null,
          it.detail ? `— ${it.detail}` : null,
        ].filter(Boolean).join("\n");
        return (
          <Link
            key={it.id}
            href={`/leader/account/${it.accountIata}`}
            title={tip}
            className="absolute flex items-center rounded-md border-l-[3px] px-2 shadow-sm transition hover:brightness-95"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              top: idx * laneHeight + 4,
              height: laneHeight - 6,
              background: status.bg,
              borderColor: outline,
              color: status.text,
            }}
          >
            <span className="truncate text-[11px] font-medium">{it.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-[var(--ink-soft)]">{label}</span>
    </span>
  );
}

function LegendOutline({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-sm border-l-2 bg-white" style={{ borderColor: color }} />
      <span className="text-[var(--ink-soft)]">{label}</span>
    </span>
  );
}
