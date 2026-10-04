import { NextResponse } from "next/server";
import { loginUser } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = await loginUser(String(body.email || ""), String(body.password || ""));
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal masuk.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
