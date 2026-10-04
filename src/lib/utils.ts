export function rp(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Kode pesanan: GK-XXXXXX (tanpa karakter ambigu)
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateOrderCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return "GK-" + s;
}

export function generateClaimCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return "WG-" + s;
}

export function normalizeWa(input: string): string {
  let d = (input || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  if (d.startsWith("8")) d = "62" + d;
  return d;
}

// Link WhatsApp admin, opsional menyertakan kode pesanan
export function adminWaLink(text?: string): string {
  const num = process.env.NEXT_PUBLIC_ADMIN_WA || "6280000000000";
  const base = `https://wa.me/${num}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(date);
}
