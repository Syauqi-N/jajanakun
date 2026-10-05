import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const h = new Headers(req.headers);
  return NextResponse.json({
    host: h.get("host"),
    xfHost: h.get("x-forwarded-host"),
    xfProto: h.get("x-forwarded-proto"),
    origin: h.get("origin"),
    url: req.url,
  });
}
