"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OpportunityRecord, OpportunityStatus, OpportunityPriority } from "@/lib/store";
import { THEME_BY_ID } from "@/lib/themes";
import { findAccount, findUser } from "@/lib/users";
import { dwellDays, isStale, STATUS_META, fmtUsd } from "@/lib/opportunity-view";

const STATUS_ORDER: OpportunityStatus[] = ["open", "stalled", "won", "lost"];
const PRIO_META: Record<OpportunityPriority, { label: string; bg: string; text: string; next: OpportunityPriority }> = {
  high:   { label: "P1", bg: "#fee2e2", text: "#991b1b", next: "low" },
  medium: { label: "P2", bg: "#fef3c7", text: "#92400e", next: "high" },
  low:    { label: "P3", bg: "#f3f4f6", text: "#6b7280", next: "medium" },
};
const PRIO_WEIGHT: Record<OpportunityPriority, number> = { high: 0, medium: 1, low: 2 };

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

function ActionBtn({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "good" | "warn" | "bad" | "neutral";
  onClick: () => void;
}) {
  const cls = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    warn: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    bad: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    neutral: "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:bg-[var(--bg)]",
  }[tone];
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2 py-1 text-[10.5px] font-semibold transition ${cls}`}
    >
      {label}
    </button>
  );
}

function Card({
  rec,
  hasContract,
  onStatus,
  onPriority,
  onDismiss,
  onLinkContract,
}: {
  rec: OpportunityRecord;
  hasContract: boolean;
  onStatus: (id: string, status: OpportunityStatus) => void;
  onPriority: (id: string, priority: OpportunityPriority) => void;
  onDismiss: (id: string) => void;
  onLinkContract: (id: string, link: boolean) => void;
}) {
  const acct = findAccount(rec.accountIata);
  const owner = findUser(rec.ownerBdId);
  const meta = STATUS_META[rec.status];
  const dwell = dwellDays(rec);
  const stale = isStale(rec);
  const threat = rec.kind === "threat";
  const value = fmtUsd(rec.valueUsd);
  const prio = PRIO_META[rec.priority ?? "medium"];

  return (
    <div
      className={`rounded-xl border bg-white p-3 ${
        threat ? "border-red-200" : "border-[var(--line)]"
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Priority: click to cycle P3 → P2 → P1 */}
        <button
          onClick={() => onPriority(rec.id, prio.next)}
          title="Priority — click to change"
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
          style={{ background: prio.bg, color: prio.text }}
        >
          {prio.label}
        </button>
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
          title={`${acct?.name ?? ""} · BD: ${owner?.name ?? ""}`}
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

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {rec.themes.map((t) => <ThemeChip key={t} id={t} />)}
        {rec.sourceUpdateId && (
          <span
            title="Linked to the email thread it came from"
            className="rounded border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[9.5px] font-semibold text-orange-700"
          >
            ⟵ thread
          </span>
        )}
        {hasContract && (
          rec.contractIata ? (
            <button
              onClick={() => onLinkContract(rec.id, false)}
              title="Linked to this account's contract — click to unlink"
              className="rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[9.5px] font-semibold text-violet-700 hover:bg-violet-100"
            >
              ⇢ contract ✓
            </button>
          ) : (
            <button
              onClick={() => onLinkContract(rec.id, true)}
              title="Link to this account's contract"
              className="rounded border border-dashed border-violet-300 px-1.5 py-0.5 text-[9.5px] font-semibold text-violet-600 hover:bg-violet-50"
            >
              ⇢ link contract
            </button>
          )
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
          title={`Maturity confidence: ${rec.confidence}`}
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
            rec.confidence === "high"
              ? "bg-[var(--ink)] text-white"
              : "border border-[var(--line)] bg-white text-[var(--ink-faint)]"
          }`}
        >
          {rec.confidence === "high" ? "HIGH" : "LOW"}
        </span>

        {/* Status actions: close / reopen / move */}
        <span className="ml-auto flex items-center gap-1">
          {rec.status === "open" && (
            <>
              <ActionBtn label="Won ✓" tone="good" onClick={() => onStatus(rec.id, "won")} />
              <ActionBtn label="Stall" tone="warn" onClick={() => onStatus(rec.id, "stalled")} />
              <ActionBtn label="Lost" tone="bad" onClick={() => onStatus(rec.id, "lost")} />
            </>
          )}
          {rec.status === "stalled" && (
            <>
              <ActionBtn label="Reopen" tone="neutral" onClick={() => onStatus(rec.id, "open")} />
              <ActionBtn label="Lost" tone="bad" onClick={() => onStatus(rec.id, "lost")} />
            </>
          )}
          {(rec.status === "won" || rec.status === "lost") && (
            <ActionBtn label="Reopen" tone="neutral" onClick={() => onStatus(rec.id, "open")} />
          )}
        </span>
      </div>

      {rec.nextAction && (
        <div className="mt-1.5 text-[10.5px] text-[var(--ink-faint)]">
          Next: <span className="font-medium text-[var(--ink-soft)]">{rec.nextAction}</span>
        </div>
      )}
    </div>
  );
}

export default function OpportunitiesTab({
  opportunities,
  contractIatas = [],
}: {
  opportunities: OpportunityRecord[];
  contractIatas?: string[];
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

  const visible = opportunities
    .filter((o) => {
      if (kindFilter !== "all" && o.kind !== kindFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const p = PRIO_WEIGHT[a.priority ?? "medium"] - PRIO_WEIGHT[b.priority ?? "medium"];
      if (p !== 0) return p; // P1 first
      const sa = isStale(a) ? 0 : 1;
      const sb = isStale(b) ? 0 : 1;
      if (sa !== sb) return sa - sb; // stale floats up
      return dwellDays(b) - dwellDays(a);
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
  function onPriority(id: string, priority: OpportunityPriority) {
    post({ action: "priority", id, priority });
  }
  function onDismiss(id: string) {
    post({ action: "dismiss", id });
  }
  function onLinkContract(id: string, link: boolean) {
    const rec = opportunities.find((o) => o.id === id);
    post({ action: "link", id, contractIata: link && rec ? rec.accountIata : null });
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
            <Card
              key={rec.id}
              rec={rec}
              hasContract={contractIatas.includes(rec.accountIata)}
              onStatus={onStatus}
              onPriority={onPriority}
              onDismiss={onDismiss}
              onLinkContract={onLinkContract}
            />
          ))}
        </div>
      )}
    </div>
  );
}
