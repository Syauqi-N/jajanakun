import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/soqipg";
import { handleWebhook } from "@/lib/orders";

/**
 * Webhook SoqiPG. Tanpa klik "saya sudah bayar" — status LUNAS di-set dari sini.
 *
 * Keamanan:
 *  - Verifikasi signature HMAC (header x-soqipg-signature).
 *  - Idempotent: PaymentEvent.ref unik mencegah double proses.
 *  - Matching order: hanya kode pesanan (reference) + nominal wajib sama.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-soqipg-signature") || req.headers.get("x-callback-signature");

  let valid: boolean;
  try {
    valid = verifyWebhookSignature(raw, signature);
  } catch (err) {
    // Secret belum dikonfigurasi di produksi — tolak, jangan pernah fail-open.
    console.error("[webhook/soqipg]", err);
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }
  if (!valid) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  try {
    const result = await handleWebhook(payload);
    if (!result.ok) {
      // Balas 200 supaya gateway tidak retry terus-menerus untuk event tak dikenal,
      // tapi catat di log.
      console.warn("[webhook/soqipg] tidak diproses:", result.reason, payload);
      return NextResponse.json({ ok: false, reason: result.reason });
    }
    return NextResponse.json({ ok: true, action: result.action, order: result.order?.code });
  } catch (err) {
    console.error("[webhook/soqipg] error:", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "SoqiPG webhook endpoint jajanakun.store" });
}
