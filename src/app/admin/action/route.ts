import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { appBase, isSameOrigin, safeRedirectPath } from "@/lib/request";
import {
  cancelOrder,
  deleteCategory,
  deleteProduct,
  markDeliveredManual,
  markPaidManual,
  openClaim,
  rejectClaim,
  reopenOrder,
  resolveClaimManual,
  saveCategory,
  saveProduct,
  toggleProductActive,
} from "../actions/data";
import { deleteAdmin, saveAdmin, toggleAdmin } from "../actions/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Titik masuk tunggal untuk aksi admin yang dipicu dari form.
 * Dipakai agar pemanggilan berjalan lewat POST biasa + redirect absolut,
 * tidak bergantung server action (yang bermasalah di balik Cloudflare Tunnel).
 *
 * Field: `_name` = nama aksi, `_redirect` (opsional) = path tujuan setelah sukses.
 */
export async function POST(req: Request) {
  const base = appBase(req);
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  if (!(await isAdmin())) {
    return NextResponse.redirect(new URL("/admin/login", base), { status: 303 });
  }

  const fd = await req.formData();
  const name = String(fd.get("_name") || "");
  const redirectTo = safeRedirectPath(fd.get("_redirect"), "/admin");
  const wantJson = String(fd.get("_json") || "") === "1";

  let error: string | null = null;
  let extra: Record<string, unknown> = {};
  try {
    switch (name) {
      case "saveProduct": await saveProduct(fd); break;
      case "deleteProduct": await deleteProduct(fd); break;
      case "toggleProductActive": await toggleProductActive(fd); break;

      case "saveCategory": await saveCategory(fd); break;
      case "deleteCategory": await deleteCategory(fd); break;

      case "markPaidManual": await markPaidManual(fd); break;
      case "markDeliveredManual": await markDeliveredManual(fd); break;
      case "reopenOrder": await reopenOrder(fd); break;
      case "cancelOrder": await cancelOrder(fd); break;

      case "openClaim": await openClaim(fd); break;
      case "resolveClaimManual": await resolveClaimManual(fd); break;
      case "rejectClaim": await rejectClaim(fd); break;

      case "toggleAdmin": await toggleAdmin(fd); break;
      case "deleteAdmin": await deleteAdmin(fd); break;
      case "saveAdmin": {
        const res = await saveAdmin(fd);
        if (res.error) error = res.error;
        else if (res.password) extra.password = res.password;
        break;
      }

      default:
        error = "Aksi tidak dikenal.";
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Terjadi kesalahan.";
  }

  if (wantJson) {
    return NextResponse.json(error ? { error } : { ok: true, ...extra });
  }

  const url = new URL(redirectTo, base);
  if (error) url.searchParams.set("error", error);
  else url.searchParams.set("ok", "1");
  return NextResponse.redirect(url, { status: 303 });
}
