import type { OrgSeed, OrgNode } from "@/lib/org-seed";

export default function OrgChart({ seed }: { seed: OrgSeed }) {
  const airline = seed.nodes.filter((n) => n.side === "airline");
  const trip = seed.nodes.filter((n) => n.side === "trip");

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink)]">
          Airline reporting chain
        </span>
        <span className="text-[11px] text-[var(--ink-faint)]">— last-90-day activity, top-down</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
          <span className="text-[10px] text-[var(--ink-faint)]">Trip.com counterpart</span>
        </div>
      </div>

      {/* Airline column: full-width */}
      <div className="p-4">
        <ColumnTree nodes={airline} allNodes={airline} tripNodes={trip} />
      </div>

      {/* Trip.com reporting line — compact strip at the bottom */}
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
  tripNodes,
}: {
  nodes: OrgNode[];
  allNodes: OrgNode[];
  tripNodes: OrgNode[];
}) {
  const roots = nodes.filter((n) => !n.parentId);
  return (
    <div className="space-y-1.5">
      {roots.map((r) => (
        <OrgNodeCard
          key={r.id}
          node={r}
          allNodes={allNodes}
          tripNodes={tripNodes}
          depth={0}
        />
      ))}
    </div>
  );
}

function OrgNodeCard({
  node,
  allNodes,
  tripNodes,
  depth,
}: {
  node: OrgNode;
  allNodes: OrgNode[];
  tripNodes: OrgNode[];
  depth: number;
}) {
  const children = allNodes.filter((n) => n.parentId === node.id);
  const counterpart = tripNodes.find((n) => n.counterpartOf === node.id);

  return (
    <div style={{ marginLeft: depth * 20 }} className="relative">
      {depth > 0 && (
        <>
          <span className="absolute -left-[11px] top-0 h-1/2 w-px bg-[var(--line)]" />
          <span className="absolute -left-[11px] top-1/2 h-px w-2.5 bg-[var(--line)]" />
        </>
      )}

      <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-white px-3 py-2 hover:bg-[var(--bg)]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[11px] font-semibold text-[var(--brand-dark)]">
          {node.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-[var(--ink)]">
            {node.name}
          </div>
          <div className="truncate text-[11px] text-[var(--ink-soft)]">{node.title}</div>
        </div>
        {node.market && (
          <span className="hidden shrink-0 rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--ink-soft)] sm:inline">
            {node.market}
          </span>
        )}
        {counterpart && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: "var(--brand-soft)", color: "var(--brand-dark)" }}
            title={`Trip.com counterpart: ${counterpart.name}`}
          >
            ● {counterpart.name.split(" ")[0]}
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
              tripNodes={tripNodes}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
