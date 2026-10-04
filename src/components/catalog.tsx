"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore, type CartProduct } from "./store-provider";
import { PoCarousel } from "./po-carousel";
import { rp } from "@/lib/utils";

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  duration: string;
  warranty: string;
  price: number;
  priceWas: number | null;
  tileBg: string;
  tileFg: string;
  letter: string;
  featured: boolean;
  badge: string | null;
  stock: number;
  imageUrl: string | null;
  isPreOrder: boolean;
  poEta: string;
  poMinQty: number;
  poEndsAt: string | null;
  poClosed: boolean;
  /** Jumlah akun yang sudah lunas di batch ini (untuk bar kuota). */
  poClaimed: number;
};

function stockLabel(p: ProductDTO): { text: string; cls: string } {
  if (p.isPreOrder) return { text: "Pre-Order", cls: "badge-mustard" };
  return { text: "Tersedia • Kirim via WhatsApp", cls: "badge-green" };
}

export function ProductThumb({ p, className = "tag-thumb" }: { p: ProductDTO; className?: string }) {
  if (p.imageUrl) {
    return (
      <div className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imageUrl} alt={p.name} loading="lazy" />
      </div>
    );
  }
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: p.tileBg }}>
      <span
        style={{
          fontFamily: "'Alfa Slab One', serif",
          fontSize: className === "detail-thumb" ? 96 : 44,
          color: p.tileFg,
        }}
      >
        {p.letter}
      </span>
    </div>
  );
}

export function ProductCard({ p, mini = false }: { p: ProductDTO; mini?: boolean }) {
  const { add, setProductCache } = useStore();

  const cartProduct: CartProduct = useMemo(
    () => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      stock: p.isPreOrder ? 99 : p.stock,
      tileBg: p.tileBg,
      tileFg: p.tileFg,
      letter: p.letter,
      isPreOrder: p.isPreOrder,
    }),
    [p]
  );

  useEffect(() => {
    setProductCache([cartProduct]);
  }, [cartProduct, setProductCache]);

  const sl = stockLabel(p);
  const soldOut = p.poClosed;

  return (
    <article className={`tag-card ${mini ? "mini" : ""}`}>
      {!mini && <ProductThumb p={p} />}
      <div className="tag-top">
        {p.badge && !mini && <span className="ribbon">{p.badge.toUpperCase()}</span>}
        {mini && (
          <div className="tile" style={{ background: p.tileBg, color: p.tileFg }}>
            {p.letter}
          </div>
        )}
        <div>
          <Link href={`/produk/${p.slug}`} className={`tag-name block hover:underline`} style={{ textDecorationColor: "var(--red)" }}>
            {p.name}
          </Link>
          <div className="tag-dur">
            {p.duration} • {p.category}
          </div>
          <div style={{ marginTop: 5, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {p.isPreOrder ? (
              <span className="po-badge">{p.poClosed ? "PO ditutup" : `PO • ${p.poEta || "1–3 hari"}`}</span>
            ) : (
              <span className={`badge ${soldOut ? "badge-red" : ""}`} style={{ fontSize: 10 }}>
                {sl.text}
              </span>
            )}
          </div>
        </div>
      </div>
      {!mini && <p className="tag-desc">{p.description}</p>}
      <div className="price-row">
        {p.priceWas ? <span className="price-was">{rp(p.priceWas)}</span> : null}
        <span className="price-now">{rp(p.price)}</span>
      </div>
      <div className="tag-foot">
        <span className="stamp">{p.isPreOrder ? "PRE-ORDER" : p.warranty}</span>
        {soldOut ? (
          <button className="add-btn" type="button" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
            PO Ditutup
          </button>
        ) : (
          <button className="add-btn" type="button" onClick={() => add(cartProduct)}>
            + Keranjang
          </button>
        )}
      </div>
    </article>
  );
}

export function Catalog({ products }: { products: ProductDTO[] }) {
  const [filter, setFilter] = useState("Semua");
  const [query, setQuery] = useState("");

  // Produk pre-order ditampilkan di seksi khusus PO, bukan di katalog utama.
  const readyProducts = useMemo(() => products.filter((p) => !p.isPreOrder), [products]);

  const categories = useMemo(() => {
    const set = new Set(readyProducts.map((p) => p.category));
    return ["Semua", ...Array.from(set)];
  }, [readyProducts]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return readyProducts.filter((p) => {
      const okCat = filter === "Semua" || p.category === filter;
      const okQ = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [readyProducts, filter, query]);

  return (
    <>
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter kategori">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="search-box">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari aplikasi apa?"
            aria-label="Cari produk"
          />
        </div>
      </div>
      <div className="catalog-grid">
        {list.length === 0 ? (
          <div className="empty-msg">Belum ada yang cocok. Coba kata kunci lain.</div>
        ) : (
          list.map((p) => <ProductCard key={p.id} p={p} />)
        )}
      </div>
    </>
  );
}

export function FeaturedTabs({ products }: { products: ProductDTO[] }) {
  const [tab, setTab] = useState<"terlaris" | "po">("terlaris");
  const featured = products.filter((p) => p.featured && !p.isPreOrder).slice(0, 4);
  const po = products.filter((p) => p.isPreOrder);
  const shown = tab === "po" ? po : featured;

  // Bila pengunjung datang lewat tautan #preorder (nav/hero), langsung buka tab Pre-Order.
  useEffect(() => {
    const apply = () => {
      if (window.location.hash === "#preorder" && po.length > 0) setTab("po");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [po.length]);

  return (
    <div>
      <div className="mini-tabs" role="tablist" aria-label="Pilihan etalase">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "terlaris"}
          className={`mini-tab ${tab === "terlaris" ? "is-active" : ""}`}
          onClick={() => setTab("terlaris")}
        >
          Terlaris
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "po"}
          className={`mini-tab mini-tab-po ${tab === "po" ? "is-active" : ""}`}
          onClick={() => setTab("po")}
          id="preorder"
        >
          Pre-Order
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="card">{tab === "po" ? "Belum ada batch PO dibuka. Cek lagi nanti, ya." : "Belum ada produk terlaris hari ini."}</p>
      ) : (
        <div className="featured-panel">
          {tab === "po" ? (
            <>
              {po.length > 1 && <p className="po-carousel-hint" aria-hidden="true">GESER UNTUK LIHAT SELENGKAPNYA →</p>}
              <PoCarousel>
                {po.map((p) => (
                  <div className="po-carousel-item" key={p.id}>
                    <ProductCard p={p} mini />
                    <PoQuotaBar p={p} compact />
                  </div>
                ))}
              </PoCarousel>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {shown.map((p) => (
                <ProductCard key={p.id} p={p} mini />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Bar sisa kuota batch PO: berapa akun sudah lunas dari target minimum. */
export function PoQuotaBar({ p, compact = false }: { p: ProductDTO; compact?: boolean }) {
  const target = p.poMinQty;
  const claimed = p.poClaimed;
  const pct = target > 0 ? Math.min(100, Math.round((claimed / target) * 100)) : 0;
  const sisa = target > 0 ? Math.max(0, target - claimed) : null;

  if (p.poClosed) {
    return (
      <div className={`po-quota po-quota-closed ${compact ? "is-compact" : ""}`}>
        <span className="po-quota-label">Batch PO ditutup — menunggu pengiriman admin</span>
      </div>
    );
  }

  return (
    <div className={`po-quota ${compact ? "is-compact" : ""}`}>
      <div className="po-quota-head">
        <span className="po-quota-label">
          {target > 0 ? (
            <>
              Kuota <b>{claimed}</b>/{target}
            </>
          ) : (
            <>Batch PO dibuka</>
          )}
        </span>
        {sisa !== null && (
          <span className="po-quota-sisa">
            {sisa === 0 ? "Penuh ✓" : `Kurang ${sisa}`}
          </span>
        )}
      </div>
      {target > 0 && (
        <div
          className="po-quota-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={claimed}
          aria-label={`Kuota PO ${claimed} dari ${target} akun`}
        >
          <span className="po-quota-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export function FeaturedGrid({ products }: { products: ProductDTO[] }) {
  const featured = products.filter((p) => p.featured && !p.isPreOrder).slice(0, 4);
  return (
    <div className="grid grid-cols-2 gap-3">
      {featured.map((p) => (
        <ProductCard key={p.id} p={p} mini />
      ))}
    </div>
  );
}

export function PreOrderSection({ products }: { products: ProductDTO[] }) {
  const po = products.filter((p) => p.isPreOrder);

  return (
    <section className="block" id="preorder">
      <div className="wrap">
        <div className="sec-head">
          <p className="sec-kicker">Harga PO Lebih Murah</p>
          <h2>Pre-Order — Harga Lebih Hemat</h2>
          <p>
            Pesan lebih awal, harganya lebih murah. Akun dikirim setelah masa PO selesai atau kuota pembelian terpenuhi
            (biasanya 1–3 hari kerja). Admin akan menghubungimu lewat WhatsApp saat akun siap.
          </p>
        </div>
        <div className="catalog-grid">
          {po.length === 0 && <p className="card">Belum ada batch PO dibuka. Cek lagi nanti, ya.</p>}
          {po.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Marquee() {
  const items = [
    "Promo Oktober — Diskon sampai 96%",
    "Garansi sampai 30 Hari",
    "Bayar QRIS, Verifikasi Otomatis",
    "Akun Dikirim Setelah Lunas",
    "Admin Fast Respon 08.00–22.00 WIB",
    "Harga Kaki Lima, Kualitas Bintang Lima",
  ];
  const chunk = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {chunk.map((t, i) => (
          <span key={i}>
            {t}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}
