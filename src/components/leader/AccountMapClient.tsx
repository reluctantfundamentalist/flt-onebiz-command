"use client";
import dynamic from "next/dynamic";
import type { Account } from "@/lib/users";
import type { AccountMetrics } from "@/lib/store";

// Leaflet uses window/document — must be client-only.
const AccountMap = dynamic(() => import("./AccountMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[var(--ink-faint)]">
      Loading map…
    </div>
  ),
});

export default function AccountMapClient({
  accounts,
  metrics,
}: {
  accounts: Account[];
  metrics: Record<string, AccountMetrics>;
}) {
  return <AccountMap accounts={accounts} metrics={metrics} />;
}
