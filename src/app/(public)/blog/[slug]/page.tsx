import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleContent, estimateReadingTime } from "@/features/blog/components/article-content";
import { listPublishedPosts, getPublishedPost } from "@/features/blog/server";
import type { Post, PostSummary } from "@/features/blog/shared";
import { PostCard } from "@/features/blog/public-components/post-card";
import { formatPublishedDate, getCanonicalUrl, getPublicCoverUrl } from "@/features/blog/public-components/urls";

// keep article requests fresh so hidden and unpublished drafts never persist in cache
export const dynamic = "force-dynamic";

// build metadata only from a currently published post and its persisted fields
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let post: Post | null;
  try {
    post = await getPublishedPost(slug);
  } catch {
    return { title: "Journal article unavailable", robots: { index: false, follow: false } };
  }

  if (!post) return { title: "Article not found", robots: { index: false, follow: false } };

  const canonical = getCanonicalUrl(`/blog/${encodeURIComponent(post.slug)}`);
  const coverPath = getPublicCoverUrl(post.cover_path);
  const coverUrl = coverPath ? getCanonicalUrl(coverPath) : undefined;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: canonical,
      publishedTime: post.published_at ?? undefined,
      images: coverUrl ? [{ url: coverUrl, alt: post.cover_alt || post.title }] : undefined,
    },
  };
}

// serve only published article data while keeping related stories strictly limited
export default async function PublicArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let post: Post | null;
  try {
    post = await getPublishedPost(slug);
  } catch {
    return (
      <section className="page-container py-16 sm:py-20">
        <div role="alert" className="mx-auto max-w-3xl rounded-2xl border border-danger/30 bg-surface p-8">
          <p className="eyebrow text-danger">Article unavailable</p>
          <h1 className="mt-3 font-heading text-3xl">We couldn’t load this article.</h1>
          <p className="mt-3 leading-relaxed text-muted">Please try again in a little while.</p>
          <Link href="/blog" className="mt-6 inline-flex font-semibold text-brand underline underline-offset-4">Return to the Journal</Link>
        </div>
      </section>
    );
  }

  if (!post) notFound();

  let relatedPosts: PostSummary[] = [];
  try {
    const relatedResult = await listPublishedPosts({
      category: post.categories[0]?.slug,
      page: 1,
      pageSize: 4,
    });
    relatedPosts = relatedResult.items.filter((item) => item.slug !== post.slug).slice(0, 3);
  } catch {
    relatedPosts = [];
  }

  const publishedDate = formatPublishedDate(post.published_at);
  const coverPath = getPublicCoverUrl(post.cover_path);
  const coverUrl = coverPath ? getCanonicalUrl(coverPath) : undefined;
  const coverImageSrc = coverPath;
  const canonical = getCanonicalUrl(`/blog/${encodeURIComponent(post.slug)}`);
  const readingTime = estimateReadingTime(post.content);
  const text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    mainEntityOfPage: canonical,
    datePublished: post.published_at ?? undefined,
    image: coverUrl ? [coverUrl] : undefined,
  }).replace(/</g, "\\u003c");

  return (
    <article className="page-container py-10 sm:py-14 lg:py-20">
      <script type="application/ld+json">{text}</script>
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
          <Link href="/blog" className="font-semibold text-brand underline underline-offset-4">Journal</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <span>Article</span>
        </nav>
        {post.categories.length ? (
          <div className="mb-5 flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <Link key={category.id} href={`/blog?category=${encodeURIComponent(category.slug)}`} className="eyebrow rounded-full bg-surface-muted px-3 py-1 text-[0.68rem] no-underline hover:underline">
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}
        <h1 className="font-heading text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{post.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted sm:text-xl">{post.excerpt}</p>
        <p className="mt-4 text-xs text-muted">Migrated from the Tactyqal blog · Independent redesign prototype</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          {publishedDate ? <time dateTime={post.published_at ?? undefined}>{publishedDate}</time> : null}
          {publishedDate && readingTime > 0 ? <span aria-hidden="true">·</span> : null}
          <span>{readingTime} min read</span>
        </div>
        {coverImageSrc ? (
          <div className="relative mt-9 aspect-[16/9] overflow-hidden rounded-2xl bg-surface-muted">
            <Image src={coverImageSrc} alt={post.cover_alt || ""} fill sizes="(max-width: 768px) 100vw, 768px" unoptimized className="object-cover" priority />
          </div>
        ) : null}
        <div className="mt-10 border-t border-border pt-2 sm:mt-14">
          <ArticleContent content={post.content} />
        </div>
      </div>

      {relatedPosts.length ? (
        <aside aria-labelledby="related-heading" className="mx-auto mt-16 max-w-5xl border-t border-border pt-10 sm:mt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Keep exploring</p>
              <h2 id="related-heading" className="mt-2 font-heading text-3xl">More from the Journal</h2>
            </div>
            <Link href="/blog" className="font-semibold text-brand underline underline-offset-4">All articles</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((relatedPost) => <PostCard key={relatedPost.id} post={relatedPost} />)}
          </div>
        </aside>
      ) : null}
    </article>
  );
}
