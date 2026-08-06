"use client";
import { useState } from "react";
import { AIRLINE_BRANDS, type AirlineName } from "@/lib/accounts";

// ── Data model ──

interface StakeholderNode {
  id: string;
  name: string;
  role: string;
  org: string;
  level: "global" | "regional" | "local";
  parent: string | null;
  market: string;
}

interface Activity {
  date: string;
  description: string;
  commercialValue?: string;
  stakeholder: string;
  type: "initiative" | "meeting" | "deal" | "bottleneck" | "update";
}

interface Bottleneck {
  label: string;
  severity: "high" | "med" | "low";
  team: string;
  lastUpdate: string;
  owner: string;
}

// ── Per-airline stakeholder data (prototype — Emirates as the full example) ──

const STAKEHOLDER_DATA: Record<string, {
  nodes: StakeholderNode[];
  activities: Activity[];
  bottlenecks: Bottleneck[];
}> = {
  "Emirates Airline": {
    nodes: [
      // Airline side — global
      { id: "ek-cco", name: "Adnan Kazim", role: "Chief Commercial Officer", org: "Emirates", level: "global", parent: null, market: "Global" },
      { id: "ek-vp-b2b", name: "Dina Al Herais", role: "VP Commercial Products B2B (Corporate & Leisure)", org: "Emirates", level: "global", parent: "ek-cco", market: "Global" },
      { id: "ek-contract", name: "Rehab Mansoor", role: "Contract Owner & Commercial Manager", org: "Emirates", level: "global", parent: "ek-vp-b2b", market: "Global" },
      { id: "ek-ndc", name: "Ahmed Al Ali", role: "Head of NDC & Distribution", org: "Emirates", level: "global", parent: "ek-vp-b2b", market: "Global" },
      // Airline side — regional
      { id: "ek-me", name: "Mohammed Al Hashemi", role: "Regional Manager — Middle East", org: "Emirates", level: "regional", parent: "ek-vp-b2b", market: "GMEI" },
      { id: "ek-asia", name: "Sarah Ng", role: "Regional Manager — Far East & Asia", org: "Emirates", level: "regional", parent: "ek-vp-b2b", market: "Far East" },
      { id: "ek-eu", name: "Thomas Berg", role: "Regional Manager — Europe", org: "Emirates", level: "regional", parent: "ek-vp-b2b", market: "Europe" },
      // Airline side — local
      { id: "ek-uae", name: "Fatima Al Marri", role: "UAE Country Manager", org: "Emirates", level: "local", parent: "ek-me", market: "UAE" },
      { id: "ek-sg", name: "David Lim", role: "Singapore Country Manager", org: "Emirates", level: "local", parent: "ek-asia", market: "Singapore" },
      { id: "ek-uk", name: "James Wright", role: "UK Country Manager", org: "Emirates", level: "local", parent: "ek-eu", market: "United Kingdom" },
      // Trip.com side
      { id: "trip-rd", name: "Kirk Wong", role: "Regional Airline Director — EK", org: "Trip.com", level: "global", parent: null, market: "Global" },
      { id: "trip-bd-singapore", name: "Shrey Nayar", role: "BD Manager — UAE/MENA", org: "Trip.com", level: "local", parent: "trip-rd", market: "UAE" },
      { id: "trip-bd-india", name: "Anuj Bansal", role: "BD — Airline Partnerships", org: "Trip.com", level: "local", parent: "trip-rd", market: "India/UAE" },
      { id: "trip-mkt", name: "Marketing Ops", role: "Campaign Execution & ROI Tracking", org: "Trip.com", level: "regional", parent: "trip-rd", market: "Global" },
      { id: "trip-finance", name: "Finance Ops", role: "Fund Hub Routing & Settlements", org: "Trip.com", level: "global", parent: null, market: "Global" },
    ],
    activities: [
      { date: "2026-07-25", description: "Q2 incentive payout confirmed — $1.95M total (incentive + booster)", commercialValue: "$1.95M", stakeholder: "ek-contract", type: "deal" },
      { date: "2026-07-20", description: "EU POO Sep booster: ticketed 2,150 True OD Pax vs 715 base — on track for slab 2", commercialValue: "~$43K projected", stakeholder: "trip-bd-singapore", type: "initiative" },
      { date: "2026-07-15", description: "EGW wastage flagged at 8% — GDS abuse issue in Far East points of sale", stakeholder: "ek-ndc", type: "bottleneck" },
      { date: "2026-07-10", description: "Q3 marketing plan submitted for Carrier approval — FE POO campaign", commercialValue: "$125K budget", stakeholder: "trip-mkt", type: "initiative" },
      { date: "2026-07-05", description: "Student fare exclusion reducing Q2-Q4 payout base — data reconciliation with revenue accounting", stakeholder: "ek-contract", type: "update" },
      { date: "2026-06-28", description: "Premium Booster: Q1 payout $98K (0.60% on F/J Flex/Flex Plus flown)", commercialValue: "$98K", stakeholder: "trip-finance", type: "deal" },
      { date: "2026-06-20", description: "Quarterly business review: EK Global team at Trip.com Dubai office", stakeholder: "ek-vp-b2b", type: "meeting" },
      { date: "2026-06-15", description: "China Destination Booster: ticketed volume tracking at 9,800 pax — slab 2 triggered", commercialValue: "$20/pax", stakeholder: "trip-bd-india", type: "update" },
      { date: "2026-06-01", description: "FY26-27 early negotiation kick-off — EK signals 8% threshold uplift for next cycle", stakeholder: "trip-rd", type: "meeting" },
      { date: "2026-05-15", description: "Marketing campaign ROI report: FE POO booster campaign achieved 11.2:1 ROI", commercialValue: "11.2:1 ROI", stakeholder: "trip-mkt", type: "update" },
    ],
    bottlenecks: [
      { label: "EGW wastage at 8% — GDS abuse, deducting from incentive", severity: "high", team: "NDC", lastUpdate: "2026-07-15", owner: "ek-ndc" },
      { label: "Student fare exclusion reducing payout base (Q2-Q4)", severity: "med", team: "Ops", lastUpdate: "2026-07-05", owner: "ek-contract" },
      { label: "China Destination: 14-day reporting lag on ticketed volume", severity: "low", team: "Marketing", lastUpdate: "2026-06-15", owner: "trip-mkt" },
    ],
  },
  // Default: generic data for other airlines
  default: {
    nodes: [
      { id: "al-cco", name: "CCO", role: "Chief Commercial Officer", org: "Airline", level: "global", parent: null, market: "Global" },
      { id: "al-vp", name: "VP Distribution", role: "VP Distribution & Partnerships", org: "Airline", level: "global", parent: "al-cco", market: "Global" },
      { id: "al-regional", name: "Regional Manager", role: "Regional Manager", org: "Airline", level: "regional", parent: "al-vp", market: "MENA" },
      { id: "trip-rd-gen", name: "Regional BD Director", role: "Regional Airline Director", org: "Trip.com", level: "global", parent: null, market: "Global" },
      { id: "trip-bd-gen", name: "BD Manager", role: "BD Manager", org: "Trip.com", level: "local", parent: "trip-rd-gen", market: "Local" },
    ],
    activities: [
      { date: "2026-07-20", description: "Q3 planning underway — contract renewal discussions", stakeholder: "trip-rd-gen", type: "update" },
      { date: "2026-07-01", description: "Quarterly review meeting with airline commercial team", stakeholder: "al-vp", type: "meeting" },
    ],
    bottlenecks: [
      { label: "Contract data pending — awaiting agreement upload", severity: "med", team: "BD", lastUpdate: "2026-07-29", owner: "trip-bd-gen" },
    ],
  },
};

interface Props {
  airline: AirlineName;
}

export default function StakeholderMap({ airline }: Props) {
  const data = STAKEHOLDER_DATA[airline] || STAKEHOLDER_DATA["default"];
  const brand = AIRLINE_BRANDS[airline] || AIRLINE_BRANDS["Emirates Airline"];
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const filteredActivities = selectedNode
    ? data.activities.filter((a) => a.stakeholder === selectedNode)
    : data.activities;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Org Chart */}
      <div className="lg:col-span-1">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--ink)]">Organization Chart</h3>
          <div className="space-y-0 text-sm">
            {buildTree(data.nodes).map((node, i) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                isLast={i === buildTree(data.nodes).length - 1}
                selected={selectedNode === node.id}
                onSelect={setSelectedNode}
                brand={brand.primary}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
            <span className="rounded-md bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--brand-dark)]">
              {airline.split(" ")[0]}
            </span>
            <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700">
              Trip.com
            </span>
          </div>
        </div>
      </div>

      {/* Activities + Bottlenecks */}
      <div className="space-y-5 lg:col-span-2">
        {/* Activities */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Latest Activities{selectedNode ? " (filtered)" : ""}
            </h3>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[11px] font-medium text-[var(--brand)] hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="space-y-3">
            {filteredActivities.map((a, i) => (
              <ActivityCard key={i} activity={a} nodes={data.nodes} brand={brand.primary} />
            ))}
            {filteredActivities.length === 0 && (
              <p className="text-xs text-[var(--ink-faint)]">No activities for this stakeholder.</p>
            )}
          </div>
        </div>

        {/* Bottlenecks */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--ink)]">Key Bottlenecks</h3>
          <ul className="space-y-3">
            {data.bottlenecks.map((b) => {
              const owner = data.nodes.find((n) => n.id === b.owner);
              return (
                <li key={b.label} className="flex items-start gap-3 rounded-lg border border-[var(--line)] p-3">
                  <span
                    className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background:
                        b.severity === "high" ? "var(--bad)" : b.severity === "med" ? "var(--warn)" : "var(--ink-faint)",
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--ink)]">{b.label}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-faint)]">
                      <span className="rounded bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--brand-dark)]">
                        {b.team}
                      </span>
                      <span>Last update: {b.lastUpdate}</span>
                      {owner && (
                        <span
                          className="cursor-pointer font-medium underline"
                          onClick={() => setSelectedNode(b.owner)}
                        >
                          Owner: {owner.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      background: b.severity === "high" ? "#fef2f2" : b.severity === "med" ? "#fffbeb" : "#f8fafc",
                      color: b.severity === "high" ? "var(--bad)" : b.severity === "med" ? "var(--warn)" : "var(--ink-faint)",
                    }}
                  >
                    {b.severity.toUpperCase()}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Tree helpers ──

function buildTree(nodes: StakeholderNode[]): StakeholderNode[] {
  return nodes.filter((n) => n.parent === null);
}

function getChildren(nodes: StakeholderNode[], parentId: string): StakeholderNode[] {
  return nodes.filter((n) => n.parent === parentId);
}

const DEPTH_MAP: Record<number, string> = {
  0: "",
  1: "ml-4 border-l border-[var(--line)] pl-3",
  2: "ml-8 border-l border-[var(--line)] pl-3",
  3: "ml-12 border-l border-[var(--line)] pl-3",
};

function TreeNode({
  node,
  depth,
  isLast,
  selected,
  onSelect,
  brand,
}: {
  node: StakeholderNode;
  depth: number;
  isLast: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  brand: string;
}) {
  const children = getChildren(STAKEHOLDER_DATA["Emirates Airline"]?.nodes || [], node.id);
  // Look up children from whatever data set is in scope — simplified for prototype
  const allNodes = Object.values(STAKEHOLDER_DATA).flatMap((d) => d.nodes);
  const childNodes = allNodes.filter((n) => n.parent === node.id);

  const orgColor =
    node.org === "Trip.com" ? "bg-orange-50 text-orange-700" : "bg-[var(--brand-soft)] text-[var(--brand-dark)]";

  return (
    <div className={depth > 0 ? DEPTH_MAP[depth] || "ml-12 border-l border-[var(--line)] pl-3" : ""}>
      <button
        onClick={() => onSelect(node.id)}
        className={`my-1 w-full rounded-lg px-3 py-2 text-left transition ${
          selected
            ? "border-2 border-[var(--brand)] bg-[var(--brand-soft)]"
            : "border border-transparent hover:bg-[var(--bg)]"
        }`}
      >
        <div className="text-xs font-medium text-[var(--ink)]">{node.name}</div>
        <div className="text-[10px] text-[var(--ink-faint)]">{node.role}</div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${orgColor}`}>
            {node.org}
          </span>
          <span className="text-[9px] text-[var(--ink-faint)]">{node.market}</span>
        </div>
      </button>
      {childNodes.map((child, i) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          isLast={i === childNodes.length - 1}
          selected={selected}
          onSelect={onSelect}
          brand={brand}
        />
      ))}
    </div>
  );
}

// ── Activity card ──

const TYPE_COLORS: Record<string, string> = {
  deal: "bg-green-50 text-green-700",
  initiative: "bg-purple-50 text-purple-700",
  meeting: "bg-blue-50 text-blue-700",
  bottleneck: "bg-red-50 text-red-700",
  update: "bg-gray-100 text-gray-600",
};

function ActivityCard({
  activity,
  nodes,
  brand,
}: {
  activity: Activity;
  nodes: StakeholderNode[];
  brand: string;
}) {
  const person = nodes.find((n) => n.id === activity.stakeholder);
  return (
    <div className="flex gap-3 rounded-lg border border-[var(--line)] p-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ backgroundColor: brand }}
      >
        {person ? person.name.split(" ").map((p) => p[0]).slice(0, 2).join("") : "??"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[var(--ink)]">{activity.description}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--ink-faint)]">
          <span>{activity.date}</span>
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${TYPE_COLORS[activity.type] || "bg-gray-100 text-gray-600"}`}>
            {activity.type}
          </span>
          {person && <span>· {person.name}</span>}
          {activity.commercialValue && (
            <span className="ml-auto font-medium text-[var(--good)]">{activity.commercialValue}</span>
          )}
        </div>
      </div>
    </div>
  );
}
