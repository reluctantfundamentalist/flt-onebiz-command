"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { AirlineDataset, AirlineSnapshot, TrendlinePoint } from "@/lib/dashboard-types";
import { KPISection } from "./sections/KPISection";
import { InsightsSection } from "./sections/InsightsSection";
import { POSSection } from "./sections/POSSection";
import { RankingsSection } from "./sections/RankingsSection";
import { MonthFilter } from "./ui/MonthFilter";

const SECTIONS = ["KPIs", "Insights", "POS", "Rankings"] as const;

function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Latest month in `months` that is on or before today; falls back to the last
 *  month if every month is in the future (e.g. a brand-new year's data). */
function defaultMonth(months: string[]): string {
  if (months.length === 0) return "";
  const today = currentMonthStr();
  const pastOrCurrent = months.filter((m) => m <= today);
  if (pastOrCurrent.length > 0) return pastOrCurrent[pastOrCurrent.length - 1];
  return months[months.length - 1];
}

/** Restrict the month selector to the current calendar year (drops prior-year
 *  months like 2025-*). Falls back to the full list if no months exist for the
 *  current year. The underlying data is untouched — VLY vs prior year still
 *  resolves from the full byMonth map. */
function currentYearMonths(months: string[]): string[] {
  const yr = String(new Date().getFullYear());
  const filtered = months.filter((m) => m.startsWith(yr));
  return filtered.length > 0 ? filtered : months;
}

/** Window the trendline to the selected month ±3 calendar months (≈7 points),
 *  filtered to months that exist in the data. Adapts to whichever month is
 *  picked in the filter. */
function trendWindow(trendline: TrendlinePoint[], month: string): TrendlinePoint[] {
  if (!month) return trendline;
  const base = new Date(`${month}-01T00:00:00`);
  if (isNaN(base.getTime())) return trendline;
  const wanted = new Set<string>();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    wanted.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return trendline.filter((p) => wanted.has(p.month));
}

export function DashboardShell({ data }: { data: AirlineDataset }) {
  const [dimension, setDimension] = useState<"outbound" | "order">("outbound");
  const [month, setMonth] = useState<string>(() => defaultMonth(currentYearMonths(data.outbound.months)));

  const view = data[dimension];

  // When the dimension toggles, re-anchor the month to that dimension's default.
  function handleDimensionChange(d: "outbound" | "order") {
    setDimension(d);
    setMonth(defaultMonth(currentYearMonths(data[d].months)));
  }

  const snapshot: AirlineSnapshot | undefined = useMemo(
    () => view.byMonth[month] ?? view.byMonth[view.months[view.months.length - 1]],
    [view, month]
  );

  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActiveSection(idx);
          }
        }
      },
      { root: container, threshold: 0.6 }
    );

    for (const ref of sectionRefs.current) {
      if (ref) observer.observe(ref);
    }

    return () => observer.disconnect();
  }, []);

  function scrollToSection(idx: number) {
    sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth" });
  }

  if (!snapshot) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-gray-500">No data for the selected month.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <MonthFilter
        dimension={dimension}
        onDimensionChange={handleDimensionChange}
        month={month}
        onMonthChange={setMonth}
        months={currentYearMonths(view.months)}
      />

      {/* Mobile: scroll-snap container */}
      <div
        ref={containerRef}
        className="h-[calc(100dvh-56px-49px)] overflow-y-auto snap-y snap-mandatory lg:h-auto lg:overflow-visible lg:snap-none"
      >
        <section
          ref={(el) => { sectionRefs.current[0] = el; }}
          className="min-h-full snap-start snap-always p-4 flex flex-col justify-center lg:min-h-0 lg:snap-align-none lg:py-6"
        >
          <KPISection kpis={snapshot.kpis} currency={data.meta.currency} trendline={trendWindow(view.trendline, month)} />
        </section>

        <section
          ref={(el) => { sectionRefs.current[1] = el; }}
          className="min-h-full snap-start snap-always lg:min-h-0 lg:snap-align-none lg:py-6 lg:px-4"
        >
          <InsightsSection insights={snapshot.insights} />
        </section>

        <section
          ref={(el) => { sectionRefs.current[2] = el; }}
          className="min-h-full snap-start snap-always p-4 lg:min-h-0 lg:snap-align-none lg:py-6"
        >
          <POSSection pos={snapshot.pos} currency={data.meta.currency} />
        </section>

        <section
          ref={(el) => { sectionRefs.current[3] = el; }}
          className="min-h-full snap-start snap-always p-4 lg:min-h-0 lg:snap-align-none lg:py-6"
        >
          <RankingsSection rankings={snapshot.rankings} currency={data.meta.currency} />
        </section>
      </div>

      {/* Navigation dots (mobile only) */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 lg:hidden z-50">
        {SECTIONS.map((name, idx) => (
          <button
            key={name}
            onClick={() => scrollToSection(idx)}
            className="group relative flex items-center"
            aria-label={`Go to ${name}`}
          >
            <span
              className="absolute right-5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
            >
              {name}
            </span>
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                activeSection === idx ? "bg-[#0071c2] scale-125" : "bg-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
