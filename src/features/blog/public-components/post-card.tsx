import Image from "next/image";
import Link from "next/link";
import type { PostSummary } from "@/features/blog/shared";
import { formatPublishedDate, getPublicCoverUrl } from "./urls";

// make published summaries easy to scan without implying unprovided authorship
export function PostCard({ post }: { post: PostSummary }) {
  const coverUrl = getPublicCoverUrl(post.cover_path);
  const publishedDate = formatPublishedDate(post.published_at);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-md">
      {coverUrl ? (
        <Link href={`/blog/${encodeURIComponent(post.slug)}`} tabIndex={-1} aria-hidden="true" className="relative block aspect-[16/10] overflow-hidden bg-surface-muted">
          <Image
            src={coverUrl}
            alt=""
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
      ) : null}
      <div className="flex flex-1 flex-col p-6">
        {post.categories.length ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <Link
                key={category.id}
                href={`/blog?category=${encodeURIComponent(category.slug)}`}
                className="eyebrow rounded-full bg-surface-muted px-3 py-1 text-[0.68rem] no-underline hover:underline"
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}
        <h2 className="font-heading text-2xl leading-tight tracking-tight">
          <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="no-underline hover:text-brand">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 flex-1 leading-relaxed text-muted">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-4 text-sm text-muted">
          {publishedDate ? <time dateTime={post.published_at ?? undefined}>{publishedDate}</time> : null}
          {publishedDate && post.reading_time > 0 ? <span aria-hidden="true">·</span> : null}
          {post.reading_time > 0 ? <span>{post.reading_time} min read</span> : null}
        </div>
      </div>
    </article>
  );
}
