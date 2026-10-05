"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Form admin generik. Mengirim datanya lewat fetch() ke POST /admin/action,
 * lalu me-refresh data halaman. Tidak memakai server action agar tidak
 * terkena masalah redirect host internal di balik Cloudflare Tunnel.
 *
 * Tetap punya fallback: tanpa JS, form mengirim POST biasa ke /admin/action.
 */
export function AdminForm({
  action,
  redirect,
  className,
  style,
  children,
  confirmText,
}: {
  /** Nama aksi, mis. "saveProduct". */
  action: string;
  /** Path tujuan setelah sukses (default: halaman saat ini). */
  redirect?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  /** Bila diisi, tampilkan konfirmasi sebelum mengirim. */
  confirmText?: string;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirmText && !window.confirm(confirmText)) return;
    setSending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("_name", action);
    fd.set("_redirect", redirect || window.location.pathname);
    try {
      const res = await fetch("/admin/action", { method: "POST", body: fd, redirect: "manual" });
      if (res.type === "opaqueredirect" || res.ok || res.status === 0 || res.status === 303) {
        // Sukses — muat ulang data halaman.
        router.refresh();
        form.reset();
      } else {
        alert("Gagal menyimpan. Coba lagi.");
      }
    } catch {
      alert("Koneksi bermasalah. Coba lagi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      action="/admin/action"
      method="post"
      className={className}
      style={style}
      data-sending={sending ? "1" : undefined}
    >
      <input type="hidden" name="_name" value={action} />
      {redirect && <input type="hidden" name="_redirect" value={redirect} />}
      {children}
    </form>
  );
}
