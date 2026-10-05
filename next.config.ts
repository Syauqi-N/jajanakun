import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone → image Docker kecil (hanya file yang dibutuhkan runtime).
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
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
