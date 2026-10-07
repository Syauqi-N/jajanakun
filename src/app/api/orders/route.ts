import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { getCurrentUser } from "@/lib/user-auth";
import { rateLimit } from "@/lib/rate-limit";
import { clip, isSameOrigin } from "@/lib/request";
import { getStoreHours } from "@/lib/settings";
import { formatHours, isStoreOpen } from "@/lib/store-hours";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Kamu harus masuk dulu sebelum membeli.", code: "UNAUTHORIZED" }, { status: 401 });
    }
    // Di luar jam operasional toko tidak menerima pesanan.
    const hours = await getStoreHours();
    if (!isStoreOpen(hours)) {
      return NextResponse.json(
        { error: `Toko sedang tutup. Pesanan bisa dibuat lagi pada jam buka (${formatHours(hours)}).`, code: "STORE_CLOSED" },
        { status: 403 },
      );
    }
    // Tiap pesanan membuat transaksi di gateway — batasi 10 pesanan / 10 menit per user.
    if (!rateLimit(`order:${user.id}`, 10, 10 * 60_000)) {
      return NextResponse.json({ error: "Terlalu banyak pesanan dalam waktu singkat. Coba lagi sebentar lagi." }, { status: 429 });
    }

    const body = await req.json();
    const lines = Array.isArray(body.lines)
      ? body.lines
          .map((l: { productId: unknown; qty: unknown }) => ({
            productId: String(l.productId),
            qty: Number(l.qty),
          }))
          .filter((l: { productId: string }) => l.productId)
      : [];

    if (!lines.length) {
      return NextResponse.json({ error: "Keranjang kosong." }, { status: 400 });
    }

    const { order } = await createOrder({
      lines,
      userId: user.id,
      buyerName: clip(body.buyerName, 100) || user.name || undefined,
      buyerWa: clip(body.buyerWa, 30) || user.wa || undefined,
      buyerNote: clip(body.buyerNote, 500),
    });

    return NextResponse.json({ code: order!.code, amount: order!.amount });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    const msg = err instanceof Error ? err.message : "Gagal membuat pesanan.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
