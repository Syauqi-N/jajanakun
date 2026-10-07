import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeaderServer } from "@/components/site-header-server";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawerServer } from "@/components/cart-drawer-server";
import { Toast } from "@/components/toast";
import { ProductCard, ProductThumb, type ProductDTO } from "@/components/catalog";
import { BuyBox } from "./buy-box";
import { getProductBySlug, getCatalogProducts } from "@/lib/products";
import { adminWaLink, formatDateTime } from "@/lib/utils";
import { getSetting, SETTING_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) notFound();

  const { dto } = data;
  // Admin khusus produk bila diisi; selain itu nomor toko.
  const adminWa = data.product.adminWa || (await getSetting(SETTING_KEYS.adminWa));
  const all = await getCatalogProducts();
  const others = all.filter((p) => p.id !== dto.id).slice(0, 4);

  return (
    <>
      <SiteHeaderServer />
      <CartDrawerServer />
      <Toast />
      <main className="wrap py-10">
        <nav className="mono mb-5 text-xs" style={{ color: "var(--ink-soft)" }}>
          <Link href="/">Beranda</Link> / <Link href="/#katalog">Katalog</Link> / <span>{dto.category}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <ProductThumb p={dto} className="detail-thumb" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="spec">
                <span className="k">Durasi</span>
                <span className="v">{dto.duration}</span>
              </div>
              <div className="spec">
                <span className="k">Garansi</span>
                <span className="v">{dto.warranty}</span>
              </div>
              <div className="spec">
                <span className="k">Kategori</span>
                <span className="v">{dto.category}</span>
              </div>
              <div className="spec">
                <span className="k">Jenis Pengiriman</span>
                <span className="v">{dto.isPreOrder ? "Pre-Order" : "Manual via WhatsApp"}</span>
              </div>
            </div>
          </div>

          <div>
            {dto.badge && <span className="ribbon" style={{ position: "static", display: "inline-block", marginBottom: 10, transform: "rotate(-2deg)" }}>{dto.badge.toUpperCase()}</span>}
            {dto.isPreOrder && <span className="po-badge" style={{ marginBottom: 10 }}>PRE-ORDER • {dto.poEta || "1-3 hari kerja"}</span>}
            <h1 className="slab text-[28px] leading-tight">{dto.name}</h1>

            <div className="price-row mt-5">
              {dto.priceWas ? <span className="price-was">{`Rp${dto.priceWas.toLocaleString("id-ID")}`}</span> : null}
              <span className="price-now" style={{ fontSize: 28 }}>
                {`Rp${dto.price.toLocaleString("id-ID")}`}
              </span>
            </div>
            <div className="mt-1">
              <span className="stamp">{dto.warranty}</span>
            </div>

            {dto.isPreOrder && (
              <div className="po-banner mt-4">
                <h3>{dto.poClosed ? "Batch PO sudah ditutup" : "Ketentuan Pre-Order"}</h3>
                <p>Akun dikirim setelah {dto.poEndsAt ? formatDateTime(dto.poEndsAt) + " WIB" : (dto.poEta || "1–3 hari")}
                  {dto.poMinQty > 0 ? ` atau setelah minimal ${dto.poMinQty} akun dalam batch ini sudah dibayar` : ""}.
                  Pengiriman tetap dilakukan admin via WhatsApp, bukan otomatis.</p>
              </div>
            )}
            <BuyBox product={dto} />

            <div className="mt-6 rounded-[10px] border-[3px] p-4" style={{ borderColor: "var(--line)", background: "var(--paper-2)" }}>
              <p className="mono mb-2 text-xs font-bold" style={{ letterSpacing: ".08em" }}>
                CARA BARANG DIKIRIM
              </p>
              <ol style={{ margin: 0, paddingLeft: 18, color: "var(--ink-soft)", fontSize: 14.5 }}>
                {dto.isPreOrder ? (
                  <>
                    <li>Checkout dan bayar QRIS — nominal sudah pas, verifikasi otomatis.</li>
                    <li>Setelah lunas, tekan tombol <b>Klaim Akun</b> di halaman pesanan.</li>
                    <li>Akun dikirim setelah masa PO selesai ({dto.poEta || "1-3 hari kerja"}) — admin hubungi lewat WhatsApp.</li>
                  </>
                ) : (
                  <>
                    <li>Checkout, lalu scan QRIS — nominalnya sudah pas, verifikasi otomatis.</li>
                    <li>Setelah lunas, tekan tombol <b>Klaim Akun</b> di halaman pesanan.</li>
                    <li>Admin mengirim akun lewat WhatsApp dengan menyebut kode pesananmu.</li>
                  </>
                )}
              </ol>
              <a
                className="btn btn-green btn-sm mt-3 inline-flex"
                href={adminWaLink(`Halo admin, saya mau tanya soal ${dto.name}.`, adminWa)}
                target="_blank"
                rel="noreferrer"
              >
                Tanya Admin
              </a>
            </div>
          </div>
        </div>

        {dto.description?.trim() && (
          <section className="block" style={{ marginTop: 28 }}>
            <div className="sec-head">
              <p className="sec-kicker">Detail</p>
              <h2>Deskripsi Produk</h2>
            </div>
            <div className="card" style={{ maxWidth: 860 }}>
              <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {dto.description.trim()}
              </p>
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section className="block">
            <div className="sec-head">
              <p className="sec-kicker">Belum yakin?</p>
              <h2>Produk Lainnya</h2>
            </div>
            <div className="catalog-grid">
              {others.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
