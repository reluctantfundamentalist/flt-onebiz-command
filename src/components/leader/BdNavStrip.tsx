"use client";
import Link from "next/link";
import type { User } from "@/lib/users";

interface BdSummary {
  bd: User | undefined;
  total: number;
  missed: number;
  pending: number;
}

export default function BdNavStrip({ summary }: { summary: BdSummary[] }) {
  if (summary.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-white p-4 text-sm text-[var(--ink-faint)]">
        No pending items across BDs.
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {summary.map((s) => {
        if (!s.bd) return null;
        const initials = s.bd.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
        return (
          <Link
            key={s.bd.id}
            href={`/leader/bd/${s.bd.id}`}
            className="group rounded-xl border border-[var(--line)] bg-white p-4 transition hover:border-[var(--brand)] hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-semibold text-white">
                {initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--ink)]">{s.bd.name}</div>
                <div className="text-[11px] text-[var(--ink-faint)]">{s.bd.title}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-md bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-dark)]">
                {s.pending} pending
              </span>
              {s.missed > 0 && (
                <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                  {s.missed} missed
                </span>
              )}
              <span className="ml-auto text-[11px] font-medium text-[var(--ink-faint)] group-hover:text-[var(--brand)]">
                open board →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
