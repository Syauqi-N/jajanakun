import { getSetting, SETTING_KEYS } from "@/lib/settings";

/**
 * Apakah login Google aktif?
 *
 * Dibaca di SERVER saat request (runtime), bukan di-inline saat build.
 * Ini penting: `NEXT_PUBLIC_*` di-inline saat build sehingga bisa berbeda
 * antara HTML server dan bundle klien (menyebabkan hydration mismatch).
 * Nilai juga bisa diatur dari panel admin (setting `google_enabled`).
 */
export async function googleEnabled(): Promise<boolean> {
  const setting = await getSetting(SETTING_KEYS.googleEnabled);
  if (setting === "1") return true;
  if (setting === "0") return false;
  // fallback ke env bila belum diatur di DB
  return (
    process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1" &&
    !!process.env.GOOGLE_CLIENT_ID &&
    !!process.env.GOOGLE_CLIENT_SECRET
  );
}
