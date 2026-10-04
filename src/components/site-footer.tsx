import Link from "next/link";
import { adminWaLink } from "@/lib/utils";
import { getSetting, SETTING_KEYS } from "@/lib/settings";

export async function SiteFooter() {
  const adminWa = await getSetting(SETTING_KEYS.adminWa);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div>
          <Link className="logo-img" href="/" aria-label="jajanakun.store">
            <img src="/logo.png" alt="JajanAkun.store" style={{ height: 44 }} />
          </Link>
          <p>Toko akun premium untuk warga Surabaya dan sekitarnya. Harga kaki lima, garansi sungguhan.</p>
        </div>
        <div>
          <h4>Toko</h4>
          <Link href="/#katalog">Katalog</Link>
          <Link href="/#preorder">Pre-Order</Link>
          <Link href="/#carabeli">Cara Beli</Link>
          <Link href="/#faq">FAQ</Link>
        </div>
        <div>
          <h4>Bantuan</h4>
          <Link href="/akun">Pesanan Saya</Link>
          <a href={adminWaLink("Halo admin jajanakun.store, saya mau klaim garansi.", adminWa)} target="_blank" rel="noreferrer">
            Klaim Garansi
          </a>
          <Link href="/#carabeli">Cara Pembayaran</Link>
          <Link href="/#faq">Pertanyaan Umum</Link>
        </div>
      </div>
      <div className="foot-bar">
        <div className="wrap">
          <span>© {new Date().getFullYear()} JAJANAKUN.STORE — SURABAYA, JAWA TIMUR</span>
          <span>BUKA 08.00–22.00 WIB • BAYAR QRIS • GARANSI SUNGGUHAN</span>
        </div>
      </div>
    </footer>
  );
}
