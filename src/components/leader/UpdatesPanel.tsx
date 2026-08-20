import Link from "next/link";
import { findUser, findAccount, USERS } from "@/lib/users";
import { isNoise } from "@/lib/signals";
import type { UpdateRecord, AccountMetrics } from "@/lib/store";

interface Props {
  updates: UpdateRecord[];
  accountName?: string;
  metrics?: Record<string, AccountMetrics>;
}

function userName(uid: string) {
  return findUser(uid)?.name ?? uid;
}

function fmtUsd(n: number | undefined) {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  const days = Math.floor(diff / day);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function weekBucket(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((now.getTime() - then.getTime()) / day);
  if (diffDays < 7) return "This week";
  if (diffDays < 14) return "Last week";
  if (diffDays < 21) return "2 weeks ago";
  if (diffDays < 28) return "3 weeks ago";
  return "Earlier";
}

export default function UpdatesPanel({ updates, accountName, metrics }: Props) {
  const clean = updates.filter((u) => !isNoise(u.headline));
  const globals = clean
    .filter((u) => u.scope === "global")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const locals = clean
    .filter((u) => u.scope === "local")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const hero = globals[0];
  const rest = globals.slice(1);

  if (!hero && locals.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-white p-6 text-sm text-[var(--ink-faint)]">
        No updates yet for {accountName ?? "the selected view"}.
      </div>
    );
  }

  const heroAccount = hero ? findAccount(hero.accountIata) : null;
  const heroMetric = hero ? metrics?.[hero.accountIata] : undefined;

  // Group earlier globals by week
  const grouped = rest.reduce<Record<string, UpdateRecord[]>>((acc, u) => {
    const key = weekBucket(u.createdAt);
    (acc[key] ??= []).push(u);
    return acc;
  }, {});

  // Map: parent update id => local children (v1 will use parentUpdateId; for now
  // roll locals under the hero's account).
  const heroLocals = hero
    ? locals.filter((l) => l.accountIata === hero.accountIata)
    : [];
  const unlinkedLocals = hero
    ? locals.filter((l) => l.accountIata !== hero.accountIata)
    : locals;

  return (
    <div className="space-y-4">
      {hero && (
        <div
          className="relative overflow-hidden rounded-xl border-l-4 bg-white shadow-sm"
          style={{ borderColor: "#ff6a3d" }}
        >
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide">
              <span className="rounded bg-orange-50 px-2 py-0.5 font-bold text-orange-700">
                Latest global
              </span>
              {heroAccount && (
                <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 font-semibold text-[var(--brand-dark)]">
                  {heroAccount.iata} · {heroAccount.name}
                </span>
              )}
              <span className="ml-auto text-[var(--ink-faint)]">
                {relativeTime(hero.createdAt)} · {new Date(hero.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-[19px] font-semibold leading-snug text-[var(--ink)]">
              {hero.headline}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{hero.detail}</p>

            {hero.dollarImpact && (
              <div className="mt-2 inline-flex items-baseline gap-1.5 rounded bg-emerald-50 px-2 py-1 text-[12px] text-emerald-900">
                <span className="font-bold">{fmtUsd(hero.dollarImpact.amountUsd)}</span>
                {hero.dollarImpact.note && <span>{hero.dollarImpact.note}</span>}
              </div>
            )}

            {heroMetric && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-[var(--bg)] px-3 py-2 text-[11px]">
                <span className="font-semibold text-[var(--ink-soft)]">Impact:</span>
                <span>
                  YTD Flown <span className="font-semibold text-[var(--ink)]">{fmtUsd(heroMetric.ytdFlownRevUsd)}</span>
                  {heroMetric.ytdFlownRevVlyPct !== undefined && (
                    <span
                      className="ml-1 font-semibold"
                      style={{ color: heroMetric.ytdFlownRevVlyPct >= 0 ? "var(--good)" : "var(--bad)" }}
                    >
                      ({heroMetric.ytdFlownRevVlyPct >= 0 ? "+" : ""}{heroMetric.ytdFlownRevVlyPct.toFixed(1)}% vLY)
                    </span>
                  )}
                </span>
                <span>·</span>
                <span>EU-APAC <span className="font-semibold text-[var(--ink)]">{fmtUsd(heroMetric.euApacRevUsd)}</span></span>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[var(--ink-faint)]">
              <span>
                BD: <span className="font-medium text-[var(--ink-soft)]">{userName(hero.bd)}</span>
              </span>
              {hero.nextStep && (
                <span>
                  Next: <span className="font-medium text-[var(--ink-soft)]">{hero.nextStep}</span>
                </span>
              )}
              <Link
                href={`/leader/account/${hero.accountIata}`}
                className="ml-auto rounded-md border border-[var(--line)] bg-white px-2.5 py-1 font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)]"
              >
                See details →
              </Link>
            </div>

            {heroLocals.length > 0 && (
              <div className="mt-4 border-t border-[var(--line)] pt-3">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                  Local rollup · {heroLocals.length}
                </div>
                <ul className="space-y-2">
                  {heroLocals.map((u) => (
                    <li key={u.id} className="border-l-2 border-orange-200 pl-3">
                      <div className="flex items-center gap-2 text-[10px] text-[var(--ink-faint)]">
                        {u.market && <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 font-medium">{u.market}</span>}
                        <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                        <span className="ml-auto">by {userName(u.createdBy)}</span>
                      </div>
                      <div className="mt-0.5 text-[13px] font-medium text-[var(--ink)]">{u.headline}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([bucket, items]) => (
        <div key={bucket} className="rounded-xl border border-[var(--line)] bg-white p-4">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            {bucket}
          </div>
          <ol className="relative space-y-3 border-l-2 border-[var(--line)] pl-4">
            {items.map((u) => (
              <li key={u.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
                <div className="flex items-center gap-2 text-[10px] text-[var(--ink-faint)]">
                  <span className="rounded bg-[var(--brand-soft)] px-1.5 py-0.5 font-semibold text-[var(--brand-dark)]">
                    {u.accountIata}
                  </span>
                  <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                  <span className="ml-auto">{userName(u.bd)}</span>
                </div>
                <div className="mt-0.5 text-sm font-medium text-[var(--ink)]">{u.headline}</div>
              </li>
            ))}
          </ol>
        </div>
      ))}

      {unlinkedLocals.length > 0 && (
        <div className="rounded-xl border border-[var(--line)] bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            <span>Unlinked local updates</span>
            <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 font-normal">
              not attached to a global
            </span>
          </div>
          <ul className="space-y-3">
            {unlinkedLocals.map((u) => (
              <li key={u.id} className="border-l-2 border-[var(--brand-soft)] pl-3">
                <div className="flex items-center gap-2 text-[10px] text-[var(--ink-faint)]">
                  <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 font-medium">{u.accountIata}</span>
                  {u.market && <span>{u.market}</span>}
                  <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                  <span className="ml-auto">by {userName(u.createdBy)}</span>
                </div>
                <div className="mt-0.5 text-sm text-[var(--ink)]">{u.headline}</div>
                <p className="mt-1 text-[12px] text-[var(--ink-soft)]">{u.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function knownUsers() {
  return USERS;
}
