import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/features/blog/public-components/urls";

// keep the demo noindexed by default; set ALLOW_INDEXING=true to let search engines crawl it
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();
  const allowIndexing = process.env.ALLOW_INDEXING === "true";
  return {
    rules: [{ userAgent: "*", allow: allowIndexing ? "/" : undefined, disallow: allowIndexing ? ["/admin", "/api/"] : "/" }],
    sitemap: siteUrl ? new URL("/sitemap.xml", siteUrl).toString() : undefined,
    host: siteUrl?.host,
  };
}
