import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Monorepo: trace dependencies from repository root when deploying on Vercel.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_INTERNAL_URL ?? "http://localhost:4000/api"}/:path*`,
      },
    ];
  },
  /** Prevents dev-only HTTP 416 on stale webpack HMR chunks (Range request mismatch). */
  async headers() {
    return [
      {
        source: "/_next/static/webpack/:path*",
        headers: [{ key: "Accept-Ranges", value: "none" }],
      },
      {
        source: "/_next/static/chunks/:path*",
        headers: [{ key: "Accept-Ranges", value: "none" }],
      },
    ];
  },
};

export default nextConfig;
