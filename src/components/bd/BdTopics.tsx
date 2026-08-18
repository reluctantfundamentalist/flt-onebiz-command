"use client";
import { useState } from "react";
import TopicBoard from "@/components/TopicBoard";
import type { UpdateRecord } from "@/lib/store";

export default function BdTopics({ updates }: { updates: UpdateRecord[] }) {
  const [active, setActive] = useState<Set<string>>(new Set());

  const accountTags = [...new Set(updates.map((u) => u.accountIata))].sort();
  const prioTags = ["high", "medium", "low"];

  function toggle(tag: string) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const filtered = updates.filter(
    (u) =>
      active.size === 0 ||
      active.has(u.accountIata) ||
      active.has(u.priority ?? "medium"),
  );

  const chip = (tag: string, label: string) => {
    const on = active.has(tag);
    return (
      <button
        key={tag}
        onClick={() => toggle(tag)}
        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
          on
            ? "border-[var(--brand)] bg-[var(--brand)] text-white"
            : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--brand)]"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
          Filter
        </span>
        {accountTags.map((t) => chip(t, t))}
        <span className="mx-1 h-4 w-px bg-[var(--line)]" />
        {prioTags.map((t) => chip(t, t[0].toUpperCase() + t.slice(1)))}
        {active.size > 0 && (
          <button
            onClick={() => setActive(new Set())}
            className="ml-1 text-[11px] text-[var(--brand)] underline"
          >
            clear
          </button>
        )}
      </div>
      <TopicBoard updates={filtered} />
    </div>
  );
}
