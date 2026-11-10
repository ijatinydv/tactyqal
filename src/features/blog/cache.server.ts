import "server-only";
import { revalidatePath } from "next/cache";

// invalidate every public surface that can display a changed article immediately
export function revalidateBlogPaths(slugs: Array<string | null | undefined> = []): void {
  revalidatePath("/", "page");
  revalidatePath("/blog", "page");
  revalidatePath("/sitemap.xml");
  for (const slug of new Set(slugs.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/blog/${slug}`, "page");
  }
}
