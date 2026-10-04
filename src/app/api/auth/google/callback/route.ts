import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForProfile } from "@/lib/google";
import { upsertGoogleUser } from "@/lib/user-auth";

/**
 * Base URL publik untuk redirect.
 * Di balik Cloudflare Tunnel, `req.url` berisi host internal container
 * (mis. 0.0.0.0:3000) sehingga redirect bisa salah. Utamakan APP_URL.
 */
function appBase(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (env) return env;
  return new URL(req.url).origin;
}

export async function GET(req: Request) {
  const base = appBase(req);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const savedState = store.get("gk_oauth_state")?.value;
  store.delete("gk_oauth_state");

  if (!code) {
    return NextResponse.redirect(new URL("/masuk?error=google_dibatalkan", base));
  }
  if (!state || state !== savedState) {
    return NextResponse.redirect(new URL("/masuk?error=state_tidak_valid", base));
  }

  try {
    const profile = await exchangeCodeForProfile(code);
    await upsertGoogleUser(profile);
    return NextResponse.redirect(new URL("/akun", base));
  } catch (err) {
    console.error("[google callback]", err);
    return NextResponse.redirect(new URL("/masuk?error=google_gagal", base));
  }
}
