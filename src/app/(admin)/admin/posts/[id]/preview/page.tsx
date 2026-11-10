import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfigurationNotice } from "@/features/auth/components/configuration-notice";
import { requireEditor } from "@/features/auth/server";
import { ArticleContent } from "@/features/blog/components/article-content";
import { getAdminPost } from "@/features/blog/server";
import { getPublicCoverUrl } from "@/features/blog/public-components/urls";

// keep editor only content out of search indexes even when previews are shared
export const metadata: Metadata = {
  title: "Post preview",
  robots: { index: false, follow: false },
};

// do not reuse a saved draft response between protected preview requests
export const dynamic = "force-dynamic";

// render the saved document through the same constrained renderer as public articles
export default async function AdminPostPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const editor = await requireEditor();
  if (!editor) return <ConfigurationNotice />;
  const { id } = await params;
  const post = await getAdminPost(id);
  if (!post) notFound();
  const coverUrl = getPublicCoverUrl(post.cover_path);

  return (
    <div>
      <div className="mb-8 rounded-xl border border-accent bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="eyebrow">Protected editor preview · not indexed</p>
          <p className="mt-2 text-sm leading-6 text-muted">This is the saved version. Unsaved editor changes do not appear here.</p>
        </div>
        <Button asChild variant="secondary" className="mt-4 sm:mt-0"><Link href={`/admin/posts/${post.id}/edit`}>Back to editor</Link></Button>
      </div>
      <article className="mx-auto max-w-3xl">
        <header className="mb-9 border-b border-border pb-7">
          <p className="eyebrow">{post.categories.map((category) => category.name).join(" · ") || "Journal"}</p>
          <h1 className="display-heading mt-4">{post.title}</h1>
          {post.excerpt && <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{post.excerpt}</p>}
          <p className="mt-4 text-sm text-muted">{post.status === "published" ? "Published post" : "Draft preview"}</p>
          {post.cover_path && <p className="mt-3 text-xs text-muted">Cover alt text: {post.cover_alt || "Not set"}</p>}
        </header>
        {coverUrl && <div className="relative mb-9 aspect-[16/9] overflow-hidden rounded-2xl bg-surface-muted"><Image src={coverUrl} alt={post.cover_alt || ""} fill sizes="(max-width: 768px) 100vw, 768px" unoptimized className="object-cover" /></div>}
        <ArticleContent content={post.content} />
      </article>
    </div>
  );
}
