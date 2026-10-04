import { prisma } from "./prisma";
import { formatDateTime } from "./utils";

type PoItem = { productId: string; isPreOrder: boolean; poEndsAt: Date | null; poMinQty: number };

/** Kuota dihitung dari pembelian lunas dalam batch yang sama (snapshot batas waktu). */
export async function preOrderReadiness(items: PoItem[]) {
  const pending: string[] = [];
  for (const item of items.filter((i) => i.isPreOrder)) {
    if (item.poEndsAt && item.poEndsAt <= new Date()) continue;
    const paid = item.poMinQty > 0 && item.poEndsAt
      ? await prisma.orderItem.aggregate({
          where: {
            productId: item.productId, isPreOrder: true, poEndsAt: item.poEndsAt,
            order: { status: { in: ["PAID", "CLAIMED", "DELIVERED"] } },
          },
          _sum: { qty: true },
        })
      : null;
    const qty = paid?._sum.qty ?? 0;
    if (item.poMinQty > 0 && qty >= item.poMinQty) continue;
    pending.push(`${item.poEndsAt ? `Menunggu ${formatDateTime(item.poEndsAt)} WIB` : "Batas batch belum diatur"}${item.poMinQty > 0 ? ` atau kuota ${qty}/${item.poMinQty} akun lunas` : ""}`);
  }
  return { ready: pending.length === 0, pending };
}

/**
 * Ringkasan kuota PO untuk ditampilkan di kartu etalase.
 * `claimed` dihitung dari pembelian lunas pada batch yang sama (via poEndsAt).
 */
export async function preOrderQuota(products: { id: string; isPreOrder: boolean; poEndsAt: Date | null; poMinQty: number }[]) {
  const po = products.filter((p) => p.isPreOrder && p.poEndsAt && p.poEndsAt > new Date() && p.poMinQty > 0);
  const result = new Map<string, { claimed: number; target: number }>();
  await Promise.all(
    po.map(async (p) => {
      const paid = await prisma.orderItem.aggregate({
        where: {
          productId: p.id,
          isPreOrder: true,
          poEndsAt: p.poEndsAt,
          order: { status: { in: ["PAID", "CLAIMED", "DELIVERED"] } },
        },
        _sum: { qty: true },
      });
      result.set(p.id, { claimed: paid._sum.qty ?? 0, target: p.poMinQty });
    })
  );
  return result;
}
