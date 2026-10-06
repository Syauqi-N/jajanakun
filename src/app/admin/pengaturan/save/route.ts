import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { appBase, isSameOrigin } from "@/lib/request";
import { SETTING_KEYS, normalizeWa, setSetting } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Simpan pengaturan toko lewat form POST biasa (bukan server action),
 * agar redirect selalu memakai domain publik.
 */
export async function POST(req: Request) {
  const base = appBase(req);
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
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
