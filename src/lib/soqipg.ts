import crypto from "crypto";

/**
 * Adapter SoqiPG (repo `pg-gopay`) untuk jajanakun.store.
 *
 * Kontrak sebenarnya (lihat `pg-gopay/src/app/v1/transactions`):
 *   POST {SOQIPG_BASE_URL}/v1/transactions
 *     header: X-API-Key: <API key toko>
 *     body  : { reference, amount }
 *     balas : { reference, amount, uniqueCode, totalAmount, status, qrImage, expiresAt, paidAt }
 *
 * PENTING: kode unik & nominal akhir ditentukan oleh SoqiPG (`totalAmount`),
 * bukan dihitung sendiri. QR yang harus ditampilkan ada di `qrImage`
 * (data URL PNG), bukan payload string.
 *
 * Pembayaran dikonfirmasi lewat callback HMAC-SHA256 ke /api/webhook/soqipg —
 * lihat `verifyWebhookSignature`.
 */

export type CreateChargeInput = {
  orderCode: string; // dipakai sebagai `reference`
  amount: number; // nominal dasar (subtotal)
  description?: string;
  expiresInSeconds?: number;
  buyerName?: string;
  buyerWa?: string;
};

export type ChargeResult = {
  ref: string;
  uniqueCode: number | null;
  totalAmount: number | null; // nominal yang WAJIB dibayar pembeli
  qrString?: string;
  qrImageUrl?: string; // data URL PNG dari SoqiPG
  status?: string;
  expiresAt: Date;
  raw?: unknown;
};

export type WebhookPayload = {
  reference?: string;
  orderCode?: string;
  status?: string;
  amount?: number;
  totalAmount?: number;
  grossAmount?: number;
  uniqueCode?: number;
  paidAt?: string | null;
  [key: string]: unknown;
};

export function isGatewayConfigured(): boolean {
  return Boolean(process.env.SOQIPG_BASE_URL && process.env.SOQIPG_API_KEY);
}

function baseUrl(): string {
  return (process.env.SOQIPG_BASE_URL || "").replace(/\/+$/, "");
}

/** Buat transaksi QRIS dinamis. `reference` = kode pesanan jajanakun. */
export async function createCharge(input: CreateChargeInput): Promise<ChargeResult> {
  const fallbackExpiry = new Date(Date.now() + (input.expiresInSeconds ?? 1800) * 1000);

  if (!isGatewayConfigured()) {
    // Mode simulasi (dev tanpa gateway). Jangan ditampilkan sebagai QR nyata.
    const ref = "SIM-" + crypto.randomBytes(6).toString("hex").toUpperCase();
    return { ref, uniqueCode: null, totalAmount: null, qrString: `SIMQRIS|${input.orderCode}|${input.amount}|${ref}`, expiresAt: fallbackExpiry };
  }

  const res = await fetch(`${baseUrl()}/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.SOQIPG_API_KEY || "",
    },
    body: JSON.stringify({ reference: input.orderCode, amount: input.amount }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`SoqiPG createCharge gagal (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const d = (data.data ?? data) as Record<string, unknown>;
  const pick = (...keys: string[]) => keys.map((k) => d[k]).find((v) => v !== undefined && v !== null);

  return {
    ref: String(pick("reference", "ref") ?? input.orderCode),
    uniqueCode: d.uniqueCode != null ? Number(d.uniqueCode) : null,
    totalAmount: d.totalAmount != null ? Number(d.totalAmount) : null,
    qrString: undefined,
    qrImageUrl: (pick("qrImage", "qrImageUrl", "qr_string") as string | undefined) ?? undefined,
    status: d.status != null ? String(d.status) : undefined,
    expiresAt: d.expiresAt ? new Date(String(d.expiresAt)) : fallbackExpiry,
    raw: data,
  };
}

/**
 * Verifikasi callback SoqiPG: HMAC-SHA256(rawBody, callbackSecret) == header.
 * Header: x-soqipg-signature (lihat `pg-gopay/src/lib/hmac.ts`).
 * Bila SOQIPG_WEBHOOK_SECRET kosong -> lolos (khusus dev).
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.SOQIPG_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isPaidStatus(status?: string): boolean {
  const s = (status || "").toLowerCase();
  return ["paid", "settlement", "settled", "success", "succeeded", "capture", "lunas"].includes(s);
}
