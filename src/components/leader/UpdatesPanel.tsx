import Link from "next/link";
import { findUser, USERS } from "@/lib/users";
import type { UpdateRecord } from "@/lib/store";

interface Props {
  updates: UpdateRecord[];
  accountName?: string;
}

function userName(uid: string) {
  return findUser(uid)?.name ?? uid;
}

export default function UpdatesPanel({ updates, accountName }: Props) {
  const globals = updates.filter((u) => u.scope === "global").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const locals = updates.filter((u) => u.scope === "local").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const hero = globals[0];
  const rest = globals.slice(1);

  if (!hero && locals.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-white p-6 text-sm text-[var(--ink-faint)]">
        No updates yet for {accountName ?? "the selected view"}.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hero && (
        <div className="rounded-xl border border-[var(--line)] bg-white p-5">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--brand)]">
            <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5">Latest global</span>
            <span className="text-[var(--ink-faint)]">{hero.accountIata}</span>
            <span className="ml-auto text-[var(--ink-faint)]">
              {new Date(hero.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-lg font-semibold leading-snug text-[var(--ink)]">{hero.headline}</h3>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{hero.detail}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[var(--ink-faint)]">
            <span>BD: <span className="font-medium text-[var(--ink-soft)]">{userName(hero.bd)}</span></span>
            {hero.nextStep && (
              <span>
                Next: <span className="font-medium text-[var(--ink-soft)]">{hero.nextStep}</span>
              </span>
            )}
            <Link
              href={`/leader/account/${hero.accountIata}`}
              className="ml-auto rounded-md border border-[var(--line)] px-2.5 py-1 font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)]"
            >
              See details →
            </Link>
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="rounded-xl border border-[var(--line)] bg-white p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            Earlier global updates
          </div>
          <ul className="space-y-3">
            {rest.map((u) => (
              <li key={u.id} className="border-b border-[var(--line)] pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 text-[10px] text-[var(--ink-faint)]">
                  <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 font-medium">{u.accountIata}</span>
                  <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                  <span className="ml-auto">{userName(u.bd)}</span>
                </div>
                <div className="mt-0.5 text-sm font-medium text-[var(--ink)]">{u.headline}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {locals.length > 0 && (
        <div className="rounded-xl border border-[var(--line)] bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            <span>Local updates</span>
            <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 font-normal">
              child records roll up to parent BD
            </span>
          </div>
          <ul className="space-y-3">
            {locals.map((u) => (
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
