"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore, type CartProduct } from "./store-provider";
import { rp } from "@/lib/utils";
import { useStoreHours } from "./store-hours";
import { fmtTime } from "@/lib/store-hours";

export function CartDrawer({ loggedIn, initialProducts, initialWa }: { loggedIn: boolean; initialProducts: CartProduct[]; initialWa: string }) {
  const { cart, products, count, total, drawerOpen, closeDrawer, inc, dec, remove, openDrawer, toast, clear, setProductCache } =
    useStore();
  const router = useRouter();
  const { hours, open: storeOpen } = useStoreHours();
  const closed = storeOpen === false;
  const [note, setNote] = useState("");
  const [wa, setWa] = useState(initialWa);
  useEffect(() => { setProductCache(initialProducts); }, [initialProducts, setProductCache]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("keranjang") === "1") openDrawer();
  }, [openDrawer]);
  const [loading, setLoading] = useState(false);

  const entries = Object.entries(cart).filter(([id]) => products[id]);

  async function checkout() {
    if (count === 0 || closed) return;
    if (!loggedIn) {
      toast("Masuk atau daftar dulu ya, biar pesananmu tersimpan.");
      router.push("/masuk?next=/keranjang");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: entries.map(([productId, qty]) => ({ productId, qty })),
          buyerNote: note,
          buyerWa: wa,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        toast("Sesi kamu habis. Silakan masuk lagi.");
        router.push("/masuk?next=/keranjang");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan.");
      clear();
      closeDrawer();
      router.push(`/pesanan/${data.code}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal membuat pesanan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* mobile sticky bar */}
      {count > 0 && (
        <div
          className="fixed left-3 right-3 bottom-3 z-[940] flex items-center justify-between gap-3 rounded-[10px] border-[3px] px-[14px] py-[11px] shadow-[4px_4px_0_rgba(20,12,6,.5)] md:hidden"
          style={{ background: "var(--wood-dark)", color: "#fdf3da", borderColor: "var(--line)" }}
        >
          <div>
            <span className="mono font-bold text-[15px]">{rp(total)}</span>
            <span className="mono block text-[11px] opacity-80">{count} barang di keranjang</span>
          </div>
          <button
            type="button"
            onClick={openDrawer}
            className="rounded-[7px] border-[2.5px] px-[14px] py-[9px] text-[14px] font-extrabold shadow-[2.5px_2.5px_0_rgba(0,0,0,.5)]"
            style={{ background: "var(--mustard)", color: "#33241a", borderColor: "#33241a" }}
          >
            Lihat Keranjang →
          </button>
        </div>
      )}

      <div className={`overlay ${drawerOpen ? "show" : ""}`} onClick={closeDrawer} />
      <aside className={`drawer ${drawerOpen ? "show" : ""}`} aria-label="Keranjang belanja">
        <div className="drawer-head">
          <h3>Keranjang Kamu</h3>
          <button className="x-btn" onClick={closeDrawer} type="button" aria-label="Tutup keranjang">
            ✕
          </button>
        </div>
        <div className="drawer-items">
          {entries.length === 0 ? (
            <div className="cart-empty">
              Keranjang kamu masih kosong.
              <br />
              Lihat katalog dulu, pilih akun yang kamu mau.
            </div>
          ) : (
            entries.map(([id, qty]) => {
              const p = products[id];
              return (
                <div className="cart-item" key={id}>
                  <div className="tile" style={{ background: p.tileBg, color: p.tileFg }}>
                    {p.letter}
                  </div>
                  <div>
                    <div className="ci-name">{p.name}</div>
                    <div className="ci-price">{rp(p.price)} / akun</div>
                    {p.isPreOrder && <span className="po-badge">Pre-Order</span>}
                  </div>
                  <div className="qty">
                    <button type="button" onClick={() => dec(id)} aria-label="Kurangi">
                      −
                    </button>
                    <b>{qty}</b>
                    <button type="button" onClick={() => inc(id)} aria-label="Tambah">
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    aria-label="Hapus"
                    className="ml-1 text-[15px]"
                    style={{ color: "var(--red-ink)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}

          {entries.length > 0 && (
            <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
              {!loggedIn && (
                <div
                  className="mono rounded-[8px] border-[2.5px] p-3 text-[12.5px]"
                  style={{ borderColor: "var(--line)", background: "var(--note-1)", color: "#3a2a1a" }}
                >
                  Belum masuk.{" "}
                  <Link href="/masuk?next=/keranjang" style={{ color: "var(--red-ink)", fontWeight: 700 }} onClick={closeDrawer}>
                    Masuk
                  </Link>{" "}
                  atau{" "}
                  <Link href="/daftar?next=/keranjang" style={{ color: "var(--red-ink)", fontWeight: 700 }} onClick={closeDrawer}>
                    daftar
                  </Link>{" "}
                  dulu untuk menyelesaikan pembelian.
                </div>
              )}
              <label className="field">
                <span>WhatsApp penerima (opsional)</span>
                <input className="input" type="tel" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="08xxxxxxxxxx" />
              </label>
              {entries.some(([id]) => products[id]?.isPreOrder) && <p className="po-banner">Ada produk Pre-Order. Akun dikirim setelah masa PO selesai atau kuota pembelian lunas terpenuhi, bukan langsung setelah bayar.</p>}
              <label className="field" style={{ marginBottom: 0 }}>
                <span>Catatan (opsional)</span>
                <input
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: minta profil private"
                />
              </label>
            </div>
          )}
        </div>
        <div className="drawer-foot">
          <div className="row-line">
            <span>Pengiriman</span>
            <span className="mono">GRATIS — digital</span>
          </div>
          <div className="row-line total">
            <span>Total</span>
            <span className="mono">{rp(total)}</span>
          </div>
          {closed ? (
            <button className="btn btn-red" type="button" disabled>
              Toko tutup — buka lagi {fmtTime(hours.open)} WIB
            </button>
          ) : loggedIn ? (
            <button className="btn btn-red" onClick={checkout} type="button" disabled={count === 0 || loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Membuat pesanan…
                </>
              ) : (
                "Bayar dengan QRIS →"
              )}
            </button>
          ) : (
            <Link className="btn btn-red" href="/masuk?next=/keranjang" onClick={closeDrawer} style={{ justifyContent: "center" }}>
              Masuk dulu untuk beli →
            </Link>
          )}
          <p className="kirim-note">
            {closed && "Keranjang tetap tersimpan — checkout bisa dilanjutkan saat toko buka. "}
            Setelah lunas, klaim akun via WhatsApp. Admin mengirim secara manual. Riwayat tersimpan di akunmu.
          </p>
        </div>
      </aside>
    </>
  );
}
