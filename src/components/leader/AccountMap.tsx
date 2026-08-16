"use client";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import type { Account } from "@/lib/users";
import { findUser } from "@/lib/users";
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

const REGION_LABELS: Record<string, string> = {
  GCC: "GCC",
  KSA: "KSA + PK",
  AFRICA: "Africa + JO",
  IND: "India",
  ME: "Levant",
  CAUCASUS: "Caucasus",
  OTHER: "Other",
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

// Nudge markers that share a city so they don't stack exactly on top of each other.
function declutter(accounts: Account[]): Map<string, [number, number]> {
  const seen = new Map<string, number>();
  const out = new Map<string, [number, number]>();
  for (const a of accounts) {
    const key = `${a.lat.toFixed(1)},${a.lng.toFixed(1)}`;
    const idx = seen.get(key) ?? 0;
    seen.set(key, idx + 1);
    out.set(a.iata, [a.lat + idx * 0.9, a.lng + idx * 0.9]);
  }
  return out;
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 5, { duration: 0.8 });
  }, [target, map]);
  return null;
}

export default function AccountMap({ accounts, metrics }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");
  const positions = useMemo(() => declutter(accounts), [accounts]);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const byOwner = useMemo(() => {
    const groups = new Map<string, Account[]>();
    for (const a of accounts) {
      const list = groups.get(a.ownerId) ?? [];
      list.push(a);
      groups.set(a.ownerId, list);
    }
    return [...groups.entries()];
  }, [accounts]);

  function pick(iata: string) {
    setSelected(iata);
    const a = accounts.find((x) => x.iata === iata);
    if (a) setFlyTarget(positions.get(a.iata) ?? [a.lat, a.lng]);
  }

  const presentRegions = [...new Set(accounts.map((a) => a.region))];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--line)] bg-white px-3 py-2">
        <label htmlFor="account-select" className="text-[11px] font-medium text-[var(--ink-faint)]">
          Account
        </label>
        <select
          id="account-select"
          value={selected}
          onChange={(e) => pick(e.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border border-[var(--line)] bg-white px-2 text-[13px] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[#0b66c2]/30"
        >
          <option value="">Select an airline…</option>
          {byOwner.map(([ownerId, list]) => (
            <optgroup key={ownerId} label={findUser(ownerId)?.name ?? ownerId}>
              {list.map((a) => (
                <option key={a.iata} value={a.iata}>
                  {a.iata} · {a.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selected && (
          <button
            onClick={() => router.push(`/leader/account/${selected}`)}
            className="h-8 shrink-0 rounded-md bg-[#0b66c2] px-3 text-[12px] font-medium text-white hover:bg-[#0a5aa8]"
          >
            Open
          </button>
        )}
      </div>

      <div className="relative flex-1">
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
          <FlyTo target={flyTarget} />
          {accounts.map((a) => {
            const m = metrics[a.iata];
            const color = REGION_COLORS[a.region] ?? REGION_COLORS.OTHER;
            const pos = positions.get(a.iata) ?? [a.lat, a.lng];
            const isSel = selected === a.iata;
            return (
              <CircleMarker
                key={a.iata}
                center={pos}
                radius={isSel ? bubbleRadius(m?.ytdFlownRevUsd) + 3 : bubbleRadius(m?.ytdFlownRevUsd)}
                pathOptions={{
                  color: isSel ? "#111" : color,
                  fillColor: color,
                  fillOpacity: isSel ? 0.9 : 0.7,
                  weight: isSel ? 2.5 : 1.5,
                }}
                eventHandlers={{ click: () => pick(a.iata) }}
              >
                <Tooltip sticky>
                  <div className="min-w-[160px]">
                    <div className="mb-0.5 text-[13px] font-semibold">{a.iata} · {a.name}</div>
                    <div className="text-[11px] text-gray-500">{a.hqCountry} · {findUser(a.ownerId)?.name}</div>
                    <div className="mt-1 flex justify-between gap-3 text-[11px]">
                      <span className="text-gray-500">YTD Flown</span>
                      <span className="font-medium">{fmtUsd(m?.ytdFlownRevUsd)}</span>
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="pointer-events-none absolute bottom-2 left-2 z-[400] flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-white/90 px-2 py-1 shadow-sm">
          {presentRegions.map((r) => (
            <span key={r} className="flex items-center gap-1 text-[10px] text-[var(--ink-faint)]">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: REGION_COLORS[r] }} />
              {REGION_LABELS[r] ?? r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
