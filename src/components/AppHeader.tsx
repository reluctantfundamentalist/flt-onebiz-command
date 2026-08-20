"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/auth";

const LEADER_NAV: { key: string; label: string; href: string }[] = [
  { key: "overview", label: "Overview", href: "/leader" },
  { key: "opportunities", label: "Opportunities & Threats", href: "/leader/workspace?tab=opportunities" },
  { key: "activity", label: "Activity", href: "/leader/workspace?tab=activity" },
  { key: "contracts", label: "Contracts & Financials", href: "/leader/workspace?tab=contracts" },
  { key: "metrics", label: "Metrics", href: "/leader/workspace?tab=metrics" },
];

export default function AppHeader({
  session,
  subtitle,
  navActive,
}: {
  session: SessionPayload;
  subtitle: string;
  navActive?: string;
}) {
  const router = useRouter();

  const initials = session.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white">
          1B
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--ink)]">Flt OneBiz · Command</div>
          <div className="text-[11px] text-[var(--ink-faint)]">{subtitle}</div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
              session.role === "leader"
                ? "bg-[var(--brand-soft)] text-[var(--brand-dark)]"
                : "bg-orange-50 text-orange-700"
            }`}
          >
            {session.role.toUpperCase()}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-semibold text-white">
              {initials}
            </div>
            <span className="hidden text-sm text-[var(--ink-soft)] sm:inline">{session.name}</span>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-1 text-[11px] font-medium text-[var(--ink-faint)] hover:bg-[var(--bg)]"
          >
            Log out
          </button>
        </div>
      </div>

      {session.role === "leader" && (
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {LEADER_NAV.map((item) => {
            const active = navActive === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition ${
                  active
                    ? "bg-[var(--brand-soft)] text-[var(--brand-dark)]"
                    : "text-[var(--ink-faint)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
