import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone → image Docker kecil (hanya file yang dibutuhkan runtime).
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
