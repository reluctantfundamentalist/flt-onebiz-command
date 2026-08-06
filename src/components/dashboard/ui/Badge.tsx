import { formatPercent } from "@/lib/format";

export function Badge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
        isPositive
          ? "bg-green-50 text-green-600"
          : "bg-red-50 text-red-600"
      }`}
    >
      {isPositive ? "▲" : "▼"} {formatPercent(value)}
    </span>
  );
}
