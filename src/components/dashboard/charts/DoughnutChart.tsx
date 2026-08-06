"use client";

import "@/lib/chartSetup";
import { Doughnut } from "react-chartjs-2";

const COLORS = ["#0071c2", "#ffbb00", "#27AE60", "#E53935", "#7B1FA2", "#FF6F00"];

interface DoughnutChartProps {
  labels: string[];
  values: number[];
  suffix?: string;
}

export function DoughnutChart({ labels, values, suffix = "%" }: DoughnutChartProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: COLORS.slice(0, values.length),
              borderWidth: 0,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "60%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 10,
                font: { size: 10 },
                padding: 8,
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.label}: ${ctx.parsed}${suffix}`,
              },
            },
          },
        }}
      />
    </div>
  );
}
