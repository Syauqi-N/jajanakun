import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { secureCookies, signingKey } from "./auth";
import { hashPassword, verifyPassword } from "./password";
import { clip } from "./request";

export { hashPassword, verifyPassword };

const COOKIE = "gk_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

/* ---------------- session token (signed) ---------------- */

function sign(value: string): string {
  return crypto.createHmac("sha256", signingKey("user")).update(value).digest("hex");
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
  return email.length <= 254 && EMAIL_RE.test(email);
}

export async function registerUser(params: { email: string; password: string; name?: string; wa?: string }) {
  const email = params.email.trim().toLowerCase();
  if (!isValidEmail(email)) throw new Error("Format email tidak valid.");
  if (params.password.length < 8) throw new Error("Password minimal 8 karakter.");
  if (params.password.length > 200) throw new Error("Password terlalu panjang.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email sudah terdaftar. Silakan masuk.");

  const user = await prisma.user.create({
    data: {
      email,
      name: clip(params.name, 100) || null,
      wa: clip(params.wa, 30) || null,
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

/**
 * Buat/perbarui user dari profil Google. Pemanggil wajib memastikan email
 * sudah terverifikasi oleh Google sebelum akun ditautkan berdasarkan email.
 */
export async function upsertGoogleUser(profile: {
  googleId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  const byGoogle = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  if (byGoogle) {
    await createUserSession(byGoogle.id);
    return byGoogle;
  }

  const email = profile.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Jangan timpa tautan Google lain yang sudah terpasang di akun ini.
    if (existing.googleId && existing.googleId !== profile.googleId) {
      throw new Error("Email ini sudah tertaut ke akun Google lain.");
    }
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
