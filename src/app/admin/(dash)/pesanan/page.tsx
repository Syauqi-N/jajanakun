import Link from "next/link";
import { preOrderReadiness } from "@/lib/preorder";
import { prisma } from "@/lib/prisma";
import { rp, formatDateTime, normalizeWa } from "@/lib/utils";
import { AdminForm } from "@/components/admin-form";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "PAID", "CLAIMED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu Bayar",
  PAID: "Lunas",
  CLAIMED: "Diklaim",
  DELIVERED: "Terkirim",
  CANCELLED: "Batal",
  REFUNDED: "Refund",
};

function buyerWaMsg(o: { code: string; amount: number; items: { name: string; qty: number; isPreOrder: boolean; poEta: string }[] }) {
  const lines = [
    `Halo, terima kasih sudah order di jajanakun.store!`,
    ``,
    `Kode pesanan: ${o.code}`,
    `Total: ${rp(o.amount)}`,
    ``,
    `Produk kamu:`,
    ...o.items.map((it) => `- ${it.name} × ${it.qty}${it.isPreOrder ? ` (PRE-ORDER, estimasi ${it.poEta || "1-3 hari"})` : ""}`),
    ``,
    `Berikut akunmu:`,
    `Email: `,
    `Password: `,
  ];
  return lines.join("\n");
}

export default async function AdminPesananPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const where: Record<string, unknown> = {};
  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) where.status = status;
  if (q) where.code = { contains: q.toUpperCase() };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true, wa: true } },
      items: true,
    },
  });

  const poStates = await Promise.all(orders.map((o) => preOrderReadiness(o.items)));

  return (
    <div>
      <h1 className="slab mb-5 text-[26px]">Pesanan</h1>

      <p className="kirim-note mb-4">Pengembalian dana dilakukan manual di luar sistem. Tandai setelah dana benar-benar dikembalikan.</p>
      <div className="chips mb-5">
        <Link className="chip" href="/admin/pesanan" aria-pressed={!status}>
          Semua
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} className="chip" href={`/admin/pesanan?status=${s}`} aria-pressed={status === s}>
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="grid gap-5">
        {orders.length === 0 && <div className="card">Tidak ada pesanan untuk filter ini.</div>}
        {orders.map((o, index) => {
          const buyerWa = normalizeWa(o.buyerWa || o.user?.wa || "");
          const poState = poStates[index];
          const isPo = o.items.some((i) => i.isPreOrder);
          return (
            <div className="card" key={o.id}>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="mono text-[16px]">{o.code}</b>
                    <span className={`status-pill status-${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span>
                    {isPo && <span className="po-badge">PRE-ORDER</span>}
                    {o.status === "CLAIMED" && <span className="badge badge-mustard">Pembeli minta dikirim</span>}
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>
                    {formatDateTime(o.createdAt)} • {o.user?.email || o.buyerName || "tanpa akun"}
                    {o.buyerWa ? ` • WA: ${o.buyerWa}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mono" style={{ fontWeight: 700 }}>
                    {rp(o.amount)}
                  </div>
                  <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                    subtotal {rp(o.subtotal)} + unik {o.uniqueCode}
                  </div>
                </div>
              </div>

              <div className="mb-3 grid gap-2">
                {o.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border-[2.5px] px-3 py-2"
                    style={{ borderColor: "var(--line)", background: "var(--paper-2)" }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      {it.name} × {it.qty}
                      {it.isPreOrder && <span className="po-badge" style={{ marginLeft: 8 }}>PO • {it.poEta || "1-3 hari"}</span>}
                    </span>

                  </div>
                ))}
              </div>

              {isPo && <p className="po-banner mb-3">{poState.ready ? "Batch PO siap dikirim manual." : poState.pending.join(" • ")}</p>}
              <div className="flex flex-wrap gap-2">
                {o.status === "PENDING" && (
                  <AdminForm action="markPaidManual">
                    <input type="hidden" name="id" value={o.id} />
                    <button className="btn btn-sm btn-green" type="submit">
                      Tandai Lunas Manual
                    </button>
                  </AdminForm>
                )}
                {(o.status === "PAID" || o.status === "CLAIMED") && (
                  <AdminForm action="markDeliveredManual">
                    <input type="hidden" name="id" value={o.id} />
                    <button className="btn btn-sm btn-green" type="submit" disabled={!poState.ready}>
                      ✓ Tandai Sudah Dikirim
                    </button>
                  </AdminForm>
                )}
                {o.status === "DELIVERED" && (
                  <AdminForm action="reopenOrder">
                    <input type="hidden" name="id" value={o.id} />
                    <button className="btn btn-sm" type="submit">
                      ↺ Buka Lagi (belum terkirim)
                    </button>
                  </AdminForm>
                )}
                {o.status !== "CANCELLED" && o.status !== "REFUNDED" && (
                  <>
                    {o.status === "PENDING" && <AdminForm action="cancelOrder" confirmText="Batalkan pesanan ini?">
                      <input type="hidden" name="id" value={o.id} />
                      <button className="btn btn-sm" type="submit">
                        Batalkan
                      </button>
                    </AdminForm>}
                    {o.status !== "PENDING" && <AdminForm action="cancelOrder" confirmText="Tandai dana sudah dikembalikan ke pembeli?">
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="refund" value="1" />
                      <button className="btn btn-sm btn-red" type="submit">
                        Tandai Dana Dikembalikan
                      </button>
                    </AdminForm>}
                  </>
                )}
                {buyerWa && <a
                  className="btn btn-sm btn-green"
                  href={`https://wa.me/${buyerWa}?text=${encodeURIComponent(buyerWaMsg(o))}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat Pembeli via WhatsApp
                </a>}
                {!buyerWa && <span className="kirim-note">Nomor pembeli belum tersedia. Balas chat klaim dari pembeli.</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
