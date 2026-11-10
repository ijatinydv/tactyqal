import type { NextConfig } from "next";

// keep browser security defaults consistent across public and protected routes
const config: NextConfig = {
  poweredByHeader: false,
  // allow next/image to optimise cover images served from the WordPress media host
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.tactyqal.com" },
      { protocol: "https", hostname: "tactyqal.com" },
      // WordPress media is sometimes served from the wp-content CDN subdomain
      { protocol: "https", hostname: "**.tactyqal.com" },
    ],
  },
  // protect every document without exposing deployment or browser capability details
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};
export default config;
