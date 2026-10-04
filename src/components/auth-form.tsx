"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function GoogleButton({ label, enabled }: { label: string; enabled: boolean }) {
  const available = enabled;
  if (!available) {
    return (
      <div
        className="btn w-full justify-center"
        style={{ opacity: 0.55, cursor: "not-allowed" }}
        title="Google login belum dikonfigurasi (set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET)"
      >
        <GoogleIcon />
        {label} (belum aktif)
      </div>
    );
  }
  return (
    <a className="btn w-full justify-center" href="/api/auth/google">
      <GoogleIcon />
      {label}
    </a>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.2 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C36.9 40.2 44 35 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export function AuthForm({ mode, googleEnabled = false }: { mode: "login" | "register"; googleEnabled?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/akun";
  const oauthError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(oauthError ? friendlyError(oauthError) : "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login" ? { email, password } : { email, password, name, wa }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan.");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setLoading(false);
    }
  }

  return (
    <div className="wrap py-12">
      <div className="mx-auto max-w-[460px]">
        <div className="sec-head text-center">
          <p className="sec-kicker">{mode === "login" ? "Selamat Datang Kembali" : "Buat Akun Baru"}</p>
          <h1 className="slab text-[28px]">{mode === "login" ? "Masuk" : "Daftar"}</h1>
          <p style={{ color: "var(--ink-soft)" }}>
            {mode === "login"
              ? "Masuk untuk melanjutkan pembelian dan melihat akunmu."
              : "Wajib punya akun untuk membeli. Cepat, kok."}
          </p>
        </div>

        <div className="card">
          {error && (
            <div
              className="mono mb-4 rounded-[8px] border-[2.5px] p-3 text-[13px]"
              style={{ borderColor: "var(--line)", background: "var(--note-4)", color: "#7a2020" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            {mode === "register" && (
              <label className="field">
                <span>Nama (opsional)</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Namamu" autoComplete="name" />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </label>
            {mode === "register" && (
              <label className="field">
                <span>No. WhatsApp (opsional)</span>
                <input
                  className="input"
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
            )}
            <button className="btn btn-red w-full justify-center" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Memproses…
                </>
              ) : mode === "login" ? (
                "Masuk"
              ) : (
                "Daftar"
              )}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-0.5 flex-1" style={{ background: "color-mix(in srgb, var(--ink) 25%, transparent)" }} />
            <span className="mono text-[11px]" style={{ color: "var(--ink-soft)" }}>
              ATAU
            </span>
            <span className="h-0.5 flex-1" style={{ background: "color-mix(in srgb, var(--ink) 25%, transparent)" }} />
          </div>

          <GoogleButton label={mode === "login" ? "Masuk dengan Google" : "Daftar dengan Google"} enabled={googleEnabled} />

          <p className="kirim-note" style={{ marginTop: 18 }}>
            {mode === "login" ? (
              <>
                Belum punya akun? <Link href={`/daftar?next=${encodeURIComponent(next)}`} style={{ color: "var(--red-ink)", fontWeight: 700 }}>Daftar di sini</Link>
              </>
            ) : (
              <>
                Sudah punya akun? <Link href={`/masuk?next=${encodeURIComponent(next)}`} style={{ color: "var(--red-ink)", fontWeight: 700 }}>Masuk di sini</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code: string): string {
  switch (code) {
    case "google_belum_dikonfigurasi":
      return "Login Google belum dikonfigurasi admin.";
    case "google_dibatalkan":
      return "Login Google dibatalkan.";
    case "state_tidak_valid":
      return "Sesi login tidak valid. Coba lagi.";
    case "google_gagal":
      return "Gagal masuk dengan Google. Coba lagi.";
    default:
      return "Terjadi kesalahan.";
  }
}
