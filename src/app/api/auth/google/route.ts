import { NextResponse } from "next/server";
import { buildAuthUrl, googleConfigured, randomState } from "@/lib/google";
import { cookies } from "next/headers";
import { secureCookies } from "@/lib/auth";
import { appBase } from "@/lib/request";

export async function GET(req: Request) {
  const base = appBase(req);
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/masuk?error=google_belum_dikonfigurasi", base));
  }
  const state = randomState();
  const store = await cookies();
  store.set("gk_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(buildAuthUrl(state));
}
