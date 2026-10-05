import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { SETTING_KEYS, normalizeWa, setSetting } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Base URL publik untuk redirect (hindari host internal container). */
function appBase(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (env) return env;
  return new URL(req.url).origin;
}

/**
 * Simpan pengaturan toko lewat form POST biasa (bukan server action),
 * agar redirect selalu memakai domain publik.
 */
export async function POST(req: Request) {
  const base = appBase(req);
  if (!(await isAdmin())) {
    return NextResponse.redirect(new URL("/admin/login", base), { status: 303 });
  }

  const form = await req.formData();
  const wa = normalizeWa(String(form.get("admin_wa") || ""));
  if (!wa || wa.length < 9) {
    return NextResponse.redirect(new URL("/admin/pengaturan?error=wa", base), { status: 303 });
  }

  await setSetting(SETTING_KEYS.adminWa, wa);
  await setSetting(SETTING_KEYS.storeName, String(form.get("store_name") || ""));
  await setSetting(SETTING_KEYS.storeTagline, String(form.get("store_tagline") || ""));
  await setSetting(SETTING_KEYS.storeAddress, String(form.get("store_address") || ""));
  await setSetting(SETTING_KEYS.marqueeItems, String(form.get("marquee_items") || ""));
  await setSetting(SETTING_KEYS.googleEnabled, form.get("google_enabled") ? "1" : "0");

  return NextResponse.redirect(new URL("/admin/pengaturan?ok=1", base), { status: 303 });
}
