import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";
const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  if (Number(req.headers.get("content-length")) > MAX_BYTES + 65536) {
    return NextResponse.json({ error: "Ukuran gambar maksimal 3MB." }, { status: 413 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Pilih gambar dengan ukuran maksimal 3MB." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(buffer, { limitInputPixels: 25_000_000 });
    const metadata = await image.metadata();
    if (!["png", "jpeg", "webp", "gif"].includes(metadata.format || "")) {
      return NextResponse.json({ error: "Format harus PNG, JPG, WEBP, atau GIF." }, { status: 400 });
    }
    // Validasi isi gambar, buang metadata, crop tengah menjadi persegi 1:1.
    const square = await image.rotate().resize(800, 800, { fit: "cover", position: "centre" }).webp({ quality: 85 }).toBuffer();
    const name = `produk-${randomUUID()}.webp`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), square, { flag: "wx" });
    return NextResponse.json({ ok: true, url: `/uploads/${name}` });
  } catch {
    return NextResponse.json({ error: "Gambar tidak valid atau gagal diunggah. Coba gambar lain." }, { status: 400 });
  }
}
