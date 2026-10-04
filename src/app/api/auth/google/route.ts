import { NextResponse } from "next/server";
import { buildAuthUrl, googleConfigured, randomState } from "@/lib/google";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/masuk?error=google_belum_dikonfigurasi", base));
  }
  const state = randomState();
  const store = await cookies();
  store.set("gk_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return NextResponse.redirect(buildAuthUrl(state));
}
