"use client";

import type { Rankings } from "@/lib/dashboard-types";
import { formatCurrency } from "@/lib/format";
import { Badge } from "../ui/Badge";
import { SectionHeader } from "../ui/SectionHeader";

function VlyCell({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-gray-300 text-[10px]">—</span>;
  }
  return <Badge value={value} />;
}

export function RankingsSection({ rankings, currency }: { rankings: Rankings; currency: string }) {
  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 Destinations (was ND Country) */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <SectionHeader title="Top 10 Destinations" />
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] min-w-[400px]">
              <thead>
                <tr className="bg-[#0071c2] text-white">
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px] w-6">#</th>
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px]">Destination</th>
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px]">Revenue</th>
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px]">v LY</th>
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px]">Pax</th>
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px]">v LY</th>
                </tr>
              </thead>
              <tbody>
                {rankings.topNDCountry.map((row, i) => (
                  <tr key={row.ond} className={i % 2 === 0 ? "bg-blue-50/30" : ""}>
                    <td className="py-1.5 px-2 text-center text-gray-400 font-bold text-[9px]">{row.rank}</td>
                    <td className="py-1.5 px-2 text-center font-bold text-[#005fa3]">{row.ond}</td>
                    <td className="py-1.5 px-2 text-center">{formatCurrency(row.revenue, true)}</td>
                    <td className="py-1.5 px-2 text-center"><VlyCell value={row.revVly} /></td>
                    <td className="py-1.5 px-2 text-center">{row.pax.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-center"><VlyCell value={row.paxVly} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 10 O-Ds (was ND OND) */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <SectionHeader title="Top 10 O-Ds" />
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] min-w-[400px]">
              <thead>
                <tr className="bg-[#0071c2] text-white">
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px] w-6">#</th>
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px]">O-D</th>
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px]">Revenue</th>
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px]">v LY</th>
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px]">Pax</th>
                  <th className="py-1.5 px-2 text-center font-semibold text-[9px]">v LY</th>
                </tr>
              </thead>
              <tbody>
                {rankings.topNDOND.map((row, i) => (
                  <tr key={row.ond} className={i % 2 === 0 ? "bg-blue-50/30" : ""}>
                    <td className="py-1.5 px-2 text-center text-gray-400 font-bold text-[9px]">{row.rank}</td>
                    <td className="py-1.5 px-2 text-center font-bold text-[#005fa3]">{row.ond}</td>
                    <td className="py-1.5 px-2 text-center">{formatCurrency(row.revenue, true)}</td>
                    <td className="py-1.5 px-2 text-center"><VlyCell value={row.revVly} /></td>
                    <td className="py-1.5 px-2 text-center">{row.pax.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-center"><VlyCell value={row.paxVly} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
