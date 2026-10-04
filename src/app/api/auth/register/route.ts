import { NextResponse } from "next/server";
import { registerUser } from "@/lib/user-auth";

export async function POST(req: Request) {
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
