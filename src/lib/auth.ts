import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./settings";

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

/** Identitas admin dalam token: email + role (super|admin). */
type AdminToken = { email: string; role: "super" | "admin" };

function makeToken(id: AdminToken): string {
  const payload = `${Buffer.from(JSON.stringify(id)).toString("base64url")}.${Date.now() + MAX_AGE * 1000}`;
  return `admin.${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): AdminToken | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [role, encoded, exp, sig] = parts;
  const payload = `${encoded}.${exp}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (role !== "admin" || Number(exp) <= Date.now()) return null;
  try {
    const id = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AdminToken;
    if (!id?.email) return null;
    return id;
  } catch {
    return null;
  }
}

/** Kredensial super admin dari env (selalu bisa login). */
function envAdmin(): { email: string; password: string } {
  return {
    email: (process.env.ADMIN_EMAIL || process.env.ADMIN_USER || "admin@jajanakun.store").trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "admin123",
  };
}

/**
 * Cek kredensial login admin.
 *  - Super admin: cocokkan dengan env ADMIN_EMAIL/ADMIN_PASSWORD.
 *  - Admin biasa: cek tabel `admins` (password di-hash scrypt).
 * Mengembalikan identitas admin bila valid, atau null.
 */
export async function checkCredentialsAsync(email: string, pass: string): Promise<AdminToken | null> {
  const em = email.trim().toLowerCase();
  const env = envAdmin();
  if (em === env.email && pass === env.password) {
    return { email: env.email, role: "super" };
  }
  const row = await prisma.admin.findUnique({ where: { email: em } });
  if (row && row.active && verifyPassword(pass, row.passwordHash)) {
    return { email: row.email, role: row.isSuper ? "super" : "admin" };
  }
  return null;
}

export async function createSession(id: AdminToken): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, makeToken(id), {
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
  return readToken(store.get(COOKIE)?.value) !== null;
}

/** Identitas admin yang sedang login (email + role), atau null. */
export async function currentAdmin(): Promise<AdminToken | null> {
  const store = await cookies();
  return readToken(store.get(COOKIE)?.value);
}

/** true bila admin yang login adalah super admin (dari env). */
export async function isSuperAdmin(): Promise<boolean> {
  return (await currentAdmin())?.role === "super";
}

/** Pastikan super admin ada di tabel `admins` (seed dari env, sekali). */
export async function ensureSuperAdmin(): Promise<void> {
  const env = envAdmin();
  const existing = await prisma.admin.findUnique({ where: { email: env.email } });
  if (existing) {
    if (!existing.isSuper) {
      await prisma.admin.update({ where: { email: env.email }, data: { isSuper: true, active: true } });
    }
    return;
  }
  await prisma.admin.create({
    data: {
      email: env.email,
      name: "Admin Utama",
      passwordHash: hashPassword(env.password),
      isSuper: true,
      active: true,
    },
  });
}
