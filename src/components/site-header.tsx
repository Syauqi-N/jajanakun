"use client";

import Link from "next/link";
import { useStore } from "./store-provider";

export type HeaderUser = { name: string | null; email: string } | null;

export function SiteHeader({ user }: { user: HeaderUser }) {
  const { count, openDrawer, ready } = useStore();
  return (
    <>
      <div className="topstrip">
        <div className="wrap">
          <span>TOKO AKUN PREMIUM — SURABAYA &amp; SEKITARNYA</span>
          <span>
            BUKA SETIAP HARI <b>08.00–22.00 WIB</b> • ADMIN FAST RESPON
          </span>
        </div>
      </div>
      <header className="site-header">
        <div className="wrap">
          <Link className="logo-img" href="/" aria-label="jajanakun.store">
            <img src="/logo.png" alt="JajanAkun.store" />
          </Link>
          <nav className="main-nav" aria-label="Menu utama">
            <Link href="/#katalog">Katalog</Link>
            <Link href="/#preorder">Pre-Order</Link>
            <Link href="/#carabeli">Cara Beli</Link>
            <Link href="/#faq">FAQ</Link>
          </nav>
          <div className="header-actions">
            <div className="jam-buka">
              Jam buka
              <br />
              <b>08.00 – 22.00 WIB</b>
            </div>
            {user ? (
              <Link className="btn btn-sm" href="/akun" title={user.email}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
                {user.name ? user.name.split(" ")[0] : "Akun"}
              </Link>
            ) : (
              <Link className="btn btn-sm btn-mustard" href="/masuk">
                Masuk
              </Link>
            )}
            <button className="cart-btn" onClick={openDrawer} type="button">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1.6" />
                <circle cx="19" cy="21" r="1.6" />
                <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21.5 7H6" />
              </svg>
              <span className="cart-label">Keranjang</span>
              <span className="cart-count">{ready ? count : 0}</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
