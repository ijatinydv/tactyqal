// provide one validated site origin for canonical metadata and sitemap entries
export function getPublicSiteUrl(): URL | null {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    try {
      const url = new URL(configuredSiteUrl);
      if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) {
        return new URL(url.origin);
      }
    } catch {
      if (process.env.NODE_ENV === "production") return null;
    }
  }

  return process.env.NODE_ENV === "production" ? null : new URL("http://localhost:3000");
}

// keep canonical links absolute without inventing a production hostname
export function getCanonicalUrl(pathname: string): string | undefined {
  const siteUrl = getPublicSiteUrl();
  return siteUrl ? new URL(pathname, siteUrl).toString() : undefined;
}

// serve validated cover paths through the same-origin image proxy
export function getPublicCoverUrl(coverPath: string | null | undefined): string | undefined {
  if (!coverPath) return undefined;

  const segments = coverPath.split("/");
  if (
    segments.length !== 2 ||
    segments.some((segment) => !segment || segment === "." || segment === ".." || /[\\\u0000-\u001f\u007f]/.test(segment))
  ) return undefined;

  return `/media/covers/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
}

// format only persisted publication dates and leave missing dates undisclosed
export function formatPublishedDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(date);
}
