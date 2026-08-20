"use client";
import { findUser } from "@/lib/users";

export interface Stakeholder {
  iata: string;
  name: string;
  title: string;
  weight: number;        // 0–100 synthesized influence score
  threads: number;
  primaryBd: string;
  traits: string[];
  movers: string;
  style: string;
  approach: string;
}

function weightTone(w: number) {
  if (w >= 70) return { bar: "#16a34a", label: "High influence" };
  if (w >= 50) return { bar: "#0b66c2", label: "Working influence" };
  return { bar: "#9ca3af", label: "Low influence" };
}

export default function StakeholderPanel({ stakeholders }: { stakeholders: Stakeholder[] }) {
  if (stakeholders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-6 text-center text-sm text-[var(--ink-faint)]">
        No stakeholder intelligence captured for this airline yet. Coverage builds from email
        threads, meetings, and BD input.
      </div>
    );
  }

  const sorted = [...stakeholders].sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-3">
      <p className="text-[10.5px] text-[var(--ink-faint)]">
        Influence score synthesized from engagement volume, writing authority, and observed
        decision weight — ranked by value to the conversation, not by title.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        {sorted.map((s) => {
          const tone = weightTone(s.weight);
          const bd = findUser(s.primaryBd);
          return (
            <div key={s.name} className="rounded-xl border border-[var(--line)] bg-white p-3.5">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{s.name}</div>
                  <div className="truncate text-[11px] text-[var(--ink-faint)]">{s.title}</div>
                </div>
                <div className="w-24 shrink-0">
                  <div className="mb-0.5 flex items-baseline justify-between">
                    <span className="text-[13px] font-bold" style={{ color: tone.bar }}>{s.weight}</span>
                    <span className="text-[9px] text-[var(--ink-faint)]">{s.threads} threads</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded bg-[var(--bg)]">
                    <div className="h-full rounded" style={{ width: `${s.weight}%`, background: tone.bar }} />
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[9.5px] font-semibold text-[var(--ink-soft)]">
                  {tone.label}
                </span>
                {s.traits.map((t) => (
                  <span key={t} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9.5px] font-semibold text-indigo-700">
                    {t}
                  </span>
                ))}
                <span className="ml-auto rounded bg-[var(--brand-soft)] px-1.5 py-0.5 text-[9.5px] font-semibold text-[var(--brand-dark)]">
                  BD: {bd?.name.split(" ")[0] ?? s.primaryBd}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-[11px] leading-snug">
                <p className="text-[var(--ink-soft)]">
                  <span className="font-semibold text-[var(--ink)]">Moves on: </span>{s.movers}
                </p>
                <p className="text-[var(--ink-faint)]">
                  <span className="font-semibold text-[var(--ink-soft)]">Style: </span>{s.style}
                </p>
                <p className="text-[var(--brand-dark)]">
                  <span className="font-semibold">Play: </span>{s.approach}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
