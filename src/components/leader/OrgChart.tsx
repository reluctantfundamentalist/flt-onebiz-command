import type { OrgSeed, OrgNode } from "@/lib/org-seed";
import type { ParticipantEdge } from "@/lib/participants";
import { normalizeName } from "@/lib/participants";

interface Props {
  seed: OrgSeed;
  edges?: ParticipantEdge[];
}

interface EdgeInfo {
  bestTrip: string;        // Trip.com name with most threads for this airline node
  totalThreads: number;
  edges: { trip: string; threads: number }[];
}

function edgesForNode(node: OrgNode, edges: ParticipantEdge[]): EdgeInfo | null {
  if (node.side !== "airline") return null;
  const key = normalizeName(node.name);
  const matched = edges.filter((e) => normalizeName(e.airline).includes(key) || key.includes(normalizeName(e.airline)));
  if (matched.length === 0) return null;
  const byTrip = new Map<string, number>();
  for (const e of matched) byTrip.set(e.trip, (byTrip.get(e.trip) ?? 0) + e.threads);
  const sorted = Array.from(byTrip.entries()).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, n]) => s + n, 0);
  return {
    bestTrip: sorted[0][0],
    totalThreads: total,
    edges: sorted.map(([trip, threads]) => ({ trip, threads })),
  };
}

export default function OrgChart({ seed, edges = [] }: Props) {
  const airline = seed.nodes.filter((n) => n.side === "airline");
  const trip = seed.nodes.filter((n) => n.side === "trip");

  // Compute activity for each airline node (thread count)
  const activityByNode = new Map<string, EdgeInfo>();
  for (const n of airline) {
    const info = edgesForNode(n, edges);
    if (info) activityByNode.set(n.id, info);
  }
  const maxActivity = Math.max(1, ...Array.from(activityByNode.values()).map((i) => i.totalThreads));

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink)]">
          Airline reporting chain
        </span>
        <span className="text-[11px] text-[var(--ink-faint)]">
          — activity weighted by last-90-day thread count
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
          <span className="text-[10px] text-[var(--ink-faint)]">Trip.com counterpart</span>
        </div>
      </div>

      <div className="p-4">
        <ColumnTree
          nodes={airline}
          allNodes={airline}
          activityByNode={activityByNode}
          maxActivity={maxActivity}
        />
      </div>

      {/* Trip.com side — compact strip */}
      <div className="border-t border-[var(--line)] bg-[var(--bg)] px-4 py-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-dark)]">
          Trip.com side
        </div>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {trip
            .slice()
            .sort((a, b) => sortByLevel(a) - sortByLevel(b))
            .map((n, i) => (
              <span key={n.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-[11px] text-[var(--ink-faint)]">→</span>}
                <span className="rounded-md bg-white px-2 py-1 text-[11px] text-[var(--ink-soft)] ring-1 ring-[var(--brand-soft)]">
                  <span className="font-semibold text-[var(--ink)]">{n.name.split(" ")[0]}</span>
                  <span className="text-[var(--ink-faint)]"> · {n.title.split(",")[0]}</span>
                </span>
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

function sortByLevel(n: OrgNode): number {
  return n.level === "global" ? 0 : n.level === "regional" ? 1 : 2;
}

function ColumnTree({
  nodes,
  allNodes,
  activityByNode,
  maxActivity,
}: {
  nodes: OrgNode[];
  allNodes: OrgNode[];
  activityByNode: Map<string, EdgeInfo>;
  maxActivity: number;
}) {
  const roots = nodes.filter((n) => !n.parentId);
  // Sort roots by activity descending so hot nodes come first
  roots.sort((a, b) => (activityByNode.get(b.id)?.totalThreads ?? 0) - (activityByNode.get(a.id)?.totalThreads ?? 0));
  return (
    <div className="space-y-1.5">
      {roots.map((r) => (
        <OrgNodeCard
          key={r.id}
          node={r}
          allNodes={allNodes}
          depth={0}
          activityByNode={activityByNode}
          maxActivity={maxActivity}
        />
      ))}
    </div>
  );
}

function OrgNodeCard({
  node,
  allNodes,
  depth,
  activityByNode,
  maxActivity,
}: {
  node: OrgNode;
  allNodes: OrgNode[];
  depth: number;
  activityByNode: Map<string, EdgeInfo>;
  maxActivity: number;
}) {
  const children = allNodes
    .filter((n) => n.parentId === node.id)
    .sort((a, b) => (activityByNode.get(b.id)?.totalThreads ?? 0) - (activityByNode.get(a.id)?.totalThreads ?? 0));
  const info = activityByNode.get(node.id);
  const activity = info?.totalThreads ?? 0;
  const heat = activity / maxActivity;                // 0..1
  const activityBg = heatToBg(heat);
  const activityLabel = activity > 0 ? `${activity} thread${activity === 1 ? "" : "s"}` : "";

  return (
    <div style={{ marginLeft: depth * 20 }} className="relative">
      {depth > 0 && (
        <>
          <span className="absolute -left-[11px] top-0 h-1/2 w-px bg-[var(--line)]" />
          <span className="absolute -left-[11px] top-1/2 h-px w-2.5 bg-[var(--line)]" />
        </>
      )}

      <div
        className="flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-[var(--bg)]"
        style={{ borderColor: heat > 0.5 ? "#ea580c" : "var(--line)", background: activityBg }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
          style={{ background: heat > 0 ? `rgba(234, 88, 12, ${0.4 + heat * 0.6})` : "#94a3b8" }}
        >
          {node.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-[var(--ink)]">
            {node.name}
          </div>
          <div className="truncate text-[11px] text-[var(--ink-soft)]">{node.title}</div>
        </div>
        {node.market && (
          <span className="hidden shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-[var(--ink-soft)] sm:inline">
            {node.market}
          </span>
        )}
        {info && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
            title={info.edges.map((e) => `${e.trip}: ${e.threads}`).join(" · ")}
          >
            ● {info.bestTrip.split(" ")[0]}
          </span>
        )}
        {activityLabel && (
          <span
            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: "#fff7ed", color: "#c2410c" }}
          >
            {activityLabel}
          </span>
        )}
      </div>

      {children.length > 0 && (
        <div className="mt-1.5 space-y-1.5">
          {children.map((c) => (
            <OrgNodeCard
              key={c.id}
              node={c}
              allNodes={allNodes}
              depth={depth + 1}
              activityByNode={activityByNode}
              maxActivity={maxActivity}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function heatToBg(heat: number): string {
  if (heat < 0.15) return "white";
  const alpha = Math.min(0.18, 0.06 + heat * 0.12);
  return `rgba(255, 106, 61, ${alpha})`;   // very light coral for hot nodes
}
