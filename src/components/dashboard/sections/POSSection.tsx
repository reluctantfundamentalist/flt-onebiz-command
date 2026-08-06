"use client";

import type { POSData } from "@/lib/dashboard-types";
import { formatCurrency } from "@/lib/format";
import { SectionHeader } from "../ui/SectionHeader";
import { HorizontalBarChart } from "../charts/HorizontalBarChart";

export function POSSection({ pos, currency }: { pos: POSData; currency: string }) {
  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <SectionHeader title="Top 10 Origin Countries" />
          <div className="h-52">
            <HorizontalBarChart
              labels={pos.topOriginCountries.map((c) => c.country)}
              values={pos.topOriginCountries.map((c) => c.revenue)}
              formatValue={(v) => formatCurrency(v, true)}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <SectionHeader title="Top 10 Destination Countries" />
          <div className="h-52">
            <HorizontalBarChart
              labels={pos.topDestCountries.map((c) => c.country)}
              values={pos.topDestCountries.map((c) => c.revenue)}
              formatValue={(v) => formatCurrency(v, true)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
