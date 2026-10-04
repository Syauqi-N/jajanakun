import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function periodStart(period: string): Date | null {
  const now = new Date();
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  return null;
}

function esc(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return new Response("Tidak diizinkan", { status: 401 });
  }
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "all";
  const start = periodStart(period);

  const items = await prisma.orderItem.findMany({
    where: { order: { status: { in: ["PAID", "CLAIMED", "DELIVERED"] }, ...(start ? { createdAt: { gte: start } } : {}) } },
    include: {
      product: { select: { name: true } },
      order: { select: { code: true, createdAt: true, user: { select: { email: true } } } },
    },
    orderBy: { order: { createdAt: "desc" } },
  });

  const header = ["kode_order", "tanggal", "pembeli", "produk", "qty", "harga_satuan", "subtotal", "status_periode"];
  const lines = [header.join(",")];
  let total = 0;
  for (const it of items) {
    const sub = it.price * it.qty;
    total += sub;
    lines.push(
      [
        it.order.code,
        new Date(it.order.createdAt).toISOString(),
        it.order.user?.email || "-",
        it.product.name,
        it.qty,
        it.price,
        sub,
        period,
      ]
        .map(esc)
        .join(","),
    );
  }
  lines.push(["", "", "", "", "", "TOTAL", total, ""].map(esc).join(","));

  const csv = "\uFEFF" + lines.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-jajanakun-${period}-${Date.now()}.csv"`,
    },
  });
}
