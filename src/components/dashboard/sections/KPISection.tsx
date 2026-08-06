"use client";

import type { KPIs, TrendlinePoint } from "@/lib/dashboard-types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Badge } from "../ui/Badge";
import { TrendlineChart } from "../charts/TrendlineChart";

function KPICard({
  label,
  value,
  vly,
  mom,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  vly: number;
  mom?: number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-xl font-extrabold text-gray-900 leading-tight truncate">
          {value}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge value={vly} />
          <span className="text-[9px] text-gray-400">v LY</span>
          {mom !== undefined && (
            <>
              <Badge value={mom} />
              <span className="text-[9px] text-gray-400">MoM</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function YieldCard({ economy, premium }: { economy: { value: number; vly: number }; premium: { value: number; vly: number } }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm col-span-2 sm:col-span-1">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-50">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B1FA2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Yield <span className="text-gray-300">· cents</span>
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-gray-500">Economy</span>
            <span className="text-sm font-extrabold text-gray-900">{economy.value}¢</span>
            <Badge value={economy.vly} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-gray-500">Premium</span>
            <span className="text-sm font-extrabold text-gray-900">{premium.value}¢</span>
            <Badge value={premium.vly} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function KPISection({ kpis, currency, trendline }: { kpis: KPIs; currency: string; trendline?: TrendlinePoint[] }) {
  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <KPICard
        label="Revenue"
        value={formatCurrency(kpis.revenue.value, true)}
        vly={kpis.revenue.vly}
        mom={kpis.revenue.mom}
        iconBg="bg-amber-50"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        }
      />
      <KPICard
        label="OND Pax"
        value={formatNumber(kpis.ondPax.value, true)}
        vly={kpis.ondPax.vly}
        mom={kpis.ondPax.mom}
        iconBg="bg-blue-50"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0071c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        }
      />
      <KPICard
        label="ATV"
        value={`${currency === "USD" ? "$" : currency}${kpis.atv.value}`}
        vly={kpis.atv.vly}
        mom={kpis.atv.mom}
        iconBg="bg-green-50"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
        }
      />
      <KPICard
        label="Premium Rev"
        value={formatCurrency(kpis.premium.value, true)}
        vly={kpis.premium.vly}
        mom={kpis.premium.mom}
        iconBg="bg-red-50"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        }
      />
      <YieldCard economy={kpis.yield.economy} premium={kpis.yield.premium} />
      </div>

      {/* Monthly Revenue Trendline */}
      {trendline && trendline.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Revenue Trend · Departure Month
          </p>
          <div className="h-40 sm:h-48">
            <TrendlineChart
              labels={trendline.map((t) => t.month)}
              values={trendline.map((t) => t.revenue)}
              formatValue={(v) => formatCurrency(v, true)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
