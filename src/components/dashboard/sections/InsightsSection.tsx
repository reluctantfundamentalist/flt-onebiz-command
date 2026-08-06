"use client";

import type { Insights } from "@/lib/dashboard-types";
import { formatCurrency } from "@/lib/format";
import { DoughnutChart } from "../charts/DoughnutChart";
import { HorizontalBarChart } from "../charts/HorizontalBarChart";

function InsightCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-[85vw] sm:min-w-[300px] lg:min-w-0 lg:w-full bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col snap-center">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className="w-6 h-6 rounded-md flex items-center justify-center">{icon}</div>
        <span className="text-[11px] font-bold text-gray-800 tracking-tight">{title}</span>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

export function InsightsSection({ insights }: { insights: Insights }) {
  const totalProductRev = insights.productType.reduce((s, p) => s + p.revenue, 0);

  return (
    <div className="h-full flex flex-col justify-center px-4 lg:px-0">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 lg:mb-4">Insights</h2>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:snap-none max-w-7xl mx-auto w-full">

        {/* 1. Distribution Technology */}
        <InsightCard
          title="Distribution Technology"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>}
        >
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-gray-400 uppercase text-[9px] tracking-wider">
                <th className="text-left pb-2 font-semibold">Channel</th>
                <th className="text-right pb-2 font-semibold">Revenue</th>
                <th className="text-right pb-2 font-semibold">Share</th>
              </tr>
            </thead>
            <tbody>
              {insights.distribution.map((row) => (
                <tr key={row.channel} className="border-t border-gray-50">
                  <td className="py-2 font-bold text-[#0071c2]">{row.channel}</td>
                  <td className="py-2 text-right">{formatCurrency(row.revenue, true)}</td>
                  <td className="py-2 text-right font-semibold text-green-600">{row.revenueShare}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </InsightCard>

        {/* 2. Ancillary */}
        <InsightCard
          title="Ancillary"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
        >
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-gray-400 uppercase text-[9px] tracking-wider">
                <th className="text-left pb-2 font-semibold">Type</th>
                <th className="text-right pb-2 font-semibold">Paid Seg</th>
                <th className="text-right pb-2 font-semibold">Attach</th>
              </tr>
            </thead>
            <tbody>
              {insights.ancillary.map((row) => (
                <tr key={row.type} className="border-t border-gray-50">
                  <td className="py-2 font-bold text-[#B45309]">{row.type}</td>
                  <td className="py-2 text-right">{row.segments.toLocaleString()}</td>
                  <td className="py-2 text-right font-semibold text-green-600">{row.attachRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </InsightCard>

        {/* 3. AP Window Analysis */}
        <InsightCard
          title="AP Window Analysis"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        >
          <div className="h-32">
            <DoughnutChart
              labels={insights.bookingWindow.map((w) => w.label)}
              values={insights.bookingWindow.map((w) => w.paxShare)}
            />
          </div>
        </InsightCard>

        {/* 4. Trip Type */}
        <InsightCard
          title="Trip Type"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E7C86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8l4 4-4 4"/><path d="M3 12h16"/><path d="M7 8l-4 4 4 4"/></svg>}
        >
          <div className="h-32">
            <DoughnutChart
              labels={insights.tripType.map((t) => t.label)}
              values={insights.tripType.map((t) => t.paxShare)}
            />
          </div>
        </InsightCard>

        {/* 5. Cabin Split */}
        <InsightCard
          title="Cabin Split"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C2185B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        >
          <div className="h-32">
            <DoughnutChart
              labels={insights.cabinSplit.map((c) => c.label)}
              values={insights.cabinSplit.map((c) => c.paxShare)}
            />
          </div>
        </InsightCard>

        {/* 6. Traffic Type */}
        <InsightCard
          title="Traffic Type"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B1FA2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
        >
          <div className="h-32">
            <DoughnutChart
              labels={insights.trafficType.map((t) => t.label)}
              values={insights.trafficType.map((t) => t.paxShare)}
            />
          </div>
        </InsightCard>

        {/* 7. Product Type Revenue */}
        <InsightCard
          title="Product Type"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6F00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
        >
          {insights.productType.length > 0 ? (
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-gray-400 uppercase text-[9px] tracking-wider">
                  <th className="text-left pb-2 font-semibold">Brand</th>
                  <th className="text-right pb-2 font-semibold">Revenue</th>
                  <th className="text-right pb-2 font-semibold">Share</th>
                </tr>
              </thead>
              <tbody>
                {insights.productType.map((row) => (
                  <tr key={row.product} className="border-t border-gray-50">
                    <td className="py-2 font-bold text-gray-700 max-w-[120px] truncate" title={row.product}>{row.product}</td>
                    <td className="py-2 text-right">{formatCurrency(row.revenue, true)}</td>
                    <td className="py-2 text-right font-semibold text-green-600">
                      {totalProductRev > 0 ? Math.round((row.revenue / totalProductRev) * 1000) / 10 : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[10px] text-gray-400 italic">No fare brand data available for this period.</p>
          )}
        </InsightCard>
      </div>
    </div>
  );
}
