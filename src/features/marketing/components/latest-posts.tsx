import Link from "next/link";
import { listPublishedPosts } from "@/features/blog/server";
import { Alert } from "@/components/ui/alert";

// connect the mentoring homepage to the real publishing workflow without disguising backend failures as empty content
export async function LatestPosts() {
  let result;
  try {
    result = await listPublishedPosts({ page: 1, pageSize: 3 });
  } catch {
    return <section className="page-container py-14" aria-labelledby="latest-heading"><h2 id="latest-heading" className="section-heading mb-6">Notes for the next step.</h2><Alert tone="error">The Journal could not be loaded. Please try again shortly.</Alert><Link href="/blog" className="mt-4 inline-block text-brand underline">Open the Journal</Link></section>;
  }
  return <section className="border-t border-border py-14 sm:py-20" aria-labelledby="latest-heading"><div className="page-container">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">From the Journal</p><h2 id="latest-heading" className="section-heading mt-4">Notes for the next step.</h2></div><Link href="/blog" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline">Explore the Journal →</Link></div>
    <p className="mt-4 text-xs text-muted">Original demo articles, published through this workspace.</p>
    {result.items.length ? <div className="mt-10 grid gap-8 md:grid-cols-3">{result.items.map(post => <article key={post.id} className="border-t border-control-border pt-5"><p className="eyebrow">{post.categories[0]?.name ?? "Building ideas"}</p><h3 className="mt-4 font-heading text-3xl leading-tight tracking-tight"><Link href={`/blog/${post.slug}`} className="hover:text-brand">{post.title}</Link></h3><p className="mt-4 text-sm leading-relaxed text-muted">{post.excerpt}</p><p className="mt-5 text-xs text-muted">{post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : ""} · {post.reading_time} min read</p></article>)}</div> : <p className="mt-8 text-muted">The Journal is getting started. New articles will appear here after publication.</p>}
  </div></section>;
}
