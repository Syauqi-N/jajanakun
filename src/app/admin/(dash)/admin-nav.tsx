"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/produk", label: "Produk" },
  { href: "/admin/kategori", label: "Kategori" },
  { href: "/admin/pesanan", label: "Pesanan" },
  { href: "/admin/garansi", label: "Garansi" },
  { href: "/admin/laporan", label: "Laporan" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
  { href: "/admin/admin", label: "Admin", superOnly: true },
];

export function AdminNav({ isSuper = false, adminEmail }: { isSuper?: boolean; adminEmail?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = LINKS.filter((l) => !l.superOnly || isSuper);

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-inner">
        <Link className="logo-img" href="/admin" aria-label="jajanakun.store admin">
          <img src="/logo.png" alt="JajanAkun.store" style={{ height: 44 }} />
          <span className="admin-tag">ADMIN</span>
        </Link>

        <nav className="admin-tabs">
          {links.map((l) => {
            const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className="admin-tab" aria-current={active ? "page" : undefined}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-topbar-actions">
          <Link className="btn btn-sm" href="/" target="_blank">
            Lihat Toko ↗
          </Link>
          <form action="/admin/logout" method="post">
            <button className="btn btn-sm btn-red" type="submit">
              Keluar
            </button>
          </form>
          <button className="admin-burger" type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu admin">
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="admin-mobile-tabs">
          {links.map((l) => {
            const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="admin-tab"
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
