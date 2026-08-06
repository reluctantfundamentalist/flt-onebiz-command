import type { OrgSeed, OrgNode } from "@/lib/org-seed";

export default function OrgChart({ seed }: { seed: OrgSeed }) {
  const airline = seed.nodes.filter((n) => n.side === "airline");
  const trip = seed.nodes.filter((n) => n.side === "trip");

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-wide">
        <span className="rounded bg-orange-50 px-2 py-0.5 font-bold text-orange-700">Airline</span>
        <span className="rounded bg-[var(--brand-soft)] px-2 py-0.5 font-bold text-[var(--brand-dark)]">Trip.com</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Column nodes={airline} accent="#ff6a3d" bg="#fff7ed" allNodes={seed.nodes} side="airline" />
        <Column nodes={trip} accent="#0b66c2" bg="#e8f1fb" allNodes={seed.nodes} side="trip" />
      </div>
      <p className="mt-3 text-[10px] italic text-[var(--ink-faint)]">
        Counterpart relationships (◇) inferred from update participants. v1 will refresh from live message threads.
      </p>
    </div>
  );
}

function Column({
  nodes,
  accent,
  bg,
  allNodes,
  side,
}: {
  nodes: OrgNode[];
  accent: string;
  bg: string;
  allNodes: OrgNode[];
  side: "airline" | "trip";
}) {
  const roots = nodes.filter((n) => !n.parentId);
  return (
    <div className="space-y-1">
      {roots.map((r) => (
        <NodeRow key={r.id} node={r} allNodes={allNodes} depth={0} accent={accent} bg={bg} side={side} />
      ))}
    </div>
  );
}

function NodeRow({
  node,
  allNodes,
  depth,
  accent,
  bg,
  side,
}: {
  node: OrgNode;
  allNodes: OrgNode[];
  depth: number;
  accent: string;
  bg: string;
  side: "airline" | "trip";
}) {
  const children = allNodes.filter((n) => n.parentId === node.id && n.side === side);
  const counterpart = allNodes.find((n) => n.id === node.counterpartOf);

  return (
    <div style={{ marginLeft: depth * 12 }}>
      <div
        className="mb-1 flex items-center gap-2 rounded-lg border p-2"
        style={{ borderColor: accent, background: bg }}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: accent }}>
          {node.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-[var(--ink)]">{node.name}</div>
          <div className="truncate text-[10px] text-[var(--ink-faint)]">{node.title}</div>
        </div>
        {node.market && (
          <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[var(--ink-soft)]">
            {node.market}
          </span>
        )}
      </div>
      {counterpart && (
        <div className="mb-1 ml-9 text-[10px] italic text-[var(--ink-faint)]">
          ◇ {counterpart.name}
        </div>
      )}
      {children.map((c) => (
        <NodeRow key={c.id} node={c} allNodes={allNodes} depth={depth + 1} accent={accent} bg={bg} side={side} />
      ))}
    </div>
  );
}
