import "server-only";
import { cookies } from "next/headers";
import { env } from "@/shared/config/env";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(env.SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(env.SESSION_COOKIE_NAME, token, { ...cookieOptions, expires: expiresAt });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(env.SESSION_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
}
