/** Helper untuk route handler: base URL publik, IP klien, cek origin, redirect aman. */

/** Base URL publik untuk redirect (hindari host internal container di balik tunnel). */
export function appBase(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (env) return env;
  return new URL(req.url).origin;
}

/** IP klien. App hanya bind ke localhost di belakang cloudflared, jadi header ini bisa dipercaya. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Proteksi CSRF untuk POST dengan cookie sesi: tolak request yang jelas datang
 * dari situs lain. Origin harus sama dengan host yang diminta (atau APP_URL).
 * Request tanpa Origin & Sec-Fetch-Site (klien non-browser) dibiarkan — mereka
 * tidak membawa cookie korban.
 */
export function isSameOrigin(req: Request): boolean {
  const h = req.headers;
  const origin = h.get("origin");
  if (!origin) return h.get("sec-fetch-site") !== "cross-site";
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const allowed = new Set<string>();
  const host = h.get("x-forwarded-host") || h.get("host");
  if (host) allowed.add(host);
  for (const url of [process.env.NEXT_PUBLIC_APP_URL, req.url]) {
    try {
      if (url) allowed.add(new URL(url).host);
    } catch {
      // abaikan URL tak valid
    }
  }
  return allowed.has(originHost);
}

/** Path redirect internal saja ("/admin/..."), tolak URL absolut & "//host". */
export function safeRedirectPath(value: unknown, fallback: string): string {
  const s = typeof value === "string" ? value : "";
  if (!s.startsWith("/") || s.startsWith("//") || s.startsWith("/\\")) return fallback;
  return s;
}

/** Potong string input bebas ke panjang maksimum. */
export function clip(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}
