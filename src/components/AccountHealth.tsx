"use client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { ACCOUNT, AIRLINE_KPIS, type AirlineAccountData } from "@/lib/data";
import { AIRLINE_BRANDS, type AirlineName } from "@/lib/accounts";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

interface Props {
  airline: AirlineName;
}

export default function AccountHealth({ airline }: Props) {
  const data = AIRLINE_KPIS[airline];
  const brand = AIRLINE_BRANDS[airline];

  // Default to Egypt Air account data if no per-airline KPIs available
  const accountData = data;

  return (
    <div className="space-y-5">
      {/* KPI Row — adapted from trippy-analytics pattern */}
      {accountData && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard kpi={accountData.revenue} brand={brand.primary} />
            <KpiCard kpi={accountData.ondPax} brand={brand.primary} />
            <KpiCard kpi={accountData.atv} brand={brand.primary} />
            <KpiCard kpi={accountData.premiumCabin} brand={brand.primary} />
          </div>

          {/* Quarterly Chart */}
          <div className="rounded-xl border border-[var(--line)] bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-[var(--ink)]">
              Revenue vs Target — Quarterly
            </h3>
            <div className="h-64">
              <Bar
                data={{
                  labels: accountData.quarters.map((q) => q.q),
                  datasets: [
                    {
                      label: "Revenue Actual (USD)",
                      data: accountData.quarters.map((q) => q.revenue / 1_000_000),
                      backgroundColor: brand.primary,
                      borderRadius: 6,
                    },
                    {
                      label: "Contracted Target (USD)",
                      data: accountData.quarters.map((q) => q.target / 1_000_000),
                      backgroundColor: "#e2e8f0",
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom" as const, labels: { boxWidth: 10, font: { size: 11 } } },
                    tooltip: { callbacks: { label: (c: any) => ` $${c.parsed.y.toFixed(2)}M` } },
                  },
                  scales: {
                    y: {
                      ticks: { callback: (v: any) => `$${v}M`, font: { size: 10 } },
                      grid: { color: "#eef2f7" },
                    },
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                  },
                }}
              />
            </div>
          </div>

          {/* Bottlenecks + Stakeholders */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--line)] bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">Key Bottlenecks</h3>
              <ul className="space-y-2">
                {accountData.bottlenecks.map((b) => (
                  <li key={b.label} className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background:
                          b.severity === "high" ? "var(--bad)" : b.severity === "med" ? "var(--warn)" : "var(--ink-faint)",
                      }}
                    />
                    {b.label}
                    <span className="ml-auto shrink-0 rounded bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--brand-dark)]">
                      {b.team}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">Stakeholder Map</h3>
              <ul className="space-y-2">
                {accountData.stakeholders.map((s) => (
                  <li key={s.name} className="flex items-start gap-3 text-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand-dark)]">
                      {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--ink)]">{s.name}</div>
                      <div className="text-xs text-[var(--ink-faint)]">{s.role}</div>
                    </div>
                    <span className="ml-auto text-[10px] text-[var(--ink-faint)]">{s.market}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Account Tree */}
          <div className="rounded-xl border border-[var(--line)] bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">Account Tree</h3>
            <div className="text-sm">
              <div className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-medium text-[var(--ink)]">
                {airline} (Global)
              </div>
              <div className="ml-3 border-l border-[var(--line)] pl-4">
                <div className="py-1 text-[var(--ink-soft)]">Local Markets</div>
                <div className="ml-3 border-l border-[var(--line)] pl-4">
                  <div className="py-1 text-[var(--ink-soft)]">UAE / MENA scope</div>
                  <div className="py-1 text-[var(--ink-soft)]">APAC scope</div>
                  <div className="py-1 text-[var(--ink-soft)]">Europe origin scope</div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-[var(--ink-faint)]">
                Global vs local preserved; instruments roll up here. Full detail in Stakeholder Map tab.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Fallback: no data for this airline */}
      {!accountData && (
        <FallbackView airline={airline} />
      )}
    </div>
  );
}

// ── KPI Card with sparkline (trippy-analytics pattern) ──

function KpiCard({ kpi, brand }: { kpi: AirlineAccountData["revenue"]; brand: string }) {
  const maxSpark = Math.max(...kpi.spark, 1);
  const minSpark = Math.min(...kpi.spark);
  const range = maxSpark - minSpark || 1;

  // Build SVG polygon points for a sparkline
  const width = 120;
  const height = 32;
  const padding = 2;
  const points = kpi.spark.map((v, i) => {
    const x = padding + (i / (kpi.spark.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - minSpark) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const momColor = kpi.mom >= 0 ? "var(--good)" : "var(--bad)";
  const momSymbol = kpi.mom >= 0 ? "▲" : "▼";

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div
        className="mb-2 rounded-md px-2 py-0.5 text-[10px] font-medium text-white"
        style={{ backgroundColor: brand, display: "inline-block" }}
      >
        {kpi.label}
      </div>
      <div className="text-xl font-semibold text-[var(--ink)]">{kpi.value}</div>
      <div className="text-[11px] text-[var(--ink-faint)]">{kpi.sub}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[11px] font-medium" style={{ color: momColor }}>
          {momSymbol} {Math.abs(kpi.mom).toFixed(1)}% MoM
        </span>
      </div>
      <svg className="mt-1.5" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polygon
          points={points.join(" ")}
          fill="none"
          stroke={brand}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function FallbackView({ airline }: { airline: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg)] text-2xl">
        📈
      </div>
      <h3 className="text-lg font-semibold text-[var(--ink)]">Account Health data pending</h3>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Metrics and KPI data for {airline} will be loaded when supplied.
        <br />
        The data model is ready — actual numbers can be dropped in at any time.
      </p>
    </div>
  );
}
