import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Required for Cloudflare Pages via @cloudflare/next-on-pages
  output: "export",
  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
