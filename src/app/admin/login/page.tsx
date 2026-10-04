"use client";

import { useActionState } from "react";
import { loginAction } from "../actions/auth";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-dvh items-center justify-center p-5" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[400px]">
        <div className="mb-5 text-center">
          <img src="/logo.png" alt="jajanakun.store" style={{ height: 76, margin: "0 auto", display: "block" }} />
          <p className="mono mt-4 text-xs" style={{ color: "var(--ink-soft)", letterSpacing: ".1em" }}>
            PANEL ADMIN
          </p>
        </div>
        <form className="card" action={action}>
          <h1 className="slab mb-4 text-[22px]">Masuk Admin</h1>
          {state?.error && (
            <div
              className="mono mb-4 rounded-[8px] border-[2.5px] p-3 text-[13px]"
              style={{ borderColor: "var(--line)", background: "var(--note-4)", color: "#7a2020" }}
            >
              {state.error}
            </div>
          )}
          <label className="field">
            <span>Email</span>
            <input className="input" name="email" type="email" autoComplete="email" placeholder="admin@jajanakun.store" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" name="pass" type="password" autoComplete="current-password" required />
          </label>
          <button className="btn btn-red w-full justify-center" type="submit" disabled={pending}>
            {pending ? (
              <>
                <span className="spinner" /> Masuk…
              </>
            ) : (
              "Masuk"
            )}
          </button>
          <p className="kirim-note" style={{ marginTop: 14 }}>
            Khusus pengelola jajanakun.store.
          </p>
        </form>
      </div>
    </div>
  );
}
