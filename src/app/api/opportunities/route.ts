import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listOpportunities,
  writeOpportunities,
  type OpportunityRecord,
  type OpportunityStatus,
  type OpportunityPriority,
} from "@/lib/store";
import { findUser, findAccount } from "@/lib/users";
import { suggestThemes } from "@/lib/themes";

type Body =
  | { action: "status"; id: string; status: OpportunityStatus }
  | { action: "priority"; id: string; priority: OpportunityPriority }
  | { action: "dismiss"; id: string }
  | { action: "link"; id: string; contractIata: string | null }
  | {
      action: "promote";
      accountIata: string;
      title: string;
      detail?: string;
      kind: "opportunity" | "threat";
      source: string;
      valueUsd?: number | null;
      sourceUpdateId?: string;
      priority?: OpportunityPriority;
    };

const STATUSES: OpportunityStatus[] = ["open", "won", "lost", "stalled"];
const PRIORITIES: OpportunityPriority[] = ["high", "medium", "low"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const user = findUser(session.uid);
  if (!user) {
    return NextResponse.json({ error: "unknown user" }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const all = await listOpportunities();
  const now = new Date().toISOString();

  if (body.action === "status") {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    const rec = all.find((o) => o.id === body.id);
    if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
    rec.status = body.status;
    rec.statusChangedAt = now; // dwell chip restarts on every stage change
    await writeOpportunities(all);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "priority") {
    if (!PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: "invalid priority" }, { status: 400 });
    }
    const rec = all.find((o) => o.id === body.id);
    if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
    rec.priority = body.priority;
    await writeOpportunities(all);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "dismiss") {
    const next = all.filter((o) => o.id !== body.id);
    await writeOpportunities(next);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "link") {
    const rec = all.find((o) => o.id === body.id);
    if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (body.contractIata !== null && !findAccount(body.contractIata)) {
      return NextResponse.json({ error: "invalid contract account" }, { status: 400 });
    }
    rec.contractIata = body.contractIata ?? undefined;
    await writeOpportunities(all);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "promote") {
    const account = findAccount(body.accountIata);
    if (!account || !body.title?.trim()) {
      return NextResponse.json({ error: "invalid promote payload" }, { status: 400 });
    }
    const themes = suggestThemes(`${body.title} ${body.detail ?? ""}`);
    const record: OpportunityRecord = {
      id: `o_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      accountIata: account.iata,
      kind: body.kind,
      title: body.title.trim(),
      detail: body.detail?.trim() || undefined,
      themes,
      status: "open",
      statusChangedAt: now,
      confidence: "low",
      priority: body.priority ?? "medium",
      valueUsd: body.valueUsd ?? null,
      nextAction: null,
      ownerBdId: account.ownerId,
      source: body.source || "manual",
      createdAt: now,
      sourceUpdateId: body.sourceUpdateId || undefined,
    };
    all.unshift(record);
    await writeOpportunities(all);
    return NextResponse.json({ ok: true, id: record.id });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
