import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker runtime image
  output: "standalone",
  // resvg utilise un binaire Node natif ; Next doit le conserver comme package serveur.
  serverExternalPackages: ["@resvg/resvg-js"],
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
