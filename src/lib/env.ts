/**
 * Variabel rahasia wajib. Di produksi, nilai kosong / contoh dari .env.example
 * DITOLAK (app gagal start) — jangan pernah diam-diam jatuh ke default lemah.
 * Di dev tetap ada default supaya `npm run dev` jalan tanpa konfigurasi.
 */

const PLACEHOLDERS = new Set([
  "admin123",
  "dev-secret-change-me",
  "ganti-dengan-string-random-panjang",
  "ganti-webhook-secret",
]);

const isProd = () => process.env.NODE_ENV === "production";

/** Sedang `next build` (bukan server berjalan) — env produksi belum tentu ada. */
const isBuild = () => process.env.NEXT_PHASE === "phase-production-build";

function required(name: string, devDefault: string, minLength = 1): string {
  const value = process.env[name]?.trim() || "";
  if (!isProd() || isBuild()) return value || devDefault;
  if (!value || PLACEHOLDERS.has(value)) {
    throw new Error(`[env] ${name} wajib diisi di produksi (jangan pakai nilai contoh).`);
  }
  if (value.length < minLength) {
    throw new Error(`[env] ${name} minimal ${minLength} karakter.`);
  }
  return value;
}

export function sessionSecret(): string {
  return required("ADMIN_SESSION_SECRET", "dev-secret-change-me", 32);
}

export function envAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || process.env.ADMIN_USER || "admin@jajanakun.store").trim().toLowerCase();
}

export function envAdminPassword(): string {
  return required("ADMIN_PASSWORD", "admin123", 10);
}

/**
 * Secret webhook SoqiPG. Null hanya boleh di dev (webhook lalu diterima tanpa
 * signature, untuk uji lokal). Di produksi wajib ada.
 */
export function webhookSecret(): string | null {
  const value = process.env.SOQIPG_WEBHOOK_SECRET?.trim() || "";
  if (!isProd()) return value || null;
  return required("SOQIPG_WEBHOOK_SECRET", "");
}

/** Dipanggil saat server start (instrumentation.ts) agar salah konfigurasi langsung ketahuan. */
export function assertProductionEnv(): void {
  if (!isProd() || isBuild()) return;
  sessionSecret();
  envAdminPassword();
  webhookSecret();
  if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")) {
    throw new Error("[env] NEXT_PUBLIC_APP_URL wajib https://… di produksi.");
  }
}
