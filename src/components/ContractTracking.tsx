"use client";
import { useState } from "react";
import { EK_CONTRACT, fmtRevenueM, type ContractQuarter, type Booster } from "@/lib/contract-ek";
import type { AirlineName } from "@/lib/accounts";

interface Props {
  airline: AirlineName;
}

// For prototype: only Emirates has contract data; other airlines show placeholder
const AIRLINE_HAS_CONTRACT: AirlineName[] = ["Emirates Airline"];

export default function ContractTracking({ airline }: Props) {
  if (!AIRLINE_HAS_CONTRACT.includes(airline)) {
    return <Placeholder airline={airline} />;
  }

  const c = EK_CONTRACT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">Emirates FY25-26 Ticketing Agreement</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Effective {c.agreementDate} · {c.parties}
            </p>
          </div>
          <button className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] hover:bg-[var(--bg)]">
            📄 Upload agreement for auto-parsing (coming soon)
          </button>
        </div>
      </div>

      {/* Pillar Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <PillarCard
          label="Global Incentive"
          value={`${c.quarters[0].tiers[0].totalPct}%–${c.quarters[0].tiers[c.quarters[0].tiers.length - 1].totalPct}%`}
          sub="4-tier structure, per quarter"
        />
        <PillarCard
          label="Premium Booster"
          value="0.60%"
          sub="F/J Flex & Flex Plus"
        />
        <PillarCard
          label="OD Pax Boosters"
          value="6 active"
          sub="FE, CN, EU × 3"
        />
        <PillarCard
          label="EGW Coupon"
          value="$2.50"
          sub="Per flown segment"
        />
        <PillarCard
          label="Marketing Fund"
          value="0.25%"
          sub="Retained by Carrier · 10:1 ROI"
        />
      </div>

      {/* Quarterly Incentive Table */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--ink)]">
          Schedule 2 — Global Override Incentive (Quarterly)
        </h3>
        <p className="mb-4 text-xs text-[var(--ink-faint)]">
          Incentive = % of total Net Flown Revenue. Confirmed by Carrier revenue accounting within 60 days of quarter end, payable within 90 days.
        </p>
        {c.quarters.map((q) => (
          <QuarterTable key={q.label} quarter={q} />
        ))}
      </section>

      {/* Boosters */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--ink)]">
          Schedule 3 — Performance Boosters
        </h3>
        <div className="space-y-3">
          {c.boosters.map((b) => (
            <BoosterCard key={b.key} booster={b} />
          ))}
        </div>
      </section>

      {/* EGW & Marketing */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* EGW */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">
            Schedule 3 — EGW Commission
          </h3>
          <div className="text-2xl font-semibold text-[var(--brand)]">$2.50</div>
          <div className="text-sm text-[var(--ink-soft)]">per flown segment · all points of sale</div>
          <ul className="mt-2 space-y-1">
            {c.egwCoupon.terms.map((t, i) => (
              <li key={i} className="text-xs text-[var(--ink-faint)]">• {t}</li>
            ))}
          </ul>
        </div>

        {/* Marketing */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">
            Schedule 4 — Marketing Payouts
          </h3>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[var(--brand-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--brand-dark)]">
              ROI Target: {c.marketing.roiTarget}
            </span>
          </div>
          <ol className="mt-3 list-inside list-decimal space-y-1">
            {c.marketing.process.map((step, i) => (
              <li key={i} className="text-xs text-[var(--ink-soft)]">{step}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Key Exclusions */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">Key Exclusions & Terms</h3>
        <ul className="grid gap-1 sm:grid-cols-2">
          {c.keyExclusions.map((ex, i) => (
            <li key={i} className="text-xs text-[var(--ink-soft)]">• {ex}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PillarCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{value}</div>
      <div className="mt-0.5 text-[11px] text-[var(--ink-faint)]">{sub}</div>
    </div>
  );
}

function QuarterTable({ quarter }: { quarter: ContractQuarter }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 text-xs font-semibold text-[var(--ink-soft)]">
        {quarter.label}: {quarter.period}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-[var(--ink-faint)]">
              <th className="pb-2 pr-3 font-medium">Min Revenue</th>
              <th className="pb-2 pr-3 font-medium">Max Revenue</th>
              <th className="pb-2 pr-3 font-medium">Incentive %</th>
              <th className="pb-2 pr-3 font-medium">Marketing %</th>
              {quarter.tiers[0].partnershipMarketingPct !== undefined && (
                <th className="pb-2 pr-3 font-medium">Partnership Mkt %</th>
              )}
              <th className="pb-2 font-medium text-[var(--brand)]">Total %</th>
            </tr>
          </thead>
          <tbody>
            {quarter.tiers.map((t, i) => (
              <tr key={i} className="border-b border-[var(--line)] last:border-0">
                <td className="py-2 pr-3 font-mono text-[var(--ink)]">{fmtRevenueM(t.minRevenue)}</td>
                <td className="py-2 pr-3 font-mono text-[var(--ink)]">
                  {t.maxRevenue === null ? "Above" : fmtRevenueM(t.maxRevenue)}
                </td>
                <td className="py-2 pr-3">{t.incentivePct.toFixed(2)}%</td>
                <td className="py-2 pr-3">{t.marketingPct.toFixed(2)}%</td>
                {t.partnershipMarketingPct !== undefined && (
                  <td className="py-2 pr-3">{t.partnershipMarketingPct.toFixed(2)}%</td>
                )}
                <td className="py-2 font-semibold text-[var(--brand)]">{t.totalPct.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BoosterCard({ booster }: { booster: Booster }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-[var(--line)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg)]"
      >
        <span className="rounded-md bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--brand-dark)]">
          {booster.tableRef}
        </span>
        <span className="flex-1 text-sm font-medium text-[var(--ink)]">{booster.name}</span>
        <span className="text-xs text-[var(--ink-faint)]">{booster.valueDescription.split("·")[0]}</span>
        <span className="text-[11px] text-[var(--ink-faint)]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-[var(--line)] px-4 py-3 space-y-2">
          <div className="text-xs text-[var(--ink-soft)]">
            <span className="font-medium">Period:</span> {booster.period}
          </div>
          <div className="text-xs text-[var(--ink-soft)]">
            <span className="font-medium">Value:</span> {booster.valueDescription}
          </div>
          {booster.focusDestinations && (
            <div className="text-xs text-[var(--ink-soft)]">
              <span className="font-medium">Focus:</span> {booster.focusDestinations}
            </div>
          )}
          <ul className="space-y-0.5">
            {booster.terms.map((t, i) => (
              <li key={i} className="text-[11px] text-[var(--ink-faint)]">• {t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Placeholder({ airline }: { airline: AirlineName }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg)] text-2xl">
        📊
      </div>
      <h3 className="text-lg font-semibold text-[var(--ink)]">No contract loaded for {airline.split(" ")[0]}</h3>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Contract tracking is currently available for Emirates Airline (FY25-26).
        <br />
        Additional airline agreements will be added as they are onboarded.
      </p>
    </div>
  );
}
