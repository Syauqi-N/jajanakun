import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { appBase, isSameOrigin } from "@/lib/request";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  await destroySession();
  return NextResponse.redirect(new URL("/admin/login", appBase(req)), { status: 303 });
}
