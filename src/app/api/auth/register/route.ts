import { NextResponse } from "next/server";
import { registerUser } from "@/lib/user-auth";
import { rateLimit, TOO_MANY } from "@/lib/rate-limit";
import { clientIp, isSameOrigin } from "@/lib/request";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  // Maks 5 pendaftaran / jam per IP.
  if (!rateLimit(`register:${clientIp(req.headers)}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: TOO_MANY }, { status: 429 });
  }
  try {
    const body = await req.json();
    const user = await registerUser({
      email: String(body.email || ""),
      password: String(body.password || ""),
      name: body.name,
      wa: body.wa,
    });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mendaftar.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
