"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

interface TrendlineChartProps {
  labels: string[];
  values: number[];
  formatValue?: (v: number) => string;
}

export function TrendlineChart({ labels, values, formatValue }: TrendlineChartProps) {
  return (
    <div className="relative w-full h-full">
      <Line
        data={{
          labels,
          datasets: [
            {
              data: values,
              borderColor: "#0071c2",
              backgroundColor: "rgba(0, 113, 194, 0.08)",
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: "#0071c2",
              tension: 0.3,
              fill: true,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  formatValue ? formatValue(ctx.parsed.y ?? 0) : `$${(ctx.parsed.y ?? 0).toLocaleString()}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 } },
            },
            y: {
              grid: { color: "rgba(0,0,0,0.04)" },
              ticks: {
                font: { size: 9 },
                callback: (v) =>
                  formatValue ? formatValue(v as number) : `$${((v as number) / 1000).toFixed(0)}K`,
              },
            },
          },
        }}
      />
    </div>
  );
}
