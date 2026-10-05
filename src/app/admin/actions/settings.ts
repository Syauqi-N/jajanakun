"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentAdmin, isAdmin, isSuperAdmin } from "@/lib/auth";
import { SETTING_KEYS, hashPassword, normalizeWa, randomPassword, setSetting } from "@/lib/settings";

async function guard() {
  if (!(await isAdmin())) throw new Error("Tidak diizinkan.");
}

async function guardSuper() {
  if (!(await isSuperAdmin())) throw new Error("Hanya admin utama yang bisa mengelola admin.");
}

/* ---------------- Admin ---------------- */

export async function saveAdmin(formData: FormData): Promise<{ error?: string; ok?: string; password?: string }> {
  await guardSuper();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const id = String(formData.get("id") || "");
  const passwordInput = String(formData.get("password") || "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Email tidak valid." };
  }

  if (id) {
    // Ubah nama / status / (opsional) password.
    const data: { name: string; passwordHash?: string } = { name };
    if (passwordInput) {
      if (passwordInput.length < 6) return { error: "Password minimal 6 karakter." };
      data.passwordHash = hashPassword(passwordInput);
    }
    await prisma.admin.update({ where: { id }, data });
    revalidatePath("/admin/admin");
    return { ok: "Admin diperbarui." };
  }

  // Tambah admin baru.
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) return { error: "Email sudah terdaftar." };

  const plain = passwordInput.length >= 6 ? passwordInput : randomPassword(10);
  await prisma.admin.create({
    data: { email, name, passwordHash: hashPassword(plain), active: true, isSuper: false },
  });
  revalidatePath("/admin/admin");
  return { ok: "Admin dibuat. Simpan passwordnya — hanya tampil sekali.", password: plain };
}

export async function toggleAdmin(formData: FormData) {
  await guardSuper();
  const id = String(formData.get("id"));
  const row = await prisma.admin.findUnique({ where: { id } });
  if (!row || row.isSuper) return;
  await prisma.admin.update({ where: { id }, data: { active: !row.active } });
  revalidatePath("/admin/admin");
}

export async function deleteAdmin(formData: FormData) {
  await guardSuper();
  const id = String(formData.get("id"));
  const row = await prisma.admin.findUnique({ where: { id } });
  if (!row || row.isSuper) return;
  const me = await currentAdmin();
  if (me?.email === row.email) return;
  await prisma.admin.delete({ where: { id } });
  revalidatePath("/admin/admin");
}

/* ---------------- Pengaturan toko ---------------- */

export async function saveSettings(formData: FormData) {
  await guard();

  const wa = normalizeWa(String(formData.get("admin_wa") || ""));
  if (!wa || wa.length < 9) throw new Error("Nomor WhatsApp tidak valid.");

  await setSetting(SETTING_KEYS.adminWa, wa);
  await setSetting(SETTING_KEYS.storeName, String(formData.get("store_name") || ""));
  await setSetting(SETTING_KEYS.storeTagline, String(formData.get("store_tagline") || ""));
  await setSetting(SETTING_KEYS.storeAddress, String(formData.get("store_address") || ""));
  await setSetting(SETTING_KEYS.marqueeItems, String(formData.get("marquee_items") || ""));
  await setSetting(SETTING_KEYS.googleEnabled, formData.get("google_enabled") ? "1" : "0");

  revalidatePath("/admin/pengaturan");
  revalidatePath("/", "layout");
}
