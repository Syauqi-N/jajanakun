import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone → image Docker kecil (hanya file yang dibutuhkan runtime).
  output: "standalone",
  // Tidak ada next/image remote: jangan buka /_next/image sebagai proxy untuk host mana pun.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
      // Di balik Cloudflare Tunnel, origin yang diterima berbeda dari host
      // internal container — daftarkan agar server action tidak ditolak.
      allowedOrigins: ["jajanakun.store", "www.jajanakun.store"],
    },
  },
};

export default nextConfig;
