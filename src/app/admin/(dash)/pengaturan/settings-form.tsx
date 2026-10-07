"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Form pengaturan yang mengirim lewat fetch() ke route handler, lalu
 * navigasi manual. Menghindari redirect 303 yang bermasalah di balik
 * Cloudflare Tunnel. Tetap punya fallback: jika JS mati, form POST biasa.
 */
export function SettingsForm({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set("_json", "1");
    try {
      const res = await fetch("/admin/pengaturan/save", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setMsg({ ok: true, text: "Pengaturan tersimpan." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: data?.error || "Gagal menyimpan. Coba lagi." });
      }
    } catch {
      setMsg({ ok: false, text: "Koneksi bermasalah. Coba lagi." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} action="/admin/pengaturan/save" method="post" className="card" style={{ maxWidth: 620 }}>
      {msg && (
        <div className={"alert " + (msg.ok ? "alert-success" : "alert-error")} style={{ marginBottom: 16 }}>
          <strong>{msg.ok ? "Berhasil" : "Gagal"}</strong>
          {msg.text}
        </div>
      )}
      {children}
      <button className="btn btn-green mt-2" type="submit" disabled={sending}>
        {sending ? "Menyimpan…" : "Simpan Pengaturan"}
      </button>
    </form>
  );
}
