import { prisma } from "@/lib/prisma";
import { rp } from "@/lib/utils";

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

export default async function AdminLaporanPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period = "month" } = await searchParams;
  const start = periodStart(period);
  const dateWhere = start ? { createdAt: { gte: start } } : {};
  const paidWhere = { status: { in: ["PAID", "CLAIMED", "DELIVERED"] as string[] }, ...dateWhere };

  const [agg, items] = await Promise.all([
    prisma.order.aggregate({ where: paidWhere, _sum: { subtotal: true }, _count: { _all: true } }),
    prisma.orderItem.findMany({
      where: { order: paidWhere },
      include: { product: { select: { name: true } } },
    }),
  ]);

  const revenue = agg._sum?.subtotal || 0;
  const orderCount = agg._count?._all || 0;

  const perProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const it of items) {
    const key = it.product.name;
    const cur = perProduct.get(key) || { name: key, qty: 0, revenue: 0 };
    cur.qty += it.qty;
    cur.revenue += it.price * it.qty;
    perProduct.set(key, cur);
  }
  const rows = [...perProduct.values()].sort((a, b) => b.revenue - a.revenue);

  const periods = [
    { key: "today", label: "Hari Ini" },
    { key: "week", label: "7 Hari" },
    { key: "month", label: "Bulan Ini" },
    { key: "year", label: "Tahun Ini" },
    { key: "all", label: "Semua" },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="slab text-[26px]">Laporan Pendapatan</h1>
        <a className="btn btn-sm btn-green" href={`/admin/laporan/csv?period=${period}`}>
          ⬇ Export CSV
        </a>
      </div>

      <div className="chips mb-6">
        {periods.map((p) => (
          <a key={p.key} className="chip" href={`/admin/laporan?period=${p.key}`} aria-pressed={period === p.key}>
            {p.label}
          </a>
        ))}
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="mono text-xs uppercase" style={{ color: "var(--ink-soft)", letterSpacing: ".08em" }}>
            Total Pendapatan
          </p>
          <p className="slab mt-2 text-[28px]">{rp(revenue)}</p>
        </div>
        <div className="card">
          <p className="mono text-xs uppercase" style={{ color: "var(--ink-soft)", letterSpacing: ".08em" }}>
            Jumlah Pesanan Lunas
          </p>
          <p className="slab mt-2 text-[28px]">{orderCount}</p>
        </div>
      </div>

      <h2 className="slab mb-3 text-[20px]">Pendapatan per Produk</h2>
      <div className="table-wrap">
        <table className="gk">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Terjual</th>
              <th>Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", color: "var(--ink-soft)" }}>
                  Belum ada penjualan pada periode ini.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.name}>
                  <td>
                    <b>{r.name}</b>
                  </td>
                  <td>{r.qty}</td>
                  <td className="mono">{rp(r.revenue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
