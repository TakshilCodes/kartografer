import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright"],
  experimental: {
    cpus: 2,
  },
};

export default nextConfig;
