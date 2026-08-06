// JWT auth using jose — cookie-based, HttpOnly, 12h TTL. Pattern lifted
// from trippy-analytics. Secret comes from AUTH_SECRET env var; a dev
// fallback exists but the real secret is set in Vercel per environment.

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./users";

const COOKIE_NAME = "obiz_cmd_session";
const TTL_SECONDS = 60 * 60 * 12; // 12h

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET ?? "dev-secret-do-not-use-in-prod";
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  uid: string;
  name: string;
  role: Role;
}

export async function issueSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      uid: String(payload.uid),
      name: String(payload.name),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export const SESSION_COOKIE = COOKIE_NAME;
