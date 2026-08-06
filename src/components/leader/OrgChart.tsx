import type { OrgSeed, OrgNode } from "@/lib/org-seed";

export default function OrgChart({ seed }: { seed: OrgSeed }) {
  const airline = seed.nodes.filter((n) => n.side === "airline");
  const trip = seed.nodes.filter((n) => n.side === "trip");

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-wide">
        <div className="flex items-center gap-2">
          <span className="rounded bg-orange-50 px-2 py-1 font-bold text-orange-700">
            Airline
          </span>
          <span className="text-[var(--ink-faint)]">reporting chain</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--ink-faint)]">Trip.com counterparts</span>
          <span className="rounded bg-[var(--brand-soft)] px-2 py-1 font-bold text-[var(--brand-dark)]">
            Trip.com
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <ColumnTree nodes={airline} accent="#ea580c" bg="#fff7ed" allNodes={airline} />
        </div>
        <div>
          <ColumnTree nodes={trip} accent="#0b66c2" bg="#e8f1fb" allNodes={trip} />
        </div>
      </div>

      <p className="mt-4 text-[10px] italic text-[var(--ink-faint)]">
        Counterpart hints (◇) inferred from update participants. v1 will refresh from live message threads.
      </p>
    </div>
  );
}

function ColumnTree({
  nodes,
  accent,
  bg,
  allNodes,
}: {
  nodes: OrgNode[];
  accent: string;
  bg: string;
  allNodes: OrgNode[];
}) {
  const roots = nodes.filter((n) => !n.parentId);
  return (
    <div>
      {roots.map((r, i) => (
        <OrgNodeCard
          key={r.id}
          node={r}
          allNodes={allNodes}
          depth={0}
          accent={accent}
          bg={bg}
          isLast={i === roots.length - 1}
        />
      ))}
    </div>
  );
}

function OrgNodeCard({
  node,
  allNodes,
  depth,
  accent,
  bg,
  isLast,
}: {
  node: OrgNode;
  allNodes: OrgNode[];
  depth: number;
  accent: string;
  bg: string;
  isLast: boolean;
}) {
  const children = allNodes.filter((n) => n.parentId === node.id);
  const counterpart = allNodes.find((n) => n.counterpartOf === node.id) ?? undefined;
  const cpLabel = allNodes.find((n) => n.id === node.counterpartOf);

  const indent = depth * 24;

  return (
    <div style={{ marginLeft: indent }} className="relative">
      {depth > 0 && (
        <>
          <span
            className="absolute -left-[13px] top-0 h-full w-px"
            style={{ background: "#e2e8f0" }}
          />
          <span
            className="absolute -left-[13px] top-6 h-px w-3"
            style={{ background: "#e2e8f0" }}
          />
        </>
      )}

      <div
        className="mb-3 flex items-start gap-3 rounded-lg border p-3 shadow-sm"
        style={{ borderColor: accent, background: bg }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: accent }}
        >
          {node.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold leading-tight text-[var(--ink)]">
            {node.name}
          </div>
          <div className="mt-0.5 text-[11px] leading-tight text-[var(--ink-soft)]">
            {node.title}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[var(--ink-faint)]">
              {node.level}
            </span>
            {node.market && (
              <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[var(--ink-soft)]">
                {node.market}
              </span>
            )}
            {cpLabel && (
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-medium text-[var(--ink-soft)]"
                style={{ background: "rgba(0,0,0,0.03)" }}
              >
                ◇ {cpLabel.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {children.map((c, i) => (
        <OrgNodeCard
          key={c.id}
          node={c}
          allNodes={allNodes}
          depth={depth + 1}
          accent={accent}
          bg={bg}
          isLast={i === children.length - 1}
        />
      ))}
    </div>
  );
}
