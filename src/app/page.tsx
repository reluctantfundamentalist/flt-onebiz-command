"use client";
import { useState, type ReactNode } from "react";
import LoginScreen from "@/components/LoginScreen";
import AccountHealth from "@/components/AccountHealth";
import StakeholderMap from "@/components/StakeholderMap";
import { AIRLINE_CODES, AIRLINE_BRANDS, type Session } from "@/lib/accounts";

type Tab = "health" | "stakeholders";

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<Tab>("health");

  if (!session) {
    return <LoginScreen onLogin={setSession} />;
  }

  const brand = AIRLINE_BRANDS[session.airline];
  const code = AIRLINE_CODES[session.airline];
  const initials = session.bm
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  function logout() {
    setSession(null);
    setTab("health");
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white">
            1B
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--ink)]">Flt OneBiz · Command</div>
            <div className="text-[11px] text-[var(--ink-faint)]">
              Leadership + BD workspace · {session.airline}
            </div>
          </div>

          <div
            className="ml-4 hidden rounded-md px-2.5 py-1 text-xs font-semibold text-white sm:block"
            style={{ backgroundColor: brand.primary }}
          >
            {code}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ backgroundColor: brand.primary }}
              >
                {initials}
              </div>
              <span className="hidden text-sm text-[var(--ink-soft)] sm:inline">
                {session.bm}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-1 text-[11px] font-medium text-[var(--ink-faint)] hover:bg-[var(--bg)]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-7xl gap-1 px-4">
          <TabBtn active={tab === "health"} onClick={() => setTab("health")}>
            Account Health
          </TabBtn>
          <TabBtn active={tab === "stakeholders"} onClick={() => setTab("stakeholders")}>
            Stakeholder Map
          </TabBtn>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-6">
        {tab === "health" && <AccountHealth airline={session.airline} />}
        {tab === "stakeholders" && <StakeholderMap airline={session.airline} />}
      </main>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-3 text-sm font-medium transition ${
        active ? "text-[var(--brand)]" : "text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
      }`}
    >
      {children}
      {active && (
        <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-[var(--brand)]" />
      )}
    </button>
  );
}
