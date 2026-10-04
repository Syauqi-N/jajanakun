import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "gk_admin";
const MAX_AGE = 60 * 60 * 12; // 12 jam

/** true kalau app dilayani lewat HTTPS (bukan localhost). */
export function secureCookies(): boolean {
  const url = process.env.NEXT_PUBLIC_APP_URL || "";
  return url.startsWith("https://");
}

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

function makeToken(): string {
  const payload = `admin.${Date.now() + MAX_AGE * 1000}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, exp, sig] = parts;
  const payload = `${role}.${exp}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return role === "admin" && Number(exp) > Date.now();
}

export function checkCredentials(email: string, pass: string): boolean {
  const e = (process.env.ADMIN_EMAIL || process.env.ADMIN_USER || "admin@jajanakun.store").trim().toLowerCase();
  const p = process.env.ADMIN_PASSWORD || "admin123";
  return email.trim().toLowerCase() === e && pass === p;
}

export async function createSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}
