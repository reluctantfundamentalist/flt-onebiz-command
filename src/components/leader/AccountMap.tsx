"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import type { Account } from "@/lib/users";
import type { AccountMetrics } from "@/lib/store";

interface Props {
  accounts: Account[];
  metrics: Record<string, AccountMetrics>;
}

const REGION_COLORS: Record<string, string> = {
  GCC: "#0b66c2",
  KSA: "#0a4f96",
  AFRICA: "#ff6a3d",
  IND: "#6d4aff",
  ME: "#0ea5a4",
  CAUCASUS: "#94a3b8",
  OTHER: "#94a3b8",
};

function fmtUsd(n: number | undefined) {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function bubbleRadius(rev: number | undefined) {
  if (!rev) return 6;
  return 6 + Math.min(18, Math.sqrt(rev / 200_000));
}

export default function AccountMap({ accounts, metrics }: Props) {
  const router = useRouter();

  return (
    <MapContainer
      center={[22, 45]}
      zoom={3}
      minZoom={2}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {accounts.map((a) => {
        const m = metrics[a.iata];
        const color = REGION_COLORS[a.region] ?? REGION_COLORS.OTHER;
        return (
          <CircleMarker
            key={a.iata}
            center={[a.lat, a.lng]}
            radius={bubbleRadius(m?.ytdFlownRevUsd)}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.7,
              weight: 1.5,
            }}
            eventHandlers={{
              click: () => router.push(`/leader/account/${a.iata}`),
            }}
          >
            <Tooltip sticky>
              <div className="min-w-[180px]">
                <div className="mb-1 font-semibold text-[13px]">
                  {a.iata} · {a.name}
                </div>
                <div className="text-[11px] text-gray-600">{a.hqCountry}</div>
                <div className="mt-1.5 space-y-0.5 text-[11px]">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">YTD Flown Rev</span>
                    <span className="font-medium">{fmtUsd(m?.ytdFlownRevUsd)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">EU-APAC Rev</span>
                    <span className="font-medium">{fmtUsd(m?.euApacRevUsd)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">NPBR</span>
                    <span className="font-medium">{fmtUsd(m?.npbrUsd)}</span>
                  </div>
                </div>
                <div className="mt-1.5 text-[10px] italic text-gray-400">Click for details</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
