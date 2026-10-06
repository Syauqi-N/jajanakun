import { NextResponse } from "next/server";
import { loginUser } from "@/lib/user-auth";
import { rateLimit, resetRateLimit, TOO_MANY } from "@/lib/rate-limit";
import { clientIp, isSameOrigin } from "@/lib/request";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const ip = clientIp(req.headers);
    // Maks 10 percobaan / 15 menit per email+IP, dan 50 / 15 menit per IP.
    const keyEmail = `login:${ip}:${email}`;
    if (!rateLimit(keyEmail, 10, 15 * 60_000) || !rateLimit(`login:${ip}`, 50, 15 * 60_000)) {
      return NextResponse.json({ error: TOO_MANY }, { status: 429 });
    }
    const user = await loginUser(email, String(body.password || ""));
    resetRateLimit(keyEmail);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal masuk.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
