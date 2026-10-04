import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { getCurrentUser } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Kamu harus masuk dulu sebelum membeli.", code: "UNAUTHORIZED" }, { status: 401 });
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
      buyerName: body.buyerName || user.name || undefined,
      buyerWa: body.buyerWa || user.wa || undefined,
      buyerNote: body.buyerNote,
    });

    return NextResponse.json({ code: order!.code, amount: order!.amount });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    const msg = err instanceof Error ? err.message : "Gagal membuat pesanan.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
