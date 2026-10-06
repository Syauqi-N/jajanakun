import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { envAdminEmail, envAdminPassword, sessionSecret } from "./env";
import { hashPassword, safeEqual, verifyPassword } from "./password";

const COOKIE = "gk_admin";
const MAX_AGE = 60 * 60 * 12; // 12 jam

/** true kalau app dilayani lewat HTTPS (bukan localhost). */
export function secureCookies(): boolean {
  const url = process.env.NEXT_PUBLIC_APP_URL || "";
  return url.startsWith("https://");
}

/** Kunci HMAC per tujuan (admin vs user) diturunkan dari satu secret. */
export function signingKey(purpose: "admin" | "user"): Buffer {
  return crypto.createHmac("sha256", sessionSecret()).update(`gk-session:${purpose}`).digest();
}

function sign(value: string): string {
  return crypto.createHmac("sha256", signingKey("admin")).update(value).digest("hex");
}

/** Identitas admin dalam token: email + role (super|admin). */
type AdminToken = { email: string; role: "super" | "admin" };

/** Sidik jari hash password — sesi lama gugur otomatis saat password diganti. */
function passwordVersion(passwordHash: string): string {
  return crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

function makeToken(email: string, pv: string): string {
  const encoded = Buffer.from(JSON.stringify({ email, pv })).toString("base64url");
  const payload = `${encoded}.${Date.now() + MAX_AGE * 1000}`;
  return `admin.${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): { email: string; pv: string } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [kind, encoded, exp, sig] = parts;
  const payload = `${encoded}.${exp}`;
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (kind !== "admin" || Number(exp) <= Date.now()) return null;
  try {
    const id = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as { email?: string; pv?: string };
    if (!id?.email || !id.pv) return null;
    return { email: id.email, pv: id.pv };
  } catch {
    return null;
  }
}

/**
 * Cek kredensial login admin.
 *  - Super admin: cocokkan dengan env ADMIN_EMAIL/ADMIN_PASSWORD (baris DB disinkronkan).
 *  - Admin biasa: cek tabel `admins` (password di-hash scrypt).
 * Mengembalikan baris admin bila valid, atau null.
 */
export async function checkCredentialsAsync(email: string, pass: string) {
  const em = email.trim().toLowerCase();
  if (em === envAdminEmail() && safeEqual(pass, envAdminPassword())) {
    return ensureSuperAdmin();
  }
  const row = await prisma.admin.findUnique({ where: { email: em } });
  if (row && row.active && verifyPassword(pass, row.passwordHash)) return row;
  return null;
}

export async function createSession(admin: { email: string; passwordHash: string }): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, makeToken(admin.email, passwordVersion(admin.passwordHash)), {
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

/**
 * Identitas admin yang sedang login, atau null. Selalu dicek ulang ke DB:
 * admin yang dinonaktifkan, dihapus, atau diganti passwordnya langsung keluar.
 */
export async function currentAdmin(): Promise<AdminToken | null> {
  const store = await cookies();
  const token = readToken(store.get(COOKIE)?.value);
  if (!token) return null;
  const row = await prisma.admin.findUnique({ where: { email: token.email } });
  if (!row || !row.active || passwordVersion(row.passwordHash) !== token.pv) return null;
  return { email: row.email, role: row.isSuper ? "super" : "admin" };
}

export async function isAdmin(): Promise<boolean> {
  return (await currentAdmin()) !== null;
}

/** true bila admin yang login adalah super admin. */
export async function isSuperAdmin(): Promise<boolean> {
  return (await currentAdmin())?.role === "super";
}

/**
 * Pastikan super admin (dari env) ada di tabel `admins`, aktif, dan hash
 * passwordnya cocok dengan env (ganti ADMIN_PASSWORD = sesi lama gugur).
 */
export async function ensureSuperAdmin() {
  const email = envAdminEmail();
  const password = envAdminPassword();
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (!existing) {
    return prisma.admin.create({
      data: { email, name: "Admin Utama", passwordHash: hashPassword(password), isSuper: true, active: true },
    });
  }
  const passwordOk = verifyPassword(password, existing.passwordHash);
  if (existing.isSuper && existing.active && passwordOk) return existing;
  return prisma.admin.update({
    where: { email },
    data: { isSuper: true, active: true, ...(passwordOk ? {} : { passwordHash: hashPassword(password) }) },
  });
}
