import Link from "next/link";
import { SiteHeaderServer } from "@/components/site-header-server";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawerServer } from "@/components/cart-drawer-server";
import { Toast } from "@/components/toast";
import { Catalog, FeaturedTabs, Marquee } from "@/components/catalog";
import { getCatalogProducts } from "@/lib/products";
import { adminWaLink } from "@/lib/utils";
import { getSetting, getStoreHours, SETTING_KEYS, parseMarquee } from "@/lib/settings";
import { formatHours } from "@/lib/store-hours";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const adminWa = await getSetting(SETTING_KEYS.adminWa);
  const jamBuka = formatHours(await getStoreHours());
  const marqueeItems = parseMarquee(await getSetting(SETTING_KEYS.marqueeItems));
  const products = await getCatalogProducts();

  return (
    <>
      <SiteHeaderServer />
      <CartDrawerServer />
      <Toast />

      <main>
        {/* HERO */}
        <div className="pt-11">
          <div className="wrap grid gap-8 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:items-start">
            <div className="papan">
              <div className="mb-4 flex items-center gap-3" style={{ color: "var(--mustard-soft)" }} aria-hidden="true">
                <span className="h-0.5 flex-1 opacity-60" style={{ background: "currentColor" }} />
                <svg width="120" height="18" viewBox="0 0 120 18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 9 C 14 1, 22 17, 34 9 S 54 1, 60 9 S 86 17, 98 9 S 114 3, 118 9" />
                  <circle cx="60" cy="9" r="2.6" fill="currentColor" stroke="none" />
                </svg>
                <span className="h-0.5 flex-1 opacity-60" style={{ background: "currentColor" }} />
              </div>
              <p className="papan-kicker">Toko Digital • Est. 2026 • Surabaya</p>
              <h1>
                Cari akun premium?
                <br />
                <span className="hl">Di sini aja.</span>
              </h1>
              <p className="lead">
                Netflix, Spotify, Canva, sampai ChatGPT — semua ada, harga kaki lima, kualitas bintang lima. Bayar QRIS,
                verifikasi otomatis. Setelah lunas, klaim akunmu lewat WhatsApp dan admin langsung kirim. Ada juga pilihan
                pre-order dengan harga lebih murah.
              </p>
              <div className="papan-cta">
                <a className="btn btn-red" href="#katalog">
                  Lihat Katalog ↓
                </a>
                <a className="btn btn-ghost" href="#preorder">
                  Harga PO Lebih Murah
                </a>
              </div>
              <div className="papan-meta">
                <span>Garansi sampai 30 hari</span>
                <span>Bayar QRIS semua e-wallet &amp; bank</span>
                <span>Stok akun dicek setiap hari</span>
              </div>
            </div>

            <div>
              <div className="mx-0.5 mb-3 flex items-baseline justify-between gap-3">
                <h2 className="slab text-[21px]" id="preorder">Etalase Pilihan</h2>
                <span className="mono text-xs" style={{ color: "var(--ink-soft)", letterSpacing: ".08em" }}>
                  UPDATE: SEKARANG • STOK CEK SENDIRI
                </span>
              </div>
              <FeaturedTabs products={products} />
            </div>
          </div>
        </div>

        <Marquee items={marqueeItems} />

        {/* KATALOG */}
        <section className="block" id="katalog">
          <div className="wrap">
            <div className="sec-head">
              <p className="sec-kicker">Etalase Toko</p>
              <h2>Katalog Akun Premium</h2>
              <p>
                Semua akun bergaransi. Kalau error sebelum masa garansi habis, langsung diganti baru — tanpa drama.
              </p>
            </div>
            <Catalog products={products} />
          </div>
        </section>

        {/* CARA BELI */}
        <section className="block" id="carabeli">
          <div className="wrap">
            <div className="sec-head">
              <p className="sec-kicker">Gampang, Cepat</p>
              <h2>Cara Beli — 3 Langkah Saja</h2>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <h3>Pilih Akunmu</h3>
                <p>
                  Lihat katalog, klik <b>+ Keranjang</b> pada akun yang kamu mau. Bisa beli lebih dari satu sekaligus.
                </p>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <h3>Bayar dengan QRIS</h3>
                <p>
                  Scan kode QR dengan e-wallet atau m-banking apa saja. Nominal sudah pas, verifikasi otomatis — tidak
                  perlu kirim bukti transfer.
                </p>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <h3>Klaim Akun via WhatsApp</h3>
                <p>
                  Setelah lunas, tombol <b>Klaim Akun</b> muncul di halaman pesanan. Klik tombol itu — pesan WhatsApp
                  otomatis terisi lengkap, admin langsung mengirim akunmu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PEMBAYARAN + TESTIMONI */}
        <section className="block">
          <div className="wrap split">
            <div className="pay-board">
              <h3>Bayar Bagaimana?</h3>
              <p>Satu QR untuk semuanya. Scan dengan aplikasi apa saja yang punya QRIS:</p>
              <div className="pay-chips">
                <span className="pay-chip hero-chip">QRIS</span>
                <span className="pay-chip">DANA</span>
                <span className="pay-chip">OVO</span>
                <span className="pay-chip">GoPay</span>
                <span className="pay-chip">ShopeePay</span>
                <span className="pay-chip">m-Banking</span>
              </div>
              <p className="pay-note">
                Pembayaran dicek otomatis oleh sistem. Lunas → pesanan langsung diproses, tanpa konfirmasi manual ke
                admin.
              </p>
            </div>
            <div className="testi-board">
              <h3>Kata Yang Sudah Pernah Beli</h3>
              <div className="notes">
                <article className="note n1">
                  <p>&ldquo;Akunnya langsung jadi, tidak sampai 5 menit. Adminnya fast respon, ditanya apa saja dijawab.&rdquo;</p>
                  <footer>
                    <span className="stars">★★★★★</span>
                    <br />
                    Bagas — Rungkut, Surabaya
                  </footer>
                </article>
                <article className="note n2">
                  <p>&ldquo;Sudah langganan Spotify 3 kali di sini, aman terus. Harganya lebih murah dibanding yang lain.&rdquo;</p>
                  <footer>
                    <span className="stars">★★★★★</span>
                    <br />
                    Nadia — Sidoarjo
                  </footer>
                </article>
                <article className="note n3">
                  <p>&ldquo;Netflix pernah error pertengahan bulan, langsung diganti baru. Garansinya sungguhan, bukan cuma omongan.&rdquo;</p>
                  <footer>
                    <span className="stars">★★★★★</span>
                    <br />
                    Putri — Gresik
                  </footer>
                </article>
                <article className="note n4">
                  <p>&ldquo;Bayar QRIS gampang, nominal sudah pas. Cocok untuk yang tidak suka ribet seperti aku.&rdquo;</p>
                  <footer>
                    <span className="stars">★★★★★</span>
                    <br />
                    Fajar — Wonokromo, Surabaya
                  </footer>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="block" id="faq">
          <div className="wrap">
            <div className="sec-head">
              <p className="sec-kicker">Sering Ditanyakan</p>
              <h2>FAQ</h2>
            </div>
            <div className="faq-list">
              <details className="faq">
                <summary>Akunnya resmi? Aman sampai kena banned?</summary>
                <p>
                  Semua akun yang dijual adalah akun resmi yang dibayar melalui jalur legal. Selama pemakaian normal
                  (tidak dibagi lagi ke orang lain), akun aman sampai masa aktif habis.
                </p>
              </details>
              <details className="faq">
                <summary>Bagaimana cara klaim garansinya?</summary>
                <p>
                  Cukup chat admin + sebutkan kode pesananmu. Kalau akun error sebelum garansi habis, langsung diganti
                  akun baru atau sisa masa aktif diganti — pilih yang paling cepat untukmu.
                </p>
              </details>
              <details className="faq">
                <summary>Bayar bisa pakai apa saja?</summary>
                <p>
                  Bisa semua yang mendukung QRIS: DANA, OVO, GoPay, ShopeePay, dan semua m-banking. Satu kode QR untuk
                  semuanya, verifikasinya otomatis.
                </p>
              </details>
              <details className="faq">
                <summary>Akun dikirim kapan setelah bayar?</summary>
                <p>
                  Untuk produk ready, setelah pembayaran lunas kamu tekan tombol <b>Klaim Akun</b> di halaman pesanan —
                  admin langsung mengirim akunmu lewat WhatsApp, biasanya dalam beberapa menit (jam {jamBuka}).
                  Untuk produk pre-order, akun dikirim setelah masa PO selesai (1–3 hari kerja).
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* CTA strip */}
        <section className="block">
          <div className="wrap">
            <div className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="slab text-[20px]">Masih bingung?</h3>
                <p style={{ color: "var(--ink-soft)", margin: "4px 0 0", fontSize: 14.5 }}>
                  Chat admin langsung — tanya apa saja dijawab, jam {jamBuka}.
                </p>
              </div>
              <a
                className="btn btn-green"
                href={adminWaLink("Halo admin jajanakun.store, saya mau tanya...", adminWa)}
                target="_blank"
                rel="noreferrer"
              >
                Chat Admin via WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
