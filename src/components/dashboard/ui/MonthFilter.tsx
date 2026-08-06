"use client";

interface MonthFilterProps {
  dimension: "outbound" | "order";
  onDimensionChange: (d: "outbound" | "order") => void;
  month: string;
  onMonthChange: (m: string) => void;
  months: string[];
}

function formatMonth(m: string): string {
  const d = new Date(`${m}-01T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function MonthFilter({ dimension, onDimensionChange, month, onMonthChange, months }: MonthFilterProps) {
  return (
    <div className="sticky top-14 z-30 bg-[#EEF2F7]/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto w-full px-4 py-2 flex items-center gap-3 flex-wrap">
        {/* Dimension toggle */}
        <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5">
          <button
            onClick={() => onDimensionChange("outbound")}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
              dimension === "outbound" ? "bg-[#0071c2] text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Outbound date
          </button>
          <button
            onClick={() => onDimensionChange("order")}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
              dimension === "order" ? "bg-[#0071c2] text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Order date
          </button>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Month</span>
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0071c2]/30 cursor-pointer"
          >
            {[...months].reverse().map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[9px] text-gray-400 hidden sm:inline">
          {dimension === "outbound" ? "Travel departure month" : "Booking order month"}
        </span>
      </div>
    </div>
  );
}
