"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Account } from "@/lib/users";

interface Props {
  accounts: Account[];
  defaultAccountIata?: string;
}

export default function LogUpdateForm({ accounts, defaultAccountIata }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [accountIata, setAccountIata] = useState(defaultAccountIata ?? accounts[0]?.iata ?? "");
  const [scope, setScope] = useState<"global" | "local">("global");
  const [headline, setHeadline] = useState("");
  const [detail, setDetail] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [market, setMarket] = useState("");

  function reset() {
    setHeadline("");
    setDetail("");
    setNextStep("");
    setMeetingDate("");
    setMarket("");
    setScope("global");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!headline.trim()) {
      setError("Headline is required");
      return;
    }
    const res = await fetch("/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountIata,
        scope,
        market: scope === "local" ? market : undefined,
        meetingDate: meetingDate || undefined,
        headline,
        detail,
        nextStep,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "failed");
      return;
    }
    reset();
    setExpanded(false);
    startTransition(() => router.refresh());
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-white px-4 py-3 text-left text-sm text-[var(--ink-soft)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-[13px] font-bold text-white">
          +
        </span>
        <span>Log a meeting, deal, or update…</span>
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-[var(--ink)]">New update</span>
        <button type="button" onClick={() => { setExpanded(false); reset(); }} className="text-[11px] font-medium text-[var(--ink-faint)] hover:text-[var(--ink)]">
          Cancel
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">Account</span>
          <select
            value={accountIata}
            onChange={(e) => setAccountIata(e.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm"
          >
            {accounts.map((a) => (
              <option key={a.iata} value={a.iata}>{a.iata} · {a.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">Scope</span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as "global" | "local")}
            className="w-full rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="global">Global</option>
            <option value="local">Local (POS)</option>
          </select>
        </label>
        {scope === "local" && (
          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">POS</span>
            <input
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              placeholder="UAE, KSA…"
              className="w-full rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm"
            />
          </label>
        )}
        <label className={scope === "local" ? "" : "sm:col-span-1"}>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">Meeting date</span>
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm"
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">Headline *</span>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. Met EK VP Commercial · FY26-27 threshold discussed"
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">Detail</span>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          placeholder="What was discussed / decided?"
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">Next step</span>
        <input
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
          placeholder="e.g. Send counterproposal by Aug 12"
          className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        />
      </label>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-50"
        >
          {pending ? "Logging…" : "Log update"}
        </button>
        <span className="text-[11px] text-[var(--ink-faint)]">
          Feeds the updates panel + timeline + BD Gantt.
        </span>
      </div>
    </form>
  );
}
