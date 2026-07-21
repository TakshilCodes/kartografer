import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  outputFileTracingIncludes: {
    "/*": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },

  webpack(config) {
    config.resolve.alias["@splinetool/react-spline$"] = path.resolve(
      process.cwd(),
      "node_modules/@splinetool/react-spline/dist/react-spline.js",
    );

    return config;
  },
};

export default nextConfig;
