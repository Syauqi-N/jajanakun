import { NextResponse } from "next/server";
import { destroyUserSession } from "@/lib/user-auth";
import { isSameOrigin } from "@/lib/request";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  await destroyUserSession();
  return NextResponse.json({ ok: true });
}
