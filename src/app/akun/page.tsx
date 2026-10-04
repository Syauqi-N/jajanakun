import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeaderServer } from "@/components/site-header-server";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawerServer } from "@/components/cart-drawer-server";
import { Toast } from "@/components/toast";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/user-auth";
import { getUserOrders } from "@/lib/orders";
import { rp, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AkunPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?next=/akun");

  const orders = await getUserOrders(user.id);

  const statusLabel: Record<string, string> = {
    PENDING: "Menunggu Pembayaran",
    PAID: "Lunas — Siap Diklaim",
    CLAIMED: "Lunas — Sedang Diproses",
    DELIVERED: "Lunas — Akun Terkirim",
    CANCELLED: "Dibatalkan",
    REFUNDED: "Dana Dikembalikan",
  };

  return (
    <>
      <SiteHeaderServer />
      <CartDrawerServer />
      <Toast />
      <main className="wrap py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="sec-kicker" style={{ marginBottom: 2 }}>
              Akun Saya
            </p>
            <h1 className="slab text-[26px]">{user.name || user.email.split("@")[0]}</h1>
            <p className="mono" style={{ color: "var(--ink-soft)", fontSize: 13 }}>
              {user.email}
            </p>
          </div>
          <LogoutButton />
        </div>

        <h2 className="slab text-[20px] mb-3">Riwayat Pesanan</h2>

        {orders.length === 0 ? (
          <div className="card text-center">
            <p style={{ color: "var(--ink-soft)" }}>Belum ada pesanan. Yuk mulai belanja!</p>
            <Link className="btn btn-red mt-3 inline-flex" href="/#katalog">
              Lihat Katalog
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="gk">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Tanggal</th>
                  <th>Item</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="mono font-bold">{o.code}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(o.createdAt)}</td>
                    <td>
                      {o.items.map((it) => (
                        <div key={it.id} style={{ fontSize: 13 }}>
                          {it.name} × {it.qty}
                        </div>
                      ))}
                    </td>
                    <td className="mono" style={{ whiteSpace: "nowrap" }}>
                      {rp(o.amount)}
                    </td>
                    <td>
                      <span className={`status-pill status-${o.status}`}>{statusLabel[o.status] || o.status}</span>
                    </td>
                    <td>
                      <Link className="btn btn-sm btn-mustard" href={`/pesanan/${o.code}`}>
                        Buka
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
