import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker runtime image
  output: "standalone",
  // Sharp 0.35 ships its native runtime in optional @img packages. Include
  // their shared libraries explicitly so the standalone/Docker server can
  // resize images instead of silently falling back to the source asset.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/sharp/**/*", "./node_modules/@img/**/*"],
  },
  // resvg utilise un binaire Node natif ; Next doit le conserver comme package serveur.
  serverExternalPackages: ["@resvg/resvg-js"],
  // Hide the on-screen Next.js dev indicator (bottom-left "N" badge).
  // Build/runtime errors are still surfaced.
  devIndicators: false,
  images: {
    // Prefer modern encodings while keeping WebP as a universal fallback.
    formats: ["image/avif", "image/webp"],
    // Match the widths used by the responsive layouts instead of generating
    // oversized default variants for small dashboard illustrations.
    deviceSizes: [360, 416, 512, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [60, 70, 75],
    minimumCacheTTL: 86_400,
    remotePatterns: [
      // Google account avatars (social-login profile photos)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
