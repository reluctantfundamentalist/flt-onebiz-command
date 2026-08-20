"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccountMapClient from "./AccountMapClient";
import { buildScopedSignals, isMegaSignal, type MarketIntel, type Signal } from "@/lib/signals";
import type { Account } from "@/lib/users";
import { findAccount, findUser, layersFor, ACCOUNTS, USERS } from "@/lib/users";
import type { AccountMetrics, UpdateRecord, MeetingRecord, OpportunityRecord, OpportunityStatus } from "@/lib/store";
import { STATUS_META } from "@/lib/opportunity-view";

function fmtUsd(n: number | undefined) {
  if (n === undefined || !n) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const KIND_DOT: Record<Signal["kind"], string> = {
  opportunity: "var(--good, #16a34a)",
  threat: "var(--bad, #dc2626)",
  info: "var(--brand, #0b66c2)",
};

function accountsForBd(bd: string): Account[] {
  return ACCOUNTS.filter(
    (a) => a.ownerId === bd || layersFor(a).some((l) => l.ownerId === bd),
  );
}

function MegaRow({
  s,
  linkedOpp,
  justTracked,
  sourceNextStep,
  expanded,
  busy,
  onToggle,
  onPromote,
  onStatus,
}: {
  s: Signal;
  linkedOpp: OpportunityRecord | undefined;
  justTracked: boolean;
  sourceNextStep?: string;
  expanded: boolean;
  busy: boolean;
  onToggle: () => void;
  onPromote: (s: Signal) => void;
  onStatus: (id: string, status: "open" | "won" | "lost" | "stalled") => void;
}) {
  const hover = s.detail ? `${s.text} — ${s.detail}` : s.text;
  const tracked = !!linkedOpp || justTracked;
  const meta = linkedOpp ? STATUS_META[linkedOpp.status] : null;

  return (
    <li className={`rounded-md border bg-white ${tracked ? "border-[var(--brand)]/40" : "border-[var(--line)]"}`}>
      <div className={`flex items-start gap-2 px-2.5 py-2 ${busy ? "opacity-60 pointer-events-none" : ""}`}>
        <div className="flex min-w-0 flex-1 cursor-pointer items-start gap-2" onClick={onToggle} title={hover}>
          <span
            className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: KIND_DOT[s.kind] }}
          />
          {s.iata && (
            <span className="mt-0.5 shrink-0 rounded bg-[var(--brand-soft)] px-1 py-0.5 text-[9px] font-bold text-[var(--brand-dark)]">
              {s.iata}
            </span>
          )}
          <span className="min-w-0 flex-1 text-[12px] leading-snug text-[var(--ink-soft)]">
            <span className="font-semibold text-[var(--ink)]">{s.text}</span>
            {s.dollar !== undefined && s.dollar >= 100_000 && (
              <span className="ml-1.5 rounded bg-emerald-50 px-1 py-0.5 text-[10px] font-bold text-emerald-800">
                {fmtUsd(s.dollar)}
              </span>
            )}
            <span className="ml-1.5 text-[10px] text-[var(--ink-faint)]">{s.source}</span>
          </span>
          {meta && (
            <span
              className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold"
              style={{ background: meta.bg, color: meta.text }}
            >
              {meta.label}
            </span>
          )}
          <span className="mt-0.5 shrink-0 text-[10px] text-[var(--ink-faint)]">{expanded ? "▲" : "▼"}</span>
        </div>

        {!tracked && s.iata && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPromote(s);
            }}
            title="Track as an opportunity — keeps the thread link"
            className="shrink-0 rounded border border-[var(--line)] px-1.5 py-0.5 text-[9.5px] font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)]"
          >
            + Track
          </button>
        )}
        {justTracked && !linkedOpp && (
          <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-800">
            on board ✓
          </span>
        )}
        {!tracked && !s.iata && (
          <span className="shrink-0 rounded bg-[var(--bg)] px-1.5 py-0.5 text-[9.5px] font-semibold text-[var(--ink-faint)]">
            no account
          </span>
        )}
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-[var(--line)] px-3 py-2">
          {s.detail && <p className="text-[11.5px] leading-snug text-[var(--ink-soft)]">{s.detail}</p>}

          {sourceNextStep && (
            <div className="rounded bg-[var(--brand-soft)] px-2 py-1.5 text-[11px] text-[var(--brand-dark)]">
              <span className="font-semibold">BD action item: </span>{sourceNextStep}
            </div>
          )}

          {linkedOpp ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10.5px] font-semibold text-[var(--ink-soft)]">
                On the board{linkedOpp.valueUsd ? ` · ${fmtUsd(linkedOpp.valueUsd)}` : ""}
              </span>
              {linkedOpp.nextAction && (
                <span className="text-[10.5px] text-[var(--ink-faint)]">
                  · next: {linkedOpp.nextAction}
                </span>
              )}
              <span className="ml-auto flex gap-1">
                {linkedOpp.status === "open" && (
                  <>
                    <MiniBtn tone="good" onClick={() => onStatus(linkedOpp.id, "won")}>Won ✓</MiniBtn>
                    <MiniBtn tone="warn" onClick={() => onStatus(linkedOpp.id, "stalled")}>Stall</MiniBtn>
                    <MiniBtn tone="bad" onClick={() => onStatus(linkedOpp.id, "lost")}>Lost</MiniBtn>
                  </>
                )}
                {(linkedOpp.status === "won" || linkedOpp.status === "lost" || linkedOpp.status === "stalled") && (
                  <MiniBtn tone="neutral" onClick={() => onStatus(linkedOpp.id, "open")}>Reopen</MiniBtn>
                )}
              </span>
            </div>
          ) : justTracked ? (
            <div className="rounded bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-800">
              On the board ✓ — open Workspace to manage it
            </div>
          ) : (
            s.iata && (
              <Link
                href={`/leader/account/${s.iata}?tab=intel`}
                className="inline-block text-[10.5px] font-semibold text-[var(--brand)] hover:underline"
              >
                Open {s.iata} intel →
              </Link>
            )
          )}
        </div>
      )}
    </li>
  );
}

function MiniBtn({
  tone,
  onClick,
  children,
}: {
  tone: "good" | "warn" | "bad" | "neutral";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const cls = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    warn: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
    bad: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    neutral: "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:bg-[var(--bg)]",
  }[tone];
  return (
    <button onClick={onClick} className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {children}
    </button>
  );
}

function SummaryStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
      <div className="text-[15px] font-semibold text-[var(--ink)]">{value}</div>
      {sub && <div className="text-[11px] text-[var(--ink-soft)]">{sub}</div>}
    </div>
  );
}

export default function HomeWorkspace({
  metrics,
  updates,
  intel,
  meetings,
  opportunities,
}: {
  metrics: Record<string, AccountMetrics>;
  updates: UpdateRecord[];
  intel: MarketIntel[];
  meetings: MeetingRecord[];
  opportunities: OpportunityRecord[];
}) {
  const router = useRouter();
  const [promoting, setPromoting] = useState(false);
  const [trackedNow, setTrackedNow] = useState<Set<string>>(new Set());
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [selectedIata, setSelectedIata] = useState("");
  const [selectedBd, setSelectedBd] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [timeTab, setTimeTab] = useState<"coming" | "happening" | "happened">("coming");
  const [expanded, setExpanded] = useState(false);

  // A new selection or tab starts collapsed again.
  useEffect(() => {
    setExpanded(false);
  }, [timeTab, selectedIata, selectedBd, selectedRegion]);

  // Resolve the selection into a carrier scope.
  const { scopeAccounts, label, bdUser } = useMemo(() => {
    if (selectedIata) {
      const acc = findAccount(selectedIata);
      return {
        scopeAccounts: acc ? [acc] : [],
        label: acc ? `${acc.iata} · ${acc.name}` : selectedIata,
        bdUser: acc ? findUser(acc.ownerId) : undefined,
      };
    }
    if (selectedBd) {
      const all = accountsForBd(selectedBd);
      const scoped = selectedRegion
        ? all.filter((a) => a.region === selectedRegion)
        : all;
      const u = findUser(selectedBd);
      return {
        scopeAccounts: scoped,
        label: selectedRegion
          ? `${u?.name ?? selectedBd} · ${selectedRegion}`
          : u?.name ?? selectedBd,
        bdUser: u,
      };
    }
    return { scopeAccounts: ACCOUNTS, label: "Full portfolio", bdUser: undefined };
  }, [selectedIata, selectedBd, selectedRegion]);

  const iatas = scopeAccounts.map((a) => a.iata);

  // Uber metrics across the scope.
  const uber = useMemo(() => {
    let rev = 0, revLy = 0, pax = 0, covered = 0;
    for (const iata of iatas) {
      const m = metrics[iata];
      if (!m) continue;
      covered += 1;
      rev += m.ytdFlownRevUsd;
      revLy += m.ytdFlownRevLyUsd ?? 0;
      pax += m.ondPax ?? 0;
    }
    const yoy = revLy ? ((rev - revLy) / revLy) * 100 : undefined;
    return { rev, yoy, pax, covered };
  }, [iatas.join(","), metrics]);

  // Mega-only signals for the scope, bucketed by time.
  const groups = useMemo(() => {
    const g = buildScopedSignals(iatas, metrics, updates, intel, meetings);
    const mega = (list: Signal[]) =>
      list.filter(isMegaSignal).sort((a, b) => {
        const ia = a.source === "market intel" ? 1 : 0;
        const ib = b.source === "market intel" ? 1 : 0;
        if (ia !== ib) return ib - ia; // curated outlook first in the feed
        return (b.dollar ?? 0) - (a.dollar ?? 0);
      });
    return {
      coming: mega(g.coming),
      happening: mega(g.happening),
      happened: mega(g.happened),
    };
  }, [iatas.join(","), metrics, updates, intel, meetings]);

  async function onPromote(s: Signal) {
    setPromoting(true);
    setTrackError(null);
    // Instant confirmation; rolled back with a visible error if the POST fails.
    setTrackedNow((prev) => new Set(prev).add(s.text));
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "promote",
          accountIata: s.iata,
          title: s.text,
          detail: s.detail,
          kind: s.kind === "threat" ? "threat" : "opportunity",
          source: s.source,
          valueUsd: s.dollar ?? null,
          sourceUpdateId: s.updateId,
          priority: s.priority === "high" || s.priority === "low" ? s.priority : "medium",
        }),
      });
      if (!res.ok) {
        setTrackedNow((prev) => {
          const next = new Set(prev);
          next.delete(s.text);
          return next;
        });
        const j = await res.json().catch(() => ({}));
        setTrackError(`Track failed: ${j.error ?? res.status}`);
        return;
      }
      router.refresh();
    } catch {
      setTrackedNow((prev) => {
        const next = new Set(prev);
        next.delete(s.text);
        return next;
      });
      setTrackError("Track failed — network error.");
    } finally {
      setPromoting(false);
    }
  }

  async function onStatus(id: string, status: OpportunityStatus) {
    setPromoting(true);
    try {
      await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", id, status }),
      });
      router.refresh();
    } finally {
      setPromoting(false);
    }
  }

  const bdRegions = selectedBd
    ? Array.from(new Set(accountsForBd(selectedBd).map((a) => a.region)))
    : [];

  const tabs = [
    { key: "coming" as const, label: "Coming", hint: "what's ahead" },
    { key: "happening" as const, label: "Happening", hint: "in flight now" },
    { key: "happened" as const, label: "Happened", hint: "already landed" },
  ];
  const visible = groups[timeTab];

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {/* Map + selection */}
      <div className="space-y-3">
        {/* Browse by BD */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            Browse by BD
          </span>
          <button
            onClick={() => {
              setSelectedBd("");
              setSelectedIata("");
              setSelectedRegion("");
            }}
            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
              !selectedBd && !selectedIata
                ? "bg-[var(--ink)] text-white"
                : "border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--brand)]"
            }`}
          >
            All
          </button>
          {USERS.filter((u) => u.role === "bd").map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setSelectedBd(u.id);
                setSelectedIata("");
                setSelectedRegion("");
              }}
              title={u.title}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                selectedBd === u.id
                  ? "bg-[var(--ink)] text-white"
                  : "border border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--brand)]"
              }`}
            >
              {u.name.split(" ")[0]}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white" style={{ height: 440 }}>
          <AccountMapClient
            accounts={ACCOUNTS}
            metrics={metrics}
            selected={selectedIata}
            onSelect={(iata) => {
              setSelectedIata(iata);
              setSelectedBd("");
              setSelectedRegion("");
            }}
            onSelectBd={(bd) => {
              setSelectedBd(bd);
              setSelectedIata("");
              setSelectedRegion("");
            }}
          />
        </div>
        {selectedBd && bdRegions.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
              Region:
            </span>
            <button
              onClick={() => setSelectedRegion("")}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                selectedRegion === ""
                  ? "bg-[var(--ink)] text-white"
                  : "border border-[var(--line)] bg-white text-[var(--ink-soft)]"
              }`}
            >
              All
            </button>
            {bdRegions.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                  selectedRegion === r
                    ? "bg-[var(--ink)] text-white"
                    : "border border-[var(--line)] bg-white text-[var(--ink-soft)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selection summary + mega updates */}
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--line)] bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="min-w-0">
              <div className="truncate text-[16px] font-semibold text-[var(--ink)]">{label}</div>
              <div className="text-[11px] text-[var(--ink-faint)]">
                {scopeAccounts.length} carrier{scopeAccounts.length === 1 ? "" : "s"}
                {bdUser && !selectedIata ? ` · BD: ${bdUser.name}` : ""}
                {uber.covered < scopeAccounts.length && (
                  <span title="Carriers with live CSV metrics; the rest get metrics at the next refresh">
                    {" "}· live metrics: {iatas.filter((i) => metrics[i]).join(", ") || "none yet"}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-auto flex shrink-0 gap-2">
              {selectedIata && (
                <Link
                  href={`/leader/account/${selectedIata}`}
                  className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)]"
                >
                  Full account →
                </Link>
              )}
              {selectedBd && !selectedIata && (
                <Link
                  href={`/leader/bd/${selectedBd}`}
                  className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)]"
                >
                  BD board →
                </Link>
              )}
              <Link
                href="/leader/workspace"
                className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--ink-soft)] hover:bg-[var(--bg)]"
              >
                Workspace →
              </Link>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <SummaryStat label="YTD Flown" value={fmtUsd(uber.rev)} />
            <SummaryStat
              label="Blended vLY"
              value={uber.yoy !== undefined ? `${uber.yoy >= 0 ? "+" : ""}${uber.yoy.toFixed(1)}%` : "—"}
            />
            <SummaryStat label="O&D Pax" value={uber.pax ? uber.pax.toLocaleString() : "—"} />
          </div>
        </div>

        {/* Coming / Happening / Happened — mega updates only */}
        <div className="rounded-xl border border-[var(--line)] bg-white">
          <div className="flex border-b border-[var(--line)]">
            {tabs.map((t) => {
              const active = timeTab === t.key;
              const count = groups[t.key].length;
              return (
                <button
                  key={t.key}
                  onClick={() => setTimeTab(t.key)}
                  className={`relative flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold transition ${
                    active ? "text-[var(--brand)]" : "text-[var(--ink-faint)] hover:text-[var(--ink)]"
                  }`}
                >
                  {t.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${
                      active ? "bg-[var(--brand-soft)] text-[var(--brand-dark)]" : "bg-[var(--bg)] text-[var(--ink-faint)]"
                    }`}
                  >
                    {count}
                  </span>
                  {active && (
                    <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-t bg-[var(--brand)]" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                Mega updates only · {tabs.find((t) => t.key === timeTab)?.hint}
              </span>
            </div>
            {visible.length === 0 ? (
              <div className="rounded-lg bg-[var(--bg)] p-4 text-center text-[12px] text-[var(--ink-faint)]">
                No mega updates for this selection.
              </div>
            ) : (
              <>
                {trackError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-medium text-red-700">
                    {trackError}
                  </div>
                )}
                <ul className="space-y-1.5">
                  {visible.slice(0, expanded ? 20 : 5).map((s) => {
                    const key = s.updateId ?? s.text;
                    const linkedOpp = s.updateId
                      ? opportunities.find((o) => o.sourceUpdateId === s.updateId)
                      : undefined;
                    const sourceUpdate = s.updateId
                      ? updates.find((u) => u.id === s.updateId)
                      : undefined;
                    return (
                      <MegaRow
                        key={key}
                        s={s}
                        linkedOpp={linkedOpp}
                        justTracked={trackedNow.has(s.text)}
                        sourceNextStep={sourceUpdate?.nextStep ?? undefined}
                        expanded={expandedKey === key}
                        busy={promoting}
                        onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
                        onPromote={onPromote}
                        onStatus={onStatus}
                      />
                    );
                  })}
                </ul>
                {visible.length > 5 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 w-full rounded-md border border-[var(--line)] bg-white py-1.5 text-[11px] font-semibold text-[var(--ink-soft)] hover:bg-[var(--bg)]"
                  >
                    {expanded ? "Show less" : `Show ${Math.min(visible.length, 20) - 5} more`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
