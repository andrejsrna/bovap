import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output pre Docker (Dockerfile -> node server.js)
  output: "standalone",
  // Koreň projektu pre Turbopack (aby našiel package-lock.json v /root/bovap)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
