import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typescript: {
    // The Windows sandbox blocks Next's child type-check process. CI and Vercel keep this off.
    ignoreBuildErrors: process.env.SYMMETRY_LOCAL_BUILD === "1",
  },
  experimental:
    process.env.SYMMETRY_LOCAL_BUILD === "1"
      ? {
          cpus: 1,
          workerThreads: true,
        }
      : {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
