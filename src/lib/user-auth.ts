import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE = "gk_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
}

/* ---------------- password hashing (scrypt, tanpa dependency tambahan) ---------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (test.length !== expected.length) return false;
  return crypto.timingSafeEqual(test, expected);
}

/* ---------------- session token (signed) ---------------- */

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

function makeToken(userId: string): string {
  const payload = `${userId}.${Date.now() + MAX_AGE * 1000}`;
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  const expected = sign(`${userId}.${exp}`);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) <= Date.now()) return null;
  return userId;
}

import { secureCookies } from "./auth";

export async function createUserSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroyUserSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const userId = readToken(store.get(COOKIE)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

/* ---------------- registrasi & login ---------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export async function registerUser(params: { email: string; password: string; name?: string; wa?: string }) {
  const email = params.email.trim().toLowerCase();
  if (!isValidEmail(email)) throw new Error("Format email tidak valid.");
  if (params.password.length < 6) throw new Error("Password minimal 6 karakter.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email sudah terdaftar. Silakan masuk.");

  const user = await prisma.user.create({
    data: {
      email,
      name: params.name?.trim() || null,
      wa: params.wa?.trim() || null,
      passwordHash: hashPassword(params.password),
    },
  });
  await createUserSession(user.id);
  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Email atau password salah.");
  }
  await createUserSession(user.id);
  return user;
}

/** Buat/perbarui user dari profil Google. */
export async function upsertGoogleUser(profile: {
  googleId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  const email = profile.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl ?? existing.avatarUrl,
        name: existing.name ?? profile.name ?? null,
      },
    });
    await createUserSession(user.id);
    return user;
  }
  const user = await prisma.user.create({
    data: {
      email,
      googleId: profile.googleId,
      name: profile.name ?? null,
      avatarUrl: profile.avatarUrl ?? null,
    },
  });
  await createUserSession(user.id);
  return user;
}
