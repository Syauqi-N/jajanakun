import { DEFAULT_HOURS, isValidHHMM, type StoreHours } from "./store-hours";
import { prisma } from "./prisma";

/**
 * Pengaturan toko (key-value) yang bisa diubah dari panel admin tanpa rebuild.
 * Nilai disimpan di tabel `settings`; env dipakai sebagai fallback awal.
 */

export const SETTING_KEYS = {
  adminWa: "admin_wa",
  storeName: "store_name",
  storeTagline: "store_tagline",
  storeAddress: "store_address",
  googleEnabled: "google_enabled",
  marqueeItems: "marquee_items",
  openTime: "open_time",
  closeTime: "close_time",
} as const;

/** Teks running banner default (dipakai bila admin belum mengubah). */
export const DEFAULT_MARQUEE = [
  "Promo Oktober — Diskon sampai 96%",
  "Garansi sampai 30 Hari",
  "Bayar QRIS, Verifikasi Otomatis",
  "Akun Dikirim Setelah Lunas",
  "Admin Fast Respon 08.00–22.00 WIB",
  "Harga Kaki Lima, Kualitas Bintang Lima",
];

/** Pisah isi setting marquee (satu per baris atau dipisah tanda |) menjadi daftar. */
export function parseMarquee(value: string): string[] {
  return (value || "")
    .split(/\r?\n|\|/)
    .map((t) => t.trim())
    .filter(Boolean);
}

const FALLBACK: Record<string, string> = {
  [SETTING_KEYS.adminWa]: process.env.NEXT_PUBLIC_ADMIN_WA || "6280000000000",
  [SETTING_KEYS.storeName]: "jajanakun.store",
  [SETTING_KEYS.storeTagline]: "Warung Akun Premium",
  [SETTING_KEYS.storeAddress]: "",
  [SETTING_KEYS.marqueeItems]: DEFAULT_MARQUEE.join("\n"),
  [SETTING_KEYS.openTime]: DEFAULT_HOURS.open,
  [SETTING_KEYS.closeTime]: DEFAULT_HOURS.close,
};

/** Ambil satu pengaturan; jatuh ke default env/konstanta bila belum diisi. */
export async function getSetting(key: string): Promise<string> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    if (row && row.value !== "") return row.value;
  } catch {
    // DB belum siap (mis. saat build) — pakai fallback.
  }
  return FALLBACK[key] ?? "";
}

/** Ambil banyak pengaturan sekaligus. */
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = await getSetting(k);
  return out;
}

/** Simpan/ubah satu pengaturan. */
export async function setSetting(key: string, value: string): Promise<void> {
  const v = value.trim();
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: v },
    update: { value: v },
  });
}

/** Normalisasi nomor WA ke format internasional tanpa tanda baca (628…). */
export function normalizeWa(input: string): string {
  let d = (input || "").replace(/[^\d]/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("620")) d = "62" + d.slice(3);
  else if (!d.startsWith("62")) d = "62" + d;
  return d;
}

/** Jam operasional toko (WIB) dari Pengaturan; nilai rusak jatuh ke default. */
export async function getStoreHours(): Promise<StoreHours> {
  const [open, close] = await Promise.all([getSetting(SETTING_KEYS.openTime), getSetting(SETTING_KEYS.closeTime)]);
  return {
    open: isValidHHMM(open) ? open : DEFAULT_HOURS.open,
    close: isValidHHMM(close) ? close : DEFAULT_HOURS.close,
  };
}
