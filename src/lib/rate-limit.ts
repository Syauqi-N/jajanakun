/**
 * Rate limiter sederhana di memori (fixed window). Cukup untuk deployment
 * satu container; kalau nanti di-scale ke banyak instance, pindahkan ke Redis.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

/**
 * Catat satu percobaan untuk `key`. Return false bila sudah melewati `limit`
 * dalam jendela `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count++;
  return b.count <= limit;
}

/** Reset hitungan (mis. setelah login berhasil). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

export const TOO_MANY = "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.";
