import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listUpdates, writeUpdates, type UpdateRecord } from "@/lib/store";
import { findUser, findAccount } from "@/lib/users";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const user = findUser(session.uid);
  if (!user) {
    return NextResponse.json({ error: "unknown user" }, { status: 401 });
  }
  const body = (await req.json()) as {
    accountIata: string;
    scope: "global" | "local";
    market?: string;
    meetingDate?: string;
    headline: string;
    detail?: string;
    nextStep?: string;
  };

  const account = findAccount(body.accountIata);
  if (!account) {
    return NextResponse.json({ error: "invalid account" }, { status: 400 });
  }
  if (!body.headline?.trim()) {
    return NextResponse.json({ error: "headline required" }, { status: 400 });
  }

  const isChild = account.ownerId !== user.id;
  const now = new Date().toISOString();

  const record: UpdateRecord = {
    id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    accountIata: account.iata,
    createdBy: user.id,
    createdAt: now,
    scope: body.scope ?? "global",
    market: body.market?.trim() || undefined,
    meetingDate: body.meetingDate || undefined,
    bd: isChild ? account.ownerId : user.id,
    headline: body.headline.trim(),
    detail: body.detail?.trim() || "",
    nextStep: body.nextStep?.trim() || undefined,
    isChild,
    parentOwner: isChild ? account.ownerId : undefined,
  };

  const all = await listUpdates();
  all.unshift(record);
  await writeUpdates(all);

  return NextResponse.json({ ok: true, id: record.id });
}
