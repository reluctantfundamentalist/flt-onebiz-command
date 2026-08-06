import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUser } from "@/lib/users";
import { issueSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { userId, password } = (await req.json()) as { userId: string; password: string };
  const user = findUser(userId);
  if (!user) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }
  const token = await issueSession({ uid: user.id, name: user.name, role: user.role });
  await setSessionCookie(token);
  return NextResponse.json({ uid: user.id, name: user.name, role: user.role });
}
