import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ayrı build klasörü (örn. testler için): NEXT_DIST_DIR=.next-e2e
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Self-contained server in .next/standalone (no node_modules install needed on the server)
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
