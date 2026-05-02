import type { NextConfig } from "next";

// Build-Time-Constants → werden zu Compile-Zeit ins JS-Bundle eingebettet.
// Auf Vercel setzt der Build-Step diese, lokal sind die Werte "local" / Boot-Zeit.
const BUILD_TIME = new Date().toISOString();
const COMMIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@napi-rs/canvas', 'sharp'],
  env: {
    NEXT_PUBLIC_BUILD_TIME: BUILD_TIME,
    NEXT_PUBLIC_COMMIT_SHA: COMMIT_SHA,
  },
};

export default nextConfig;
