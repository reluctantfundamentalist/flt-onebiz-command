"use client";
import { useState } from "react";
import Link from "next/link";
import AccountMapClient from "./AccountMapClient";
import UpdatesPanel from "./UpdatesPanel";
import SignalStrip from "./SignalStrip";
import { buildSignals, isNoise, type MarketIntel } from "@/lib/signals";
import type { Account } from "@/lib/users";
import { findAccount, findUser, layersFor, ACCOUNTS } from "@/lib/users";
import type { AccountMetrics, UpdateRecord } from "@/lib/store";

function fmtUsd(n: number | undefined) {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
      <div className="text-[15px] font-semibold text-[var(--ink)]">{value}</div>
      {sub && <div className="text-[11px] text-[var(--ink-soft)]">{sub}</div>}
    </div>
  );
}

function AccountSide({
  iata,
  metrics,
  updates,
}: {
  iata: string;
  metrics: Record<string, AccountMetrics>;
  updates: UpdateRecord[];
}) {
  const acc = findAccount(iata);
  const m = metrics[iata];
  const list = updates
    .filter((u) => u.accountIata === iata && !isNoise(u.headline))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!acc) return null;

  const yoy = m?.ytdFlownRevVlyPct;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--line)] bg-white p-4">
        <div className="flex items-center gap-3">
          <img
            src={`/logos/${iata.toLowerCase()}.png`}
            alt=""
            className="h-9 w-9 rounded-md bg-white object-contain"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div className="min-w-0">
            <div className="truncate text-[16px] font-semibold text-[var(--ink)]">{acc.iata} · {acc.name}</div>
            <div className="text-[11px] text-[var(--ink-faint)]">
              {acc.hqCountry} · BD: {findUser(acc.ownerId)?.name ?? acc.ownerId}
            </div>
          </div>
          <Link
            href={`/leader/account/${iata}`}
            className="ml-auto shrink-0 rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-[12px] font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)]"
          >
            Full account →
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric label="YTD Flown" value={fmtUsd(m?.ytdFlownRevUsd)} sub={yoy !== undefined ? `${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}% vLY` : undefined} />
          <Metric label="EU-APAC" value={fmtUsd(m?.euApacRevUsd)} />
          <Metric label="NPBR" value={fmtUsd(m?.npbrUsd)} />
          <Metric label="O&D Pax" value={m?.ondPax ? m.ondPax.toLocaleString() : "—"} />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-white p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
          Updates · {list.length}
        </div>
        {list.length === 0 ? (
          <div className="text-sm text-[var(--ink-faint)]">No updates recorded for this airline yet.</div>
        ) : (
          <ul className="space-y-3">
            {list.map((u) => (
              <li key={u.id} className="border-l-2 border-[var(--brand-soft)] pl-3">
                <div className="text-[10px] text-[var(--ink-faint)]">{new Date(u.createdAt).toLocaleDateString()} · {findUser(u.bd)?.name ?? u.bd}</div>
                <div className="text-sm font-medium text-[var(--ink)]">{u.headline}</div>
                {u.detail && <p className="mt-0.5 text-[12px] text-[var(--ink-soft)]">{u.detail}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BdSide({
  bd,
  metrics,
  updates,
}: {
  bd: string;
  metrics: Record<string, AccountMetrics>;
  updates: UpdateRecord[];
}) {
  const name = findUser(bd)?.name ?? bd;
  const accounts = ACCOUNTS.filter(
    (a) => a.ownerId === bd || layersFor(a).some((l) => l.ownerId === bd),
  );
  const topics = updates.filter((u) => u.bd === bd && !isNoise(u.headline));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--line)] bg-white p-4">
        <div className="text-[16px] font-semibold text-[var(--ink)]">{name}</div>
        <div className="mt-1 text-[11px] text-[var(--ink-faint)]">
          {topics.length} inbox intel topics · {accounts.length} accounts
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {accounts.map((a) => (
            <span key={a.iata} className="rounded bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand-dark)]">
              {a.iata}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-white p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
          Inbox intel · synced
        </div>
        {topics.length === 0 ? (
          <div className="text-sm text-[var(--ink-faint)]">No inbox intel synced for this BD yet.</div>
        ) : (
          <ul className="space-y-3">
            {topics.map((u) => (
              <li key={u.id} className="border-l-2 border-[var(--brand-soft)] pl-3">
                <div className="flex items-center gap-2 text-[10px] text-[var(--ink-faint)]">
                  <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 font-medium">{u.accountIata}</span>
                  <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-sm font-medium text-[var(--ink)]">{u.headline}</div>
                {u.detail && <p className="mt-0.5 text-[12px] text-[var(--ink-soft)]">{u.detail}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function LeaderMapWorkspace({
  accounts,
  metrics,
  updates,
  intel,
}: {
  accounts: Account[];
  metrics: Record<string, AccountMetrics>;
  updates: UpdateRecord[];
  intel: MarketIntel[];
}) {
  const [selected, setSelected] = useState<string>("");
  const [selectedBd, setSelectedBd] = useState<string>("");

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white" style={{ height: 480 }}>
        <AccountMapClient
          accounts={accounts}
          metrics={metrics}
          selected={selected}
          onSelect={(iata) => {
            setSelected(iata);
            setSelectedBd("");
          }}
          onSelectBd={(bd) => {
            setSelectedBd(bd);
            setSelected("");
          }}
        />
      </div>
      <div className="scroll-slim overflow-y-auto pr-1" style={{ maxHeight: 480 }}>
        {selected ? (
          <div className="space-y-4">
            <SignalStrip groups={buildSignals(selected, metrics[selected], updates, intel)} />
            <AccountSide iata={selected} metrics={metrics} updates={updates} />
          </div>
        ) : selectedBd ? (
          <BdSide bd={selectedBd} metrics={metrics} updates={updates} />
        ) : (
          <UpdatesPanel updates={updates} metrics={metrics} />
        )}
      </div>
    </section>
  );
}
