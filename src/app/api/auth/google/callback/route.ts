import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForProfile } from "@/lib/google";
import { upsertGoogleUser } from "@/lib/user-auth";
import { appBase } from "@/lib/request";

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
