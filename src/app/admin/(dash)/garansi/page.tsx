import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { AdminForm } from "@/components/admin-form";

export const dynamic = "force-dynamic";

export default async function AdminGaransiPage() {
  const [claims, orders] = await Promise.all([
    prisma.warrantyClaim.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true } },
        order: { select: { code: true, buyerName: true, user: { select: { email: true } } } },
      },
    }),
    prisma.order.findMany({
      where: { status: { in: ["PAID", "CLAIMED", "DELIVERED"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { items: { include: { product: { select: { id: true, name: true } } } }, user: { select: { email: true } } },
    }),
  ]);

  const open = claims.filter((c) => c.status === "OPEN");
  const done = claims.filter((c) => c.status !== "OPEN");

  return (
    <div>
      <h1 className="slab mb-6 text-[26px]">Klaim Garansi</h1>

      <AdminForm action="openClaim" className="card mb-8">
        <h3 className="slab mb-3 text-[19px]">Buat Klaim Manual</h3>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Order</span>
            <select className="select" name="orderId" required>
              <option value="">— pilih order —</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} — {o.user?.email || o.buyerName || "?"}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Alasan</span>
            <input className="input" name="reason" placeholder="mis. akun error / tidak bisa login" />
          </label>
          <button className="btn btn-red" type="submit">
            + Buat Klaim
          </button>
        </div>
        <p className="kirim-note" style={{ textAlign: "left", marginTop: 10 }}>
          Klaim dicatat untuk produk pertama pesanan. Kirim penggantian melalui WhatsApp, lalu isi catatan penyelesaian.
        </p>
      </AdminForm>

      <h2 className="slab mb-3 text-[20px]">Klaim Masuk ({open.length})</h2>
      {open.length === 0 ? (
        <div className="card mb-8">Tidak ada klaim terbuka. 🎉</div>
      ) : (
        <div className="grid gap-5 mb-8">
          {open.map((c) => (
            <div className="card" key={c.id}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b className="mono">{c.code}</b>
                  <span className="badge badge-mustard ml-2">OPEN</span>
                  <div className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {c.product.name} • order {c.order.code} • {c.order.user?.email || c.order.buyerName || "?"}
                  </div>
                </div>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                  {formatDateTime(c.createdAt)}
                </span>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 14 }}>Alasan: {c.reason}</p>
              <div className="flex flex-wrap gap-2">
                <AdminForm action="resolveClaimManual" className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input className="input" name="resolution" placeholder="Catatan penyelesaian" style={{ width: 220, padding: "6px 10px" }} />
                  <button className="btn btn-sm btn-mustard" type="submit">
                    Selesaikan Manual
                  </button>
                </AdminForm>
                <AdminForm action="rejectClaim" confirmText="Tolak klaim ini?">
                  <input type="hidden" name="id" value={c.id} />
                  <button className="btn btn-sm btn-red" type="submit">
                    Tolak
                  </button>
                </AdminForm>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="slab mb-3 text-[20px]">Riwayat Selesai</h2>
      <div className="table-wrap">
        <table className="gk">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Produk</th>
              <th>Order</th>
              <th>Status</th>
              <th>Resolusi</th>
              <th>Waktu</th>
            </tr>
          </thead>
          <tbody>
            {done.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-soft)" }}>
                  Belum ada.
                </td>
              </tr>
            ) : (
              done.map((c) => (
                <tr key={c.id}>
                  <td className="mono font-bold">{c.code}</td>
                  <td>{c.product.name}</td>
                  <td className="mono">{c.order.code}</td>
                  <td>
                    <span className={`badge ${c.status === "RESOLVED" ? "badge-green" : "badge-red"}`}>{c.status}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{c.resolution || "—"}</td>
                  <td style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{c.resolvedAt ? formatDateTime(c.resolvedAt) : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
