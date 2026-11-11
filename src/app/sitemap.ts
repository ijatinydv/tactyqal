import type { MetadataRoute } from "next";
import { studentApps } from "@/content/students";
import { listPublishedPosts } from "@/features/blog/server";
import { getCanonicalUrl, getPublicSiteUrl } from "@/features/blog/public-components/urls";

// keep generated article URLs fresh as editorial publication status changes
export const dynamic = "force-dynamic";

// list only public destinations and every published article within a fixed query budget
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPublicSiteUrl();
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL must be a valid public origin for sitemap generation.");

  const pageSize = 20;
  const maximumArticles = 5000;
  const firstPage = await listPublishedPosts({ page: 1, pageSize });
  if (firstPage.total > maximumArticles) throw new Error("Published archive exceeds the configured sitemap page budget.");

  const posts = [...firstPage.items];
  const pageCount = Math.ceil(firstPage.total / pageSize);
  for (let page = 2; page <= pageCount; page += 1) {
    const result = await listPublishedPosts({ page, pageSize });
    if (result.total !== firstPage.total) throw new Error("Published archive changed while generating the sitemap.");
    posts.push(...result.items);
  }
  if (posts.length !== firstPage.total) throw new Error("Sitemap query returned an incomplete published archive.");

  const publicRoutes: MetadataRoute.Sitemap = ["/", "/projects", ...studentApps.map(app => `/projects/${app.slug}`), "/blog", "/contact", "/privacy"].map((pathname) => ({
    url: getCanonicalUrl(pathname) ?? new URL(pathname, siteUrl).toString(),
  }));
  const articleRoutes: MetadataRoute.Sitemap = posts.map((post) => {
    const updatedAt = new Date(post.updated_at);
    return {
      url: getCanonicalUrl(`/blog/${encodeURIComponent(post.slug)}`) ?? new URL(`/blog/${encodeURIComponent(post.slug)}`, siteUrl).toString(),
      lastModified: Number.isNaN(updatedAt.getTime()) ? undefined : updatedAt,
    };
  });

  return [...publicRoutes, ...articleRoutes];
}
