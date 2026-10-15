import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output pre Docker (Dockerfile -> node server.js)
  output: "standalone",
  // Koreň projektu pre Turbopack (aby našiel package-lock.json v /root/bovap)
  turbopack: {
    root: __dirname,
  },
  // PDF do kariet môže mať až 10 MB (+ ostatné polia formulára); predvolený limit je 1 MB.
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
    proxyClientMaxBodySize: "12mb",
  },
};

export default nextConfig;
