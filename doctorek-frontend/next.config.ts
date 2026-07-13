import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker runtime image
  output: "standalone",
  // Hide the on-screen Next.js dev indicator (bottom-left "N" badge).
  // Build/runtime errors are still surfaced.
  devIndicators: false,
  images: {
    remotePatterns: [
      // Google account avatars (social-login profile photos)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
