import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    unoptimized: true, // For html-to-image compatibility
  },
};

export default nextConfig;
