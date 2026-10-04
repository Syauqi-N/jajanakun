import crypto from "crypto";

/**
 * Google OAuth 2.0 (Authorization Code flow) — tanpa library eksternal.
 * Set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET di .env.
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/auth/google/callback`;
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export function randomState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export type GoogleProfile = {
  googleId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
};

export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Tukar kode Google gagal (${tokenRes.status}): ${await tokenRes.text()}`);
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) throw new Error("Google tidak mengembalikan access token.");

  const infoRes = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    cache: "no-store",
  });
  if (!infoRes.ok) throw new Error("Gagal mengambil profil Google.");
  const info = (await infoRes.json()) as {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!info.email) throw new Error("Akun Google tidak memiliki email.");

  return {
    googleId: info.sub,
    email: info.email,
    name: info.name,
    avatarUrl: info.picture,
  };
}
