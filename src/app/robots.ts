import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/features/blog/public-components/urls";

// keep private editor and api paths out of crawler discovery while preserving public routes
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: siteUrl ? new URL("/sitemap.xml", siteUrl).toString() : undefined,
    host: siteUrl?.host,
  };
}
