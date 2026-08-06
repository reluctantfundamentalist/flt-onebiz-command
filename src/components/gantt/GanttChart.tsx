"use client";
import Link from "next/link";
import { useMemo } from "react";
import type { TimelineItem, TimelineStatus, TimelineKind } from "@/lib/timeline";
import type { User } from "@/lib/users";

const DAY_MS = 24 * 60 * 60 * 1000;

interface Props {
  items: TimelineItem[];
  windowDays?: number;         // total window width in days
  windowStartOffsetDays?: number; // how many days before today
  groupBy?: "account" | "bd";
  users?: User[];
  accountLabelById?: Record<string, string>;
  emptyLabel?: string;
}

const KIND_COLOR: Record<TimelineKind, string> = {
  next_step: "#0b66c2",
  meeting:   "#ff6a3d",
  contract:  "#6d4aff",
};

const STATUS_COLOR: Record<TimelineStatus, string> = {
  pending:     "#0b66c2",
  in_progress: "#1f9d55",
  done:        "#94a3b8",
  missed:      "#dc2626",
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
    return {
      windowStart: ws,
      windowEnd: we,
      today: t,
      groups: Array.from(grouped.entries()),
    };
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
    const d = new Date(iso).getTime();
    return ((d - windowStart.getTime()) / totalMs) * 100;
  }

  function clip(value: number): number {
    return Math.max(0, Math.min(100, value));
  }

  const tickDays = [-14, -7, 0, 7, 14, 21, 30, 45];
  const ticks = tickDays.map((d) => ({
    label: d === 0 ? "today" : `${d > 0 ? "+" : ""}${d}d`,
    pct: clip(((today.getTime() + d * DAY_MS - windowStart.getTime()) / totalMs) * 100),
  }));

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-3">
      {/* Axis */}
      <div className="relative mb-2 h-5 border-b border-[var(--line)]">
        {ticks.map((t) => (
          <div
            key={t.label}
            className="absolute -top-0.5 text-[10px] font-medium text-[var(--ink-faint)]"
            style={{ left: `${t.pct}%`, transform: "translateX(-50%)" }}
          >
            {t.label}
          </div>
        ))}
        <div
          className="absolute inset-y-0 w-px bg-[var(--brand)]"
          style={{ left: `${pct(today.toISOString())}%` }}
        />
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {groups.map(([key, groupItems]) => (
          <div key={key} className="grid grid-cols-[100px_1fr] items-center gap-2">
            <div className="truncate text-[11px] font-semibold text-[var(--ink)]">
              {groupBy === "bd" ? (users?.find((u) => u.id === key)?.name ?? key) : (accountLabelById?.[key] ?? key)}
            </div>
            <div className="relative h-7">
              {/* today line */}
              <div
                className="absolute inset-y-0 w-px bg-[var(--brand-soft)]"
                style={{ left: `${pct(today.toISOString())}%` }}
              />
              {groupItems.map((it) => {
                const left = clip(pct(it.startISO));
                const right = clip(pct(it.endISO));
                const width = Math.max(1, right - left);
                const barColor = STATUS_COLOR[it.status];
                const outlineColor = KIND_COLOR[it.kind];
                const inside = right > 0 && left < 100;
                if (!inside) return null;
                return (
                  <ItemBar
                    key={it.id}
                    item={it}
                    left={left}
                    width={width}
                    barColor={barColor}
                    outlineColor={outlineColor}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-2 text-[10px]">
        <LegendDot color={STATUS_COLOR.pending} label="Pending" />
        <LegendDot color={STATUS_COLOR.in_progress} label="In progress" />
        <LegendDot color={STATUS_COLOR.done} label="Done" />
        <LegendDot color={STATUS_COLOR.missed} label="Missed" />
        <div className="ml-auto flex gap-2">
          <LegendOutline color={KIND_COLOR.next_step} label="Next step" />
          <LegendOutline color={KIND_COLOR.meeting} label="Meeting" />
          <LegendOutline color={KIND_COLOR.contract} label="Contract" />
        </div>
      </div>
    </div>
  );
}

function ItemBar({
  item,
  left,
  width,
  barColor,
  outlineColor,
}: {
  item: TimelineItem;
  left: number;
  width: number;
  barColor: string;
  outlineColor: string;
}) {
  const target = `/leader/account/${item.accountIata}`;
  const title = `[${item.accountIata}] ${item.label} — ${item.status}`;
  return (
    <Link
      href={target}
      title={title}
      className="absolute top-1 h-5 rounded-sm border-l-2 hover:opacity-80"
      style={{
        left: `${left}%`,
        width: `${width}%`,
        background: barColor,
        borderColor: outlineColor,
        opacity: item.status === "done" ? 0.6 : 0.9,
      }}
    >
      <span className="ml-1 truncate text-[10px] font-medium text-white block">
        {item.label}
      </span>
    </Link>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-[var(--ink-soft)]">{label}</span>
    </span>
  );
}

function LegendOutline({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-sm border-l-2" style={{ borderColor: color, background: "transparent" }} />
      <span className="text-[var(--ink-soft)]">{label}</span>
    </span>
  );
}
