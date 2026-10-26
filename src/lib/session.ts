import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma/enums";

export type SessionPayload = { userId: string; role: Role };

const COOKIE = "session";
const MAX_AGE_DAYS = 30;
const key = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_DAYS}d`)
    .sign(key);
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return { userId: payload.userId as string, role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  (await cookies()).set(COOKIE, await encrypt(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function readSession() {
  return decrypt((await cookies()).get(COOKIE)?.value);
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
