"use client";

import "@/lib/chartSetup";
import { Bar } from "react-chartjs-2";

interface HorizontalBarChartProps {
  labels: string[];
  values: number[];
  formatValue?: (v: number) => string;
}

export function HorizontalBarChart({ labels, values, formatValue }: HorizontalBarChartProps) {
  return (
    <div className="relative w-full h-full">
      <Bar
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: "#0071c2",
              borderRadius: 3,
              barPercentage: 0.7,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  formatValue ? formatValue(ctx.parsed.x ?? 0) : (ctx.parsed.x ?? 0).toLocaleString(),
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { size: 9 },
                callback: (v) =>
                  formatValue ? formatValue(v as number) : (v as number).toLocaleString(),
              },
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 10, weight: "bold" } },
            },
          },
        }}
      />
    </div>
  );
}
