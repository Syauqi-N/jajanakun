import { prisma } from "./prisma";
import { createCharge, type WebhookPayload, isPaidStatus } from "./soqipg";
import { generateOrderCode } from "./utils";

export const ORDER_TTL_MINUTES = 30;

export type CartLine = { productId: string; qty: number };

export type CreateOrderResult = {
  order: Awaited<ReturnType<typeof getOrderByCode>>;
  qrString?: string | null;
  qrImageUrl?: string | null;
};

export async function createOrder(params: {
  lines: CartLine[];
  userId: string;
  buyerName?: string;
  buyerWa?: string;
  buyerNote?: string;
}) {
  if (!params.lines.length) throw new Error("Keranjang kosong.");
  if (!params.userId) throw new Error("Kamu harus masuk dulu sebelum membeli.");

  if (params.lines.length > 99 || params.lines.some((l) => !Number.isInteger(l.qty) || l.qty < 1 || l.qty > 99)) {
    throw new Error("Jumlah produk harus bilangan bulat antara 1–99.");
  }
  const productIds = params.lines.map((l) => l.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  if (products.length !== productIds.length) throw new Error("Ada produk yang tidak tersedia.");

  if (products.some((p) => p.isPreOrder && (!p.poEndsAt || p.poEndsAt <= new Date()))) {
    throw new Error("Batch PO sudah ditutup. Pilih batch atau produk lain.");
  }
  const subtotal = params.lines.reduce((sum, l) => {
    const p = products.find((x) => x.id === l.productId)!;
    return sum + p.price * l.qty;
  }, 0);
  if (subtotal <= 0) throw new Error("Total tidak valid.");

  // Buat order dulu (status PENDING), lalu charge ke gateway.
  let code = generateOrderCode();
  for (let i = 0; i < 5; i++) {
    const dup = await prisma.order.findUnique({ where: { code } });
    if (!dup) break;
    code = generateOrderCode();
  }

  const expiresAt = new Date(Date.now() + ORDER_TTL_MINUTES * 60 * 1000);

  const order = await prisma.order.create({
    data: {
      code,
      subtotal,
      // Nilai sementara; ditimpa dari respons gateway (totalAmount) bila tersedia.
      uniqueCode: 0,
      amount: subtotal,
      status: "PENDING",
      userId: params.userId,
      buyerName: params.buyerName?.trim() || null,
      buyerWa: params.buyerWa?.trim() || null,
      buyerNote: params.buyerNote?.trim() || null,
      expiresAt,
      items: {
        create: params.lines.map((l) => {
          const p = products.find((x) => x.id === l.productId)!;
          return {
            productId: p.id,
            name: p.name,
            price: p.price,
            qty: l.qty,
            isPreOrder: p.isPreOrder,
            poEta: p.isPreOrder ? p.poEta : "",
            poEndsAt: p.isPreOrder ? p.poEndsAt : null,
            poMinQty: p.isPreOrder ? p.poMinQty : 0,
          };
        }),
      },
    },
  });

  let qrString: string | null = null;
  let qrImageUrl: string | null = null;
  let paymentRef: string | null = null;

  try {
    const charge = await createCharge({
      orderCode: code,
      amount: subtotal,
      description: `Order ${code} - jajanakun.store`,
      expiresInSeconds: ORDER_TTL_MINUTES * 60,
      buyerName: params.buyerName,
      buyerWa: params.buyerWa,
    });
    qrString = charge.qrString ?? null;
    // SoqiPG mengirim QR sebagai data URL PNG di `qrImage`.
    qrImageUrl = charge.qrImageUrl ?? null;
    paymentRef = charge.ref;
    await prisma.order.update({
      where: { id: order.id },
      data: {
        qrString,
        qrImageUrl,
        paymentRef,
        expiresAt: charge.expiresAt,
        // Nominal final (subtotal + kode unik) ditentukan gateway.
        uniqueCode: charge.uniqueCode ?? 0,
        amount: charge.totalAmount ?? subtotal,
      },
    });
  } catch (err) {
    console.error("[createOrder] gateway error:", err);
    // Order tetap ada; admin bisa kirim QR manual / tandai lunas manual.
    await prisma.order.update({
      where: { id: order.id },
      data: { qrString: `MANUAL|${code}|${subtotal}` },
    });
  }

  return { order: await getOrderByCode(code), qrString, qrImageUrl };
}

export async function getOrderByCode(code: string) {
  return prisma.order.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      items: {
        include: {
          product: { select: { slug: true, tileBg: true, tileFg: true, letter: true } },
        },
      },
    },
  });
}

/** Daftar pesanan milik seorang user (untuk halaman akun). */
export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { id: true, name: true, qty: true, isPreOrder: true } },
    },
  });
}

/**
 * Tandai order LUNAS (dipanggil dari webhook atau aksi manual admin).
 * v2: TIDAK auto-assign kredensial — akun dikirim manual oleh admin via WhatsApp.
 * Idempotent.
 */
export async function markOrderPaid(
  order: { id: string; code: string },
  meta: { paidAt?: Date; source: string; ref?: string | null; raw?: string | null } = {
    source: "manual",
  }
) {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "PAID", paidAt: meta.paidAt ?? new Date() },
    });
    if (!changed.count) return { alreadyProcessed: true };
    await tx.paymentEvent.create({ data: { orderId: order.id, ref: meta.ref ?? undefined, type: meta.source, raw: meta.raw ?? undefined } });
    return { alreadyProcessed: false };
  });
}

/** Customer menekan tombol "Klaim Akun" -> status PAID jadi CLAIMED. */
export async function claimOrder(code: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { code: code.toUpperCase(), userId } });
    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (["CLAIMED", "DELIVERED"].includes(order.status)) return { alreadyClaimed: true };
    if (order.status !== "PAID") throw new Error("Hanya pesanan lunas yang dapat diklaim.");
    const changed = await tx.order.updateMany({ where: { id: order.id, status: "PAID" }, data: { status: "CLAIMED" } });
    return { alreadyClaimed: changed.count === 0 };
  });
}

/** Handler webhook terpadu (callback SoqiPG). Return info agar route bisa balas status. */
export async function handleWebhook(payload: WebhookPayload) {
  // Callback SoqiPG mengirim: { reference, status, amount, totalAmount, paidAt }
  // Order dicocokkan HANYA lewat kode (reference) — nominal bisa kembar antar order.
  const orderCode = String(payload.reference ?? payload.orderCode ?? "").trim().toUpperCase();
  if (!orderCode) return { ok: false as const, reason: "missing_reference" };
  const order = await prisma.order.findUnique({ where: { code: orderCode } });
  if (!order) return { ok: false as const, reason: "order_not_found" };

  if (!isPaidStatus(payload.status)) {
    return { ok: true as const, order, action: "ignored_status" as const };
  }

  // Nominal wajib ada & sama persis dengan yang ditagihkan.
  const amount = Number(payload.totalAmount ?? payload.amount ?? payload.grossAmount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false as const, reason: "missing_amount" };
  if (amount !== order.amount) return { ok: false as const, reason: "amount_mismatch" };

  const paidAt = payload.paidAt ? new Date(String(payload.paidAt)) : null;
  const result = await markOrderPaid(order, {
    paidAt: paidAt && !Number.isNaN(paidAt.getTime()) ? paidAt : new Date(),
    source: "webhook.soqipg",
    ref: orderCode,
    raw: JSON.stringify(payload),
  });

  return { ok: true as const, order, action: result.alreadyProcessed ? "duplicate" : "paid" };
}
