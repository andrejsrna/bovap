import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Koreň projektu pre Turbopack (aby našiel package-lock.json v /root/bovap)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
