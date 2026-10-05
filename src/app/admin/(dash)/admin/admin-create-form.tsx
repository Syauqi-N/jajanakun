"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminCreateForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    setPassword("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("_name", "saveAdmin");
    fd.set("_json", "1");
    try {
      const res = await fetch("/admin/action", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setError(data.error || "Gagal menambah admin.");
      } else {
        if (data.password) setPassword(data.password);
        form.reset();
        router.refresh();
      }
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} action="/admin/action" method="post" className="card mb-4 flex flex-wrap items-end gap-4">
        <input type="hidden" name="_name" value="saveAdmin" />
        <label className="field" style={{ marginBottom: 0, flex: "1 1 220px" }}>
          <span>Email admin</span>
          <input className="input" name="email" type="email" placeholder="nama@jajanakun.store" required />
        </label>
        <label className="field" style={{ marginBottom: 0, flex: "1 1 180px" }}>
          <span>Nama</span>
          <input className="input" name="name" placeholder="mis. Budi" />
        </label>
        <label className="field" style={{ marginBottom: 0, flex: "1 1 200px" }}>
          <span>Password (kosong = dibuat otomatis)</span>
          <input className="input" name="password" type="text" placeholder="min. 6 karakter" />
        </label>
        <button className="btn btn-green" type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : "+ Tambah Admin"}
        </button>
      </form>

      {error && (
        <p className="card mb-4" style={{ background: "#f6d9d3", borderColor: "var(--red)" }}>
          {error}
        </p>
      )}

      {password && (
        <div className="card mb-4" style={{ background: "#fbeecb", borderColor: "var(--mustard)" }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>Admin dibuat ✅</p>
          <p style={{ marginBottom: 8 }}>
            Berikan kredensial ini ke pemilik akun. <b>Password hanya tampil sekali.</b>
          </p>
          <div className="mono" style={{ background: "#fff", padding: "10px 12px", borderRadius: 8, fontSize: 14 }}>
            {password}
          </div>
          <button
            className="btn btn-sm btn-mustard mt-3"
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(password);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Tersalin ✓" : "Salin password"}
          </button>
        </div>
      )}
    </div>
  );
}
