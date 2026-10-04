"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { rp, adminWaLink, formatDateTime } from "@/lib/utils";

type OrderData = {
  code: string;
  status: string;
  amount: number;
  subtotal: number;
  uniqueCode: number;
  buyerName: string | null;
  expiresAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  isPreOrder: boolean;
  qrString: string | null;
  qrImageUrl: string | null;
  items: {
    id: string;
    name: string;
    price: number;
    qty: number;
    productSlug: string;
    isPreOrder: boolean;
    poEta: string;
    poEndsAt: string | null;
    poMinQty: number;
  }[];
};

function useCountdown(expiresAt: string | undefined, active: boolean) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () => setLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    if (!active) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, active]);
  return left;
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Ubah QR (PNG berlatar putih) menjadi PNG transparan:
 * piksel putih jadi tembus pandang, modul gelap tetap hitam pekat.
 * Berguna agar QR menyatu dengan latar kertas tanpa kotak putih.
 */
function useTransparentQr(src: string | null | undefined) {
  const [out, setOut] = useState<string | null>(null);
  useEffect(() => {
    setOut(null);
    if (!src) return;
    let active = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!active) return;
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height);
        const px = data.data;
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], g = px[i + 1], b = px[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 190) {
            // piksel terang -> transparan sepenuhnya
            px[i + 3] = 0;
          } else if (lum < 100) {
            // modul gelap -> hitam pekat
            px[i] = px[i + 1] = px[i + 2] = 0;
            px[i + 3] = 255;
          } else {
            // tepi/abu -> semi transparan agar tetap tajam
            px[i] = px[i + 1] = px[i + 2] = 0;
            px[i + 3] = Math.max(0, Math.min(255, Math.round((190 - lum) / 90 * 255)));
          }
        }
        ctx.putImageData(data, 0, 0);
        if (active) setOut(c.toDataURL("image/png"));
      } catch {
        if (active) setOut(src);
      }
    };
    img.onerror = () => { if (active) setOut(src); };
    img.src = src;
    return () => { active = false; };
  }, [src]);
  return out;
}

export default function OrderPage({ code, adminWa }: { code: string; adminWa: string }) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [bigQr, setBigQr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // QR transparan (background putih dihapus) untuk tampilan menyatu dengan kertas.
  const qrSrc = useTransparentQr(order?.qrImageUrl);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${code}`, { cache: "no-store" });
      if (!res.ok) {
        setError(res.status === 401 ? "Sesi habis. Silakan masuk kembali untuk melihat pesananmu." : "Pesanan tidak ditemukan di akun ini.");
        return;
      }
      const data = (await res.json()) as OrderData;
      setError("");
      setOrder(data);
    } catch {
      setError("Gagal mengambil data pesanan.");
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  // Polling status: pendekatan tanpa klik "saya sudah bayar".
  useEffect(() => {
    if (!order) return;
    const pending = ["PENDING", "PAID", "CLAIMED"].includes(order.status);
    if (pending) {
      pollRef.current = setInterval(load, 4000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [order, load]);

  const left = useCountdown(order?.expiresAt, order?.status === "PENDING");
  const expired = order?.status === "PENDING" && left <= 0;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const buildWaMessage = (o: OrderData) => {
    const lines = [
      `Halo admin jajanakun.store, saya mau klaim akun pesanan saya:`,
      ``,
      `Kode pesanan: ${o.code}`,
      `Nama: ${o.buyerName || "Pelanggan"}`,
      `Subtotal: ${rp(o.subtotal)}`,
      `Kode unik: ${o.uniqueCode}`,
      `Total bayar: ${rp(o.amount)}`,
      ``,
      `Produk:`,
      ...o.items.map((it) => `- ${it.name} × ${it.qty} @ ${rp(it.price)} = ${rp(it.price * it.qty)}${it.isPreOrder ? ` (PRE-ORDER, estimasi ${it.poEta || "1-3 hari"})` : ""}`),
      ``,
      `Mohon diproses ya. Terima kasih!`,
    ];
    return lines.join("\n");
  };

  const claim = async () => {
    if (!order) return;
    setClaiming(true);
    setClaimError("");
    try {
      const res = await fetch(`/api/orders/${code}/claim`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencatat klaim.");
      // Navigasi tab yang sama tidak diblokir popup blocker. Pesan belum dikirim sampai pembeli menekan Kirim di WhatsApp.
      window.location.assign(adminWaLink(buildWaMessage(order), adminWa));
      await load();
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Koneksi bermasalah. Silakan coba lagi.");
    } finally { setClaiming(false); }
  };

  if (error) {
    return (
      <div className="wrap py-16">
        <div className="card text-center">
          <h2 className="slab text-[22px]">Aduh…</h2>
          <p style={{ color: "var(--ink-soft)" }}>{error}</p>
          <Link className="btn btn-red mt-4 inline-flex" href="/akun">
            Lihat Pesanan Saya
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="wrap py-16 text-center">
        <span className="mono" style={{ color: "var(--ink-soft)" }}>
          Memuat pesanan…
        </span>
      </div>
    );
  }

  const paid = order.status === "PAID" || order.status === "CLAIMED" || order.status === "DELIVERED";
  const claimed = order.status === "CLAIMED";
  const delivered = order.status === "DELIVERED";
  const statusLabel: Record<string, string> = {
    PENDING: "Menunggu Pembayaran",
    PAID: "Lunas — Siap Diklaim",
    CLAIMED: "Lunas — Sedang Diproses",
    DELIVERED: "Lunas — Akun Terkirim",
    CANCELLED: "Dibatalkan",
    REFUNDED: "Dana Dikembalikan",
  };

  return (
    <div className="wrap py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="sec-kicker" style={{ marginBottom: 2 }}>
            Halaman Pesanan
          </p>
          <h1 className="slab text-[26px] flex items-center gap-3">
            <span className="mono">{order.code}</span>
            <button type="button" onClick={copyCode} className="badge" style={{ cursor: "pointer" }} title="Salin kode">
              {copied ? "Tersalin ✓" : "Salin"}
            </button>
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
            Pesanan ini tersimpan di akunmu. Cek kapan saja lewat menu Akun Saya.
          </p>
        </div>
        <span className={`status-pill status-${order.status}`}>{statusLabel[order.status] || order.status}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* LEFT: payment */}
        <div className="card">
          {paid ? (
            <div className="success-box">
              <div className="stamp-big">Lunas</div>
              <p>Pembayaranmu sudah terverifikasi. Terima kasih!</p>
              {order.isPreOrder && (
                <div className="po-banner mt-4" style={{ textAlign: "left" }}>
                  <h3>Pesanan Pre-Order</h3>
                  <p>
                    Salah satu item kamu pre-order. Akun dikirim setelah masa PO selesai
                    {" "}
                    ({order.items.find((i) => i.isPreOrder)?.poEta || "1-3 hari kerja"}) atau setelah kuota PO terpenuhi.
                    Kirim pesan klaim untuk menghubungi admin. Klaim tidak mempercepat masa PO.
                  </p>
                </div>
              )}
            </div>
          ) : ["CANCELLED", "REFUNDED"].includes(order.status) ? (
            <div className="alert alert-warn"><strong>{statusLabel[order.status]}</strong>Pesanan ini tidak dapat dibayar lagi. Hubungi admin jika membutuhkan bantuan.</div>
          ) : expired ? (
            <div className="text-center">
              <h3 className="slab text-[20px]">Kode QR Sudah Kedaluwarsa</h3>
              <p style={{ color: "var(--ink-soft)" }}>
                Masa berlaku 30 menit sudah habis. Buat pesanan baru, lalu scan lagi.
              </p>
              <Link className="btn btn-red mt-3 inline-flex" href="/#katalog">
                Buat Pesanan Baru
              </Link>
            </div>
          ) : (
            <>
              <h3 className="slab text-[20px]">Scan untuk Bayar</h3>
              <p className="modal-sub">
                Gunakan aplikasi e-wallet atau m-banking apa saja yang punya QRIS. Nominal sudah pas — jangan diubah.
              </p>
              <div className="qr-frame" style={{ textAlign: "center" }}>
                {order.qrImageUrl ? (
                  <div style={{ width: "100%", display: "block", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => setBigQr(qrSrc || order.qrImageUrl!)}
                      style={{ display: "inline-block", background: "none", border: 0, padding: 8, cursor: "zoom-in" }}
                      aria-label="Perbesar QRIS"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrSrc || order.qrImageUrl}
                        alt="QRIS pembayaran"
                        style={{ display: "block", width: "min(300px, 100%)", aspectRatio: "1 / 1", height: "auto", objectFit: "contain", imageRendering: "pixelated" }}
                      />
                    </button>
                  </div>
                ) : (
                  <PaymentQr payload={order.qrString} />
                )}
                {order.qrImageUrl && (
                  <div className="flex items-center justify-center gap-2 flex-wrap" style={{ marginTop: 10, marginBottom: 10 }}>
                    <button type="button" className="btn btn-sm" onClick={() => setBigQr(qrSrc || order.qrImageUrl!)}>
                      Perbesar QR
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={saving}
                      onClick={() => {
                        const href = qrSrc || order.qrImageUrl!;
                        const a = document.createElement("a");
                        a.href = href;
                        a.download = `QRIS-${order.code}.png`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setSaving(true);
                        setTimeout(() => setSaving(false), 800);
                      }}
                    >
                      {saving ? "Tersimpan" : "Simpan QR"}
                    </button>
                  </div>
                )}
                <div className="mono" style={{ fontWeight: 700, fontSize: 21 }}>
                  {rp(order.amount)}
                </div>
                <div className="mono" style={{ color: "#a52f22", fontWeight: 700, marginTop: 4, fontSize: 13 }}>
                  Kode kedaluwarsa dalam {fmt(left)}
                </div>
                <div className="mono" style={{ fontSize: 12, color: "#6f5942", marginTop: 8 }}>
                  Kode pesanan: {order.code}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="spinner" style={{ borderColor: "color-mix(in srgb, var(--ink) 25%, transparent)", borderTopColor: "var(--ink)" }} />
                <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                  Menunggu verifikasi otomatis… halaman ini mengecek status setiap 4 detik.
                </span>
              </div>
              <p className="kirim-note">
                Tidak perlu klik &ldquo;saya sudah bayar&rdquo;. Sistem mendeteksi otomatis begitu pembayaran sukses.
              </p>
            </>
          )}

          <div className="mt-5 border-t-2 border-dashed pt-4" style={{ borderColor: "color-mix(in srgb, var(--ink) 25%, transparent)" }}>
            <div className="row-line">
              <span>Subtotal</span>
              <span className="mono">{rp(order.subtotal)}</span>
            </div>
            <div className="row-line">
              <span>Kode unik</span>
              <span className="mono">+{order.uniqueCode}</span>
            </div>
            <div className="row-line total">
              <span>Total dibayar</span>
              <span className="mono">{rp(order.amount)}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: items + claim */}
        <div className="card">
          <h3 className="slab text-[20px] mb-3">Barang yang Dibeli</h3>
          <div className="grid gap-3">
            {order.items.map((it) => (
              <div key={it.id} className="cart-item">
                <div style={{ flex: 1 }}>
                  <div className="ci-name">{it.name}</div>
                  <div className="ci-price">
                    {rp(it.price)} × {it.qty}
                  </div>
                </div>
                {it.isPreOrder && <div>
                  <span className="po-badge">PO • {it.poEta || "1–3 hari"}</span>
                  <p className="kirim-note">{it.poEndsAt ? `Batas: ${formatDateTime(it.poEndsAt)} WIB` : "Jadwal dikonfirmasi admin"}{it.poMinQty > 0 ? ` atau kuota ${it.poMinQty} akun lunas` : ""}</p>
                </div>}
              </div>
            ))}
          </div>

          {/* claim / delivery */}
          {paid && (
            <div className="mt-5">
              <div className="alert alert-info" style={{ marginBottom: 0 }}>
                <strong>{delivered ? "Akun sudah dikirim" : claimed ? "Klaim tercatat — lanjutkan di WhatsApp" : "Pembayaran lunas — klaim akunmu"}</strong>
                {delivered ? "Admin sudah menandai akun terkirim. Silakan periksa percakapan WhatsApp kamu." :
                  claimed ? "Pastikan pesan klaim sudah kamu kirim di WhatsApp. Tombol di bawah dapat dibuka kembali kapan saja." :
                  "Klik tombol di bawah. Pesan sudah berisi kode pesanan, produk, jumlah, dan total — tinggal kirim di WhatsApp."}
                {claimError && <p className="alert alert-error mt-3" role="alert">{claimError}</p>}
                <div style={{ marginTop: 12 }}>
                  {!claimed && !delivered ? (
                    <button className="btn btn-mustard" type="button" onClick={claim} disabled={claiming}>
                      {claiming ? "Memproses…" : "Klaim Akun via WhatsApp →"}
                    </button>
                  ) : (
                    <a className="btn btn-mustard" href={adminWaLink(buildWaMessage(order), adminWa)} target="_blank" rel="noreferrer">
                      {delivered ? "Hubungi Admin" : "Buka WhatsApp Lagi →"}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {order.status === "PENDING" && !expired && (
            <p className="kirim-note mt-4" style={{ textAlign: "left" }}>
              Tombol klaim akun akan muncul otomatis di sini setelah pembayaran lunas terverifikasi.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="btn btn-mustard" href="/#katalog">
          Kembali Belanja
        </Link>
        <Link className="btn" href="/akun">
          Lihat Pesanan Saya
        </Link>
      </div>

      {bigQr && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setBigQr(null)}
          style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(20,12,6,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: "min(440px, 100%)", textAlign: "center", background: "#fff" }}
          >
            <h3 className="slab text-[20px] mb-2">Scan QRIS</h3>
            <p className="modal-sub mb-3">Terangkan layar ke maksimal. Aplikasi e-wallet atau m-banking apa saja yang mendukung QRIS.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bigQr} alt="QRIS pembayaran" style={{ display: "block", width: "100%", maxWidth: 380, margin: "0 auto 12px", aspectRatio: "1 / 1", height: "auto", imageRendering: "pixelated" }} />
            <div className="mono" style={{ fontWeight: 700, fontSize: 24 }}>{order ? rp(order.amount) : ""}</div>
            <div className="mono" style={{ color: "#a52f22", fontWeight: 700, marginTop: 4, fontSize: 14 }}>Kode kedaluwarsa dalam {fmt(left)}</div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="btn"
                style={{ flex: 1 }}
                onClick={() => setBigQr(null)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn btn-mustard"
                style={{ flex: 1 }}
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = bigQr;
                  a.download = `QRIS-${order?.code || "pesanan"}.png`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
              >
                Simpan QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Render QR asli dari payload; jangan tampilkan QR palsu saat simulasi. */
function PaymentQr({ payload }: { payload: string | null }) {
  const [src, setSrc] = useState("");
  const simulation = !payload || /^(SIMQRIS|MANUAL)\|/.test(payload);
  useEffect(() => {
    let active = true;
    setSrc("");
    if (!simulation && payload) QRCode.toDataURL(payload, { width: 512, margin: 2 })
      .then((url) => { if (active) setSrc(url); }).catch(() => {});
    return () => { active = false; };
  }, [payload, simulation]);
  if (simulation) return <p className="alert alert-warn">{payload?.startsWith("SIMQRIS") ? "Mode uji coba — QRIS pembayaran nyata belum dikonfigurasi. Jangan melakukan transfer." : "QRIS belum tersedia. Hubungi admin, jangan melakukan transfer dahulu."}</p>;
  if (!src) return <p>Menyiapkan kode QR…</p>;
  return <img src={src} alt="QRIS pembayaran" style={{ display: "block", margin: "0 auto 12px", width: "min(300px, 100%)", aspectRatio: "1 / 1", height: "auto" }} />;
}
