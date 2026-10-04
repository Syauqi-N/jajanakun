import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rp, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [paidOrders, pendingOrders, revenueAgg, productCount, needProcess, recentOrders, openClaims] =
    await Promise.all([
      prisma.order.count({ where: { status: { in: ["PAID", "CLAIMED", "DELIVERED"] } } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({
        where: { status: { in: ["PAID", "CLAIMED", "DELIVERED"] } },
        _sum: { subtotal: true },
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.order.findMany({
        where: { status: { in: ["PAID", "CLAIMED"] } },
        orderBy: { paidAt: "asc" },
        include: { items: { select: { name: true, qty: true, isPreOrder: true } } },
        take: 8,
      }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.warrantyClaim.count({ where: { status: "OPEN" } }),
    ]);

  const processCount = await prisma.order.count({ where: { status: { in: ["PAID", "CLAIMED"] } } });
  const revenue = revenueAgg._sum.subtotal || 0;

  const stats = [
    { label: "Total Pendapatan", value: rp(revenue), tone: "green" },
    { label: "Pesanan Lunas", value: String(paidOrders), tone: "green" },
    { label: "Menunggu Bayar", value: String(pendingOrders), tone: "mustard" },
    { label: "Perlu Diproses", value: String(processCount), tone: needProcess.length > 0 ? "red" : "default" },
    { label: "Produk Aktif", value: String(productCount), tone: "default" },
    { label: "Klaim Garansi Terbuka", value: String(openClaims), tone: openClaims > 0 ? "red" : "default" },
  ];

  return (
    <div>
      <h1 className="slab mb-6 text-[26px]">Ringkasan</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div className="card" key={s.label}>
            <p className="mono text-xs uppercase" style={{ color: "var(--ink-soft)", letterSpacing: ".08em" }}>
              {s.label}
            </p>
            <p className="slab mt-2 text-[26px]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="slab text-[19px]">Pesanan Terbaru</h2>
            <Link className="btn btn-sm btn-mustard" href="/admin/pesanan">
              Semua Pesanan →
            </Link>
          </div>
          <div className="table-wrap">
            <table className="gk">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Waktu</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-soft)" }}>
                      Belum ada pesanan.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="mono font-bold">{o.code}</td>
                      <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>{formatDateTime(o.createdAt)}</td>
                      <td className="mono">{rp(o.amount)}</td>
                      <td>
                        <span className={`status-pill status-${o.status}`}>{o.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="slab text-[19px]">Perlu Dikirim Manual</h2>
            <Link className="btn btn-sm btn-mustard" href="/admin/pesanan">
              Semua Pesanan →
            </Link>
          </div>
          <div className="card">
            {needProcess.length === 0 ? (
              <p style={{ color: "var(--ink-soft)" }}>Tidak ada pesanan yang menunggu dikirim. 👍</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {needProcess.map((o) => (
                  <li key={o.id} style={{ marginBottom: 8 }}>
                    <b className="mono">{o.code}</b> —{" "}
                    <span style={{ fontSize: 13 }}>
                      {o.items.map((it) => `${it.name} ×${it.qty}${it.isPreOrder ? " (PO)" : ""}`).join(", ")}
                    </span>{" "}
                    <Link className="badge badge-red" href={`/admin/pesanan?q=${o.code}`}>
                      buka
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="kirim-note" style={{ textAlign: "left", marginTop: 10 }}>
              Akun dikirim manual ke pembeli lewat WhatsApp. Setelah terkirim, tandai &ldquo;Sudah Dikirim&rdquo; di menu
              Pesanan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
