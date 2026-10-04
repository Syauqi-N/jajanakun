import { NextResponse } from "next/server";
import { getOrderByCode } from "@/lib/orders";
import { getCurrentUser } from "@/lib/user-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const { code } = await params;
  const order = await getOrderByCode(code);
  if (!order || order.userId !== user.id) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });

  const isPreOrder = order.items.some((i) => i.isPreOrder);

  return NextResponse.json({
    code: order.code,
    status: order.status,
    amount: order.amount,
    subtotal: order.subtotal,
    uniqueCode: order.uniqueCode,
    buyerName: order.buyerName,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt,
    deliveredAt: order.deliveredAt,
    isPreOrder,
    qrString: order.qrString,
    qrImageUrl: order.qrImageUrl,
    items: order.items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty,
      productSlug: i.product.slug,
      isPreOrder: i.isPreOrder,
      poEta: i.poEta,
      poEndsAt: i.poEndsAt,
      poMinQty: i.poMinQty,
    })),
  });
}
