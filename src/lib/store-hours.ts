/**
 * Jam operasional toko (WIB). Modul murni — dipakai server & client.
 * Format jam "HH:MM". Jam tutup < jam buka = buka melewati tengah malam
 * (mis. 20:00–02:00). Jam buka == jam tutup = buka 24 jam.
 */

export type StoreHours = { open: string; close: string };

export const DEFAULT_HOURS: StoreHours = { open: "08:00", close: "22:00" };

const WIB_OFFSET_MIN = 7 * 60; // Asia/Jakarta, tanpa DST

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidHHMM(v: string): boolean {
  return HHMM.test(v);
}

function toMinutes(v: string): number {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

/** Menit sejak 00:00 WIB untuk waktu `now`. */
function wibMinutes(now: Date): number {
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  return (utcMin + WIB_OFFSET_MIN) % (24 * 60);
}

export function isStoreOpen(hours: StoreHours, now: Date = new Date()): boolean {
  const open = toMinutes(hours.open);
  const close = toMinutes(hours.close);
  if (open === close) return true;
  const t = wibMinutes(now);
  return open < close ? t >= open && t < close : t >= open || t < close;
}

/** "08:00" -> "08.00" (format jam Indonesia). */
export function fmtTime(v: string): string {
  return v.replace(":", ".");
}

/** "08.00–22.00 WIB" atau "24 jam". */
export function formatHours(hours: StoreHours, sep = "–"): string {
  if (hours.open === hours.close) return "24 jam";
  return `${fmtTime(hours.open)}${sep}${fmtTime(hours.close)} WIB`;
}
