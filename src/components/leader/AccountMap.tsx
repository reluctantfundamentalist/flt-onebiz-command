"use client";
import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import type { Account, AccountRegion } from "@/lib/users";
import { findUser, ownerForRegion } from "@/lib/users";
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

// Below this zoom we draw one bubble per region; at or above it we draw accounts.
const DETAIL_ZOOM = 5;

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
    out.set(a.iata, [a.lat + idx * 0.7, a.lng + idx * 0.7]);
  }
  return out;
}

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// A person-chip marker: shows the BD's headshot from /avatars/<id>.png when one
// exists, otherwise a clean initials chip ringed in the region colour.
function ownerIcon(ownerId: string, color: string) {
  const name = findUser(ownerId)?.name ?? ownerId;
  const html =
    `<div style="position:relative;width:38px;height:38px;">` +
    `<img src="/avatars/${ownerId}.png" alt=""` +
    ` style="width:38px;height:38px;border-radius:9999px;object-fit:cover;border:2px solid ${color};box-shadow:0 1px 4px rgba(0,0,0,.25);"` +
    ` onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"/>` +
    `<span style="display:none;width:38px;height:38px;border-radius:9999px;background:#fff;border:2px solid ${color};color:#0b2447;align-items:center;justify-content:center;font-weight:600;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,.25);">${initials(name)}</span>` +
    `</div>`;
  return L.divIcon({ html, className: "", iconSize: [38, 38], iconAnchor: [19, 19] });
}

function MapEvents({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => onZoom(map.getZoom());
    map.on("zoomend", handler);
    onZoom(map.getZoom());
    return () => {
      map.off("zoomend", handler);
    };
  }, [map, onZoom]);
  return null;
}

function FlyTo({ target, zoom }: { target: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, zoom, { duration: 0.8 });
  }, [target, zoom, map]);
  return null;
}

interface RegionGroup {
  region: string;
  lat: number;
  lng: number;
  count: number;
  total: number;
}

export default function AccountMap({ accounts, metrics }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");
  const [zoom, setZoom] = useState(3);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [flyZoom, setFlyZoom] = useState(3);
  const positions = useMemo(() => declutter(accounts), [accounts]);

  const byOwner = useMemo(() => {
    const groups = new Map<string, Account[]>();
    for (const a of accounts) {
      const list = groups.get(a.ownerId) ?? [];
      list.push(a);
      groups.set(a.ownerId, list);
    }
    return [...groups.entries()];
  }, [accounts]);

  const regionGroups = useMemo<RegionGroup[]>(() => {
    const g = new Map<string, { lat: number; lng: number; count: number; total: number }>();
    for (const a of accounts) {
      const cur = g.get(a.region) ?? { lat: 0, lng: 0, count: 0, total: 0 };
      cur.lat += a.lat;
      cur.lng += a.lng;
      cur.count += 1;
      cur.total += metrics[a.iata]?.ytdFlownRevUsd ?? 0;
      g.set(a.region, cur);
    }
    return [...g.entries()].map(([region, v]) => ({
      region,
      lat: v.lat / v.count,
      lng: v.lng / v.count,
      count: v.count,
      total: v.total,
    }));
  }, [accounts, metrics]);

  const detailed = zoom >= DETAIL_ZOOM;

  function pick(iata: string) {
    setSelected(iata);
    const a = accounts.find((x) => x.iata === iata);
    if (a) {
      setFlyTarget(positions.get(a.iata) ?? [a.lat, a.lng]);
      setFlyZoom(6);
    }
  }

  function openRegion(r: RegionGroup) {
    setFlyTarget([r.lat, r.lng]);
    setFlyZoom(DETAIL_ZOOM + 1);
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
          <MapEvents onZoom={setZoom} />
          <FlyTo target={flyTarget} zoom={flyZoom} />

          {!detailed &&
            regionGroups.map((r) => {
              const owner = ownerForRegion(r.region as AccountRegion);
              const color = REGION_COLORS[r.region] ?? REGION_COLORS.OTHER;
              return (
                <Marker
                  key={r.region}
                  position={[r.lat, r.lng]}
                  icon={ownerIcon(owner, color)}
                  eventHandlers={{ click: () => openRegion(r) }}
                >
                  <Tooltip direction="top" offset={[0, -20]}>
                    <div className="text-[12px]">
                      <span className="font-semibold">{findUser(owner)?.name ?? owner}</span>
                      {" · "}{REGION_LABELS[r.region] ?? r.region}{" · "}{r.count} accounts
                      {r.total ? ` · ${fmtUsd(r.total)}` : ""}
                      <div className="mt-0.5 text-[10px] italic text-gray-400">Click to zoom in</div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}

          {detailed &&
            accounts.map((a) => {
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

        {!detailed && (
          <div className="pointer-events-none absolute right-2 top-2 z-[400] rounded-md bg-white/90 px-2 py-1 text-[10px] text-[var(--ink-faint)] shadow-sm">
            Zoom in or pick an account to see individuals
          </div>
        )}
      </div>
    </div>
  );
}
