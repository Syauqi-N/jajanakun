import { NextResponse } from "next/server";
import { claimOrder } from "@/lib/orders";
import { getCurrentUser } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const { code } = await params;
  const order = await prisma.order.findFirst({ where: { code: code.toUpperCase(), userId: user.id }, select: { id: true } });
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  try {
    const result = await claimOrder(code, user.id);
    return NextResponse.json({ ok: true, alreadyClaimed: result.alreadyClaimed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengklaim pesanan.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
