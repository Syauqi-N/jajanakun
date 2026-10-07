import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { appBase, isSameOrigin } from "@/lib/request";
import { SETTING_KEYS, normalizeWa, setSetting } from "@/lib/settings";
import { isValidHHMM } from "@/lib/store-hours";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Simpan pengaturan toko lewat form POST biasa (bukan server action),
 * agar redirect selalu memakai domain publik. `_json=1` -> balas JSON
 * (dipakai form ber-JS supaya error tampil, bukan tertelan redirect).
 */
export async function POST(req: Request) {
  const base = appBase(req);
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  if (!(await isAdmin())) {
    return NextResponse.redirect(new URL("/admin/login", base), { status: 303 });
  }

  const form = await req.formData();
  const wantJson = String(form.get("_json") || "") === "1";
  const fail = (code: string, message: string) =>
    wantJson
      ? NextResponse.json({ error: message }, { status: 400 })
      : NextResponse.redirect(new URL(`/admin/pengaturan?error=${code}`, base), { status: 303 });

  const wa = normalizeWa(String(form.get("admin_wa") || ""));
  if (!wa || wa.length < 9) return fail("wa", "Nomor WhatsApp tidak valid.");

  const openTime = String(form.get("open_time") || "");
  const closeTime = String(form.get("close_time") || "");
  if (!isValidHHMM(openTime) || !isValidHHMM(closeTime)) return fail("jam", "Jam buka/tutup tidak valid (format JJ:MM).");

  await setSetting(SETTING_KEYS.adminWa, wa);
  await setSetting(SETTING_KEYS.storeName, String(form.get("store_name") || ""));
  await setSetting(SETTING_KEYS.storeTagline, String(form.get("store_tagline") || ""));
  await setSetting(SETTING_KEYS.storeAddress, String(form.get("store_address") || ""));
  await setSetting(SETTING_KEYS.marqueeItems, String(form.get("marquee_items") || ""));
  await setSetting(SETTING_KEYS.googleEnabled, form.get("google_enabled") ? "1" : "0");
  await setSetting(SETTING_KEYS.openTime, openTime);
  await setSetting(SETTING_KEYS.closeTime, closeTime);

  if (wantJson) return NextResponse.json({ ok: true });
  return NextResponse.redirect(new URL("/admin/pengaturan?ok=1", base), { status: 303 });
}
