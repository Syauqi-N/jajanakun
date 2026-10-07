"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { slugify, generateClaimCode } from "@/lib/utils";
import { markOrderPaid } from "@/lib/orders";
import { preOrderReadiness } from "@/lib/preorder";
import { normalizeWa } from "@/lib/settings";

async function guard() {
  if (!(await isAdmin())) throw new Error("Tidak diizinkan.");
}

/* ---------------- Produk ---------------- */

export async function saveProduct(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const data = {
    name,
    description: String(formData.get("description") || ""),
    categoryId: String(formData.get("categoryId") || ""),
    duration: String(formData.get("duration") || ""),
    warranty: String(formData.get("warranty") || ""),
    price: Number(formData.get("price") || 0),
    priceWas: formData.get("priceWas") ? Number(formData.get("priceWas")) : null,
    tileBg: String(formData.get("tileBg") || "#221f1f"),
    tileFg: String(formData.get("tileFg") || "#e50914"),
    letter: String(formData.get("letter") || "A").slice(0, 3),
    featured: formData.get("featured") === "on",
    badge: String(formData.get("badge") || "") || null,
    active: formData.get("active") === "on",
    imageUrl: String(formData.get("imageUrl") || "").trim() || null,
    isPreOrder: formData.get("isPreOrder") === "on",
    poEta: String(formData.get("poEta") || "").trim(),
    poMinQty: Number(formData.get("poMinQty") || 0),
    poEndsAt: formData.get("isPreOrder") === "on" && formData.get("poEndsAt")
      ? new Date(`${formData.get("poEndsAt")}:00+07:00`) : null,
    // Kosong = pakai nomor WA toko dari Pengaturan.
    adminWa: normalizeWa(String(formData.get("adminWa") || "")),
  };
  if (!data.name || !data.categoryId) throw new Error("Nama & kategori wajib diisi.");

  if (!Number.isSafeInteger(data.price) || data.price < 1 || data.price > 100000000) throw new Error("Harga tidak valid.");
  if (!Number.isInteger(data.poMinQty) || data.poMinQty < 0) throw new Error("Minimum PO tidak valid.");
  if (data.isPreOrder && (!data.poEndsAt || Number.isNaN(data.poEndsAt.getTime()))) throw new Error("Isi batas waktu batch PO (WIB).");
  if (data.imageUrl && !/^\/uploads\/produk-[a-f0-9-]+\.webp$/.test(data.imageUrl)) throw new Error("Unggah gambar melalui form produk.");
  if (data.adminWa && (data.adminWa.length < 10 || data.adminWa.length > 15)) throw new Error("Nomor WA admin tidak valid.");

  if (id) {
    await prisma.product.update({ where: { id }, data });
  } else {
    let slug = slugify(name);
    if (!slug) slug = `produk-${Date.now()}`;
    const dup = await prisma.product.findUnique({ where: { slug } });
    if (dup) slug = `${slug}-${Date.now().toString(36)}`;
    await prisma.product.create({ data: { ...data, slug } });
  }
  revalidatePath("/admin/produk");
  revalidatePath("/");

}

export async function deleteProduct(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/produk");
  revalidatePath("/");
}

export async function toggleProductActive(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return;
  await prisma.product.update({ where: { id }, data: { active: !p.active } });
  revalidatePath("/admin/produk");
  revalidatePath("/");
}

/* ---------------- Kategori ---------------- */

export async function saveCategory(formData: FormData) {
  await guard();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Nama kategori wajib.");
  const order = Number(formData.get("order") || 0);
  if (id) {
    await prisma.category.update({ where: { id }, data: { name, order } });
  } else {
    await prisma.category.create({ data: { name, slug: slugify(name) || `kat-${Date.now()}`, order } });
  }
  revalidatePath("/admin/kategori");
  revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) throw new Error("Kategori masih dipakai produk. Pindahkan dulu.");
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/kategori");
  revalidatePath("/");
}

/* ---------------- Pesanan ---------------- */

export async function markPaidManual(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return;
  await markOrderPaid(order, { source: "manual.paid", raw: "ditandai lunas oleh admin" });
  revalidatePath("/admin/pesanan");
  revalidatePath("/admin");
}

/** Admin menandai akun sudah dikirim manual (via chat) -> status DELIVERED. */
export async function markDeliveredManual(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order || !["PAID", "CLAIMED"].includes(order.status)) throw new Error("Pesanan harus lunas terlebih dahulu.");
  const po = await preOrderReadiness(order.items);
  if (!po.ready) throw new Error("PO belum selesai: " + po.pending.join("; "));
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({ where: { id, status: { in: ["PAID", "CLAIMED"] } }, data: { status: "DELIVERED", deliveredAt: new Date() } });
    if (!updated.count) throw new Error("Status pesanan sudah berubah.");
    for (const item of order.items) await tx.orderItem.update({ where: { id: item.id }, data: { deliveredQty: item.qty } });
  });
  revalidatePath("/admin/pesanan");
  revalidatePath("/admin");
  revalidatePath("/akun");
}

/** Admin mengembalikan status ke PAID (mis. salah tekan kirim). */
export async function reopenOrder(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  await prisma.order.updateMany({
    where: { id, status: "DELIVERED" },
    data: { status: "PAID", deliveredAt: null },
  });
  revalidatePath("/admin/pesanan");
}

export async function cancelOrder(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const refund = formData.get("refund") === "1";
  await prisma.order.updateMany({
    where: { id, status: refund ? { in: ["PAID", "CLAIMED", "DELIVERED"] } : "PENDING" },
    data: { status: refund ? "REFUNDED" : "CANCELLED" },
  });
  revalidatePath("/admin/pesanan");
  revalidatePath("/admin");
}

/* ---------------- Klaim garansi ---------------- */

export async function openClaim(formData: FormData) {
  await guard();
  const orderId = String(formData.get("orderId") || "");
  const reason = String(formData.get("reason") || "Dibuat admin");
  if (!orderId) throw new Error("Order wajib.");
  const item = await prisma.orderItem.findFirst({ where: { orderId } });
  if (!item) throw new Error("Order ini tidak punya item.");
  await prisma.warrantyClaim.create({
    data: {
      code: generateClaimCode(),
      orderId,
      productId: item.productId,
      reason,
      status: "OPEN",
    },
  });
  revalidatePath("/admin/garansi");
}

export async function resolveClaimManual(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const resolution = String(formData.get("resolution") || "Diselesaikan manual.");
  await prisma.warrantyClaim.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolution },
  });
  revalidatePath("/admin/garansi");
}

export async function rejectClaim(formData: FormData) {
  await guard();
  const id = String(formData.get("id"));
  const resolution = String(formData.get("resolution") || "Klaim ditolak.");
  await prisma.warrantyClaim.update({
    where: { id },
    data: { status: "REJECTED", resolvedAt: new Date(), resolution },
  });
  revalidatePath("/admin/garansi");
}
