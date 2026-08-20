"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OpportunityRecord, OpportunityStatus } from "@/lib/store";
import type { SourceBucket, Signal } from "@/lib/signals";
import { THEME_BY_ID } from "@/lib/themes";
import { findAccount, findUser } from "@/lib/users";
import { dwellDays, isStale, STATUS_META, fmtUsd } from "@/lib/opportunity-view";

const STATUS_ORDER: OpportunityStatus[] = ["open", "stalled", "won", "lost"];

function ThemeChip({ id }: { id: string }) {
  const t = THEME_BY_ID[id];
  if (!t) return null;
  return (
    <span
      title={t.label}
      className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold ${
        t.minor
          ? "bg-[var(--bg)] text-[var(--ink-soft)] border border-[var(--line)]"
          : "bg-indigo-50 text-indigo-700"
      }`}
    >
      {t.num !== "·" ? `${t.num} ` : ""}{t.short}
    </span>
  );
}

function Card({
  rec,
  onStatus,
  onDismiss,
}: {
  rec: OpportunityRecord;
  onStatus: (id: string, status: OpportunityStatus) => void;
  onDismiss: (id: string) => void;
}) {
  const acct = findAccount(rec.accountIata);
  const owner = findUser(rec.ownerBdId);
  const meta = STATUS_META[rec.status];
  const dwell = dwellDays(rec);
  const stale = isStale(rec);
  const threat = rec.kind === "threat";
  const value = fmtUsd(rec.valueUsd);

  return (
    <div
      className={`rounded-xl border bg-white p-3 ${
        threat ? "border-red-200" : "border-[var(--line)]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
            threat
              ? "bg-red-50 text-red-700"
              : "bg-[var(--brand-soft)] text-[var(--brand-dark)]"
          }`}
        >
          {rec.accountIata}
        </span>
        <Link
          href={`/leader/account/${rec.accountIata}`}
          className="truncate text-[11px] text-[var(--ink-faint)] hover:text-[var(--brand)]"
        >
          {acct?.name ?? rec.accountIata}
        </Link>
        {value && (
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
            {value}
          </span>
        )}
        <button
          onClick={() => onDismiss(rec.id)}
          title="Dismiss"
          className="ml-auto rounded px-1 text-[13px] leading-none text-[var(--ink-faint)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
        >
          ×
        </button>
      </div>

      <div className="mt-1.5 text-[13px] font-semibold leading-snug text-[var(--ink)]">
        {rec.title}
      </div>
      {rec.detail && (
        <p className="mt-1 text-[11.5px] leading-snug text-[var(--ink-soft)]">{rec.detail}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {rec.themes.map((t) => <ThemeChip key={t} id={t} />)}
        {rec.themes.length === 0 && (
          <span className="rounded border border-dashed border-[var(--line)] px-1.5 py-0.5 text-[9.5px] text-[var(--ink-faint)]">
            untagged
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[var(--line)] pt-2">
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-bold"
          style={{ background: meta.bg, color: meta.text }}
        >
          {meta.label} · {dwell}d
        </span>
        {stale && (
          <span
            title={`In this stage for ${dwell} days — needs movement`}
            className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800"
          >
            ⚠ stale
          </span>
        )}
        <span
          title="Maturity confidence"
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
            rec.confidence === "high"
              ? "bg-[var(--ink)] text-white"
              : "border border-[var(--line)] bg-white text-[var(--ink-faint)]"
          }`}
        >
          {rec.confidence === "high" ? "HIGH" : "LOW"}
        </span>
        <span className="ml-auto text-[10px] text-[var(--ink-faint)]">
          {owner?.name.split(" ")[0] ?? rec.ownerBdId}
        </span>
        <select
          value={rec.status}
          onChange={(e) => onStatus(rec.id, e.target.value as OpportunityStatus)}
          className="rounded border border-[var(--line)] bg-white px-1 py-0.5 text-[10px] text-[var(--ink-soft)]"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </div>

      {rec.nextAction && (
        <div className="mt-1.5 text-[10.5px] text-[var(--ink-faint)]">
          Next: <span className="font-medium text-[var(--ink-soft)]">{rec.nextAction}</span>
        </div>
      )}
    </div>
  );
}

function SignalRow({ s, onPromote }: { s: Signal; onPromote: (s: Signal) => void }) {
  const trackable = s.iata && findAccount(s.iata);
  const hover = s.detail ? `${s.text} — ${s.detail}` : s.text;
  return (
    <li
      title={hover}
      className="flex items-start gap-2 rounded-md border border-[var(--line)] bg-white px-2 py-1.5"
    >
      {s.iata && (
        <span className="mt-0.5 shrink-0 rounded bg-[var(--brand-soft)] px-1 py-0.5 text-[9px] font-bold text-[var(--brand-dark)]">
          {s.iata}
        </span>
      )}
      <span className="min-w-0 flex-1 text-[11.5px] leading-snug text-[var(--ink-soft)]">
        <span className="font-semibold text-[var(--ink)]">{s.short ?? s.text}</span>
        {s.dollar !== undefined && fmtUsd(s.dollar) && (
          <span className="ml-1.5 rounded bg-emerald-50 px-1 py-0.5 text-[10px] font-bold text-emerald-800">
            {fmtUsd(s.dollar)}
          </span>
        )}
      </span>
      {trackable && (
        <button
          onClick={() => onPromote(s)}
          title="Promote to tracked item"
          className="shrink-0 rounded border border-[var(--line)] px-1.5 py-0.5 text-[9.5px] font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)]"
        >
          + Track
        </button>
      )}
    </li>
  );
}

export default function OpportunitiesTab({
  opportunities,
  board,
}: {
  opportunities: OpportunityRecord[];
  board: SourceBucket[];
}) {
  const router = useRouter();
  const [kindFilter, setKindFilter] = useState<"all" | "opportunity" | "threat">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OpportunityStatus>("all");
  const [busy, setBusy] = useState(false);

  const counts = {
    open: opportunities.filter((o) => o.status === "open").length,
    stalled: opportunities.filter((o) => o.status === "stalled").length,
    won: opportunities.filter((o) => o.status === "won").length,
    lost: opportunities.filter((o) => o.status === "lost").length,
    stale: opportunities.filter((o) => isStale(o)).length,
    threats: opportunities.filter((o) => o.kind === "threat" && o.status !== "lost").length,
  };

  const visible = opportunities.filter((o) => {
    if (kindFilter !== "all" && o.kind !== kindFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  async function post(body: unknown) {
    setBusy(true);
    try {
      await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function onStatus(id: string, status: OpportunityStatus) {
    post({ action: "status", id, status });
  }
  function onDismiss(id: string) {
    post({ action: "dismiss", id });
  }
  function onPromote(s: Signal) {
    post({
      action: "promote",
      accountIata: s.iata,
      title: s.text,
      detail: s.detail,
      kind: s.kind === "threat" ? "threat" : "opportunity",
      source: s.source,
      valueUsd: s.dollar ?? null,
    });
  }

  const chip = (active: boolean) =>
    `rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
      active
        ? "bg-[var(--ink)] text-white"
        : "border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--brand)]"
    }`;

  return (
    <div className={busy ? "opacity-60 pointer-events-none" : ""}>
      {/* Summary strip */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-md bg-[var(--brand-soft)] px-2.5 py-1 font-semibold text-[var(--brand-dark)]">
          {counts.open} open
        </span>
        <span className="rounded-md bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">
          {counts.stalled} stalled
        </span>
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
          {counts.won} won
        </span>
        <span className="rounded-md bg-[var(--bg)] px-2.5 py-1 font-semibold text-[var(--ink-faint)]">
          {counts.lost} lost
        </span>
        {counts.stale > 0 && (
          <span className="rounded-md bg-amber-100 px-2.5 py-1 font-bold text-amber-900">
            ⚠ {counts.stale} stale (&gt;14d in stage)
          </span>
        )}
        <span className="rounded-md bg-red-50 px-2.5 py-1 font-semibold text-red-700">
          {counts.threats} live threats
        </span>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <button className={chip(kindFilter === "all")} onClick={() => setKindFilter("all")}>All</button>
        <button className={chip(kindFilter === "opportunity")} onClick={() => setKindFilter("opportunity")}>
          Opportunities
        </button>
        <button className={chip(kindFilter === "threat")} onClick={() => setKindFilter("threat")}>
          Threats
        </button>
        <span className="mx-1 h-4 w-px bg-[var(--line)]" />
        <button className={chip(statusFilter === "all")} onClick={() => setStatusFilter("all")}>
          Any stage
        </button>
        {STATUS_ORDER.map((s) => (
          <button key={s} className={chip(statusFilter === s)} onClick={() => setStatusFilter(s)}>
            {STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Board */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-white p-6 text-sm text-[var(--ink-faint)]">
          Nothing matches this filter.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((rec) => (
            <Card key={rec.id} rec={rec} onStatus={onStatus} onDismiss={onDismiss} />
          ))}
        </div>
      )}

      {/* Signal radar: untracked signals from the three sources */}
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-[12px] font-semibold text-[var(--ink)]">Signal radar</h3>
          <span className="text-[10.5px] text-[var(--ink-faint)]">
            three sources · + Track promotes a signal onto the board with auto-suggested theme tags
          </span>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {board.map((b) => (
            <div key={b.key} className="rounded-xl border border-[var(--line)] bg-white p-3">
              <div className="mb-2 text-[12px] font-semibold text-[var(--ink)]">{b.label}</div>
              <div className="flex gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--good,#16a34a)]">
                    Opportunities · {b.opportunities.length}
                  </div>
                  {b.opportunities.length === 0 ? (
                    <div className="text-[10.5px] text-[var(--ink-faint)]">Nothing flagged.</div>
                  ) : (
                    <ul className="space-y-1.5">
                      {b.opportunities.slice(0, 4).map((s, i) => (
                        <SignalRow key={i} s={s} onPromote={onPromote} />
                      ))}
                    </ul>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--bad,#dc2626)]">
                    Threats · {b.threats.length}
                  </div>
                  {b.threats.length === 0 ? (
                    <div className="text-[10.5px] text-[var(--ink-faint)]">Nothing flagged.</div>
                  ) : (
                    <ul className="space-y-1.5">
                      {b.threats.slice(0, 4).map((s, i) => (
                        <SignalRow key={i} s={s} onPromote={onPromote} />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
