"use client";

import { useActionState, useState } from "react";
import { saveAdmin } from "../../actions/settings";

type Result = { error?: string; ok?: string; password?: string };

export function AdminCreateForm() {
  const [state, action, pending] = useActionState<Result | null, FormData>(
    async (_prev, fd) => saveAdmin(fd),
    null
  );
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <form action={action} className="card mb-4 flex flex-wrap items-end gap-4">
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

      {state?.error && (
        <p className="card mb-4" style={{ background: "#f6d9d3", borderColor: "var(--red)" }}>
          {state.error}
        </p>
      )}

      {state?.password && (
        <div className="card mb-4" style={{ background: "#fbeecb", borderColor: "var(--mustard)" }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>Admin dibuat ✅</p>
          <p style={{ marginBottom: 8 }}>
            Berikan kredensial ini ke pemilik akun. <b>Password hanya tampil sekali.</b>
          </p>
          <div className="mono" style={{ background: "#fff", padding: "10px 12px", borderRadius: 8, fontSize: 14 }}>
            {state.password}
          </div>
          <button
            className="btn btn-sm btn-mustard mt-3"
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(state.password || "");
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
