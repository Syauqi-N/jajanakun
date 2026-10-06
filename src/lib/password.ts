import crypto from "crypto";

/**
 * Hash password (scrypt, tanpa dependency tambahan) — dipakai user & admin.
 *
 * Format baru: "scrypt$<salt>$<hash64>".
 * Format lama admin "scrypt:<salt>:<hash32>" tetap bisa diverifikasi.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

/** Verifikasi password terhadap hash (constant-time). */
export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!password || !stored) return false;
  const sep = stored.startsWith("scrypt$") ? "$" : stored.startsWith("scrypt:") ? ":" : null;
  if (!sep) return false;
  const [, salt, hash] = stored.split(sep);
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== 32 && expected.length !== 64) return false;
  let derived: Buffer;
  try {
    derived = crypto.scryptSync(password, salt, expected.length);
  } catch {
    return false;
  }
  return crypto.timingSafeEqual(derived, expected);
}

/** Bandingkan dua string rahasia secara constant-time (panjang berbeda pun aman). */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Acak password baru (dibagikan manual ke pemilik akun). */
export function randomPassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}
