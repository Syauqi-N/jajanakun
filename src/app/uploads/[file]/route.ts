import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/**
 * Melayani file yang di-upload dari disk (public/uploads).
 * Diperlukan karena output "standalone" hanya meng-copy public/ saat build,
 * sehingga file yang ditulis runtime tidak otomatis ter-serve lewat static.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  // Cegah path traversal.
  if (!file || file.includes("/") || file.includes("\\") || file.includes("..")) {
    return new NextResponse("Tidak ditemukan.", { status: 404 });
  }
  const ext = path.extname(file).toLowerCase();
  const type = CONTENT_TYPES[ext] || "application/octet-stream";
  const dir = path.join(process.cwd(), "public", "uploads");
  const full = path.join(dir, file);
  try {
    const info = await stat(full);
    if (!info.isFile()) return new NextResponse("Tidak ditemukan.", { status: 404 });
    const data = await readFile(full);
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Tidak ditemukan.", { status: 404 });
  }
}
