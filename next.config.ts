import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  turbopack: {
    // pdfjs-dist references the node-only "canvas" package in its
    // NodeCanvasFactory; stub it so the browser/SSR bundle resolves.
    resolveAlias: {
      canvas: path.join(process.cwd(), "canvas-stub.js"),
    },
  },
};

export default nextConfig;
