"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PostSummary } from "@/features/blog/shared";

// describe the server response separately so pagination follows persisted records
type PostListResponse = {
  data: {
    items: PostSummary[];
    total: number;
    page: number;
    pageSize: number;
  };
};

// render the real editorial collection with clear loading empty and failure states
export function PostList() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    fetch(`/api/admin/posts?${params.toString()}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as PostListResponse | { error?: { message?: string } } | null;
        if (!response.ok) throw new Error(payload && "error" in payload ? payload.error?.message ?? "Posts could not be loaded." : "Posts could not be loaded.");
        if (!payload || !("data" in payload)) throw new Error("The posts response was incomplete.");
        setPosts(payload.data.items);
        setTotal(payload.data.total);
        setPageSize(payload.data.pageSize);
        setError("");
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Posts could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, reload, search, status]);

  // keep list refreshes explicit after errors and filter changes
  const retry = useCallback(() => {
    setLoading(true);
    setError("");
    setReload((value) => value + 1);
  }, []);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section aria-labelledby="posts-heading">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Editorial workspace</p>
          <h1 id="posts-heading" className="section-heading mt-3">Posts</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Search and manage saved articles. Drafts are private until you publish them.</p>
        </div>
        <Button asChild><Link href="/admin/posts/new">New post</Link></Button>
      </div>

      <form
        className="mt-8 grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          setPage(1);
          setSearch(query.trim());
          setReload((value) => value + 1);
        }}
      >
        <label className="block text-sm font-semibold">
          Search posts
          <Input className="mt-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title or slug" />
        </label>
        <label className="block text-sm font-semibold">
          Publication status
          <select className="mt-2 min-h-11 w-full rounded-lg border border-control-border bg-white px-3 py-2 text-base" value={status} onChange={(event) => { setLoading(true); setError(""); setStatus(event.target.value); setPage(1); }}>
            <option value="">All posts</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <div className="mt-5" aria-live="polite">
        {loading && <p className="py-8 text-sm text-muted">Loading saved posts…</p>}
        {!loading && error && <Alert tone="error"><div className="flex flex-wrap items-center justify-between gap-3"><span>{error}</span><Button type="button" variant="secondary" onClick={retry}>Try again</Button></div></Alert>}
        {!loading && !error && posts.length === 0 && (
          <div className="rounded-xl border border-dashed border-control-border bg-white/70 px-6 py-10 text-center">
            <h2 className="font-heading text-2xl">No posts found</h2>
            <p className="mt-2 text-sm text-muted">Try a different search or create the first article.</p>
            <Button asChild className="mt-5"><Link href="/admin/posts/new">Create a post</Link></Button>
          </div>
        )}
        {!loading && !error && posts.length > 0 && (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-xl border border-border bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-heading text-2xl leading-tight">{post.title || "Untitled post"}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${post.status === "published" ? "bg-surface-muted text-brand" : "bg-canvas text-muted"}`}>
                        {post.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-2 break-all text-sm text-muted">/{post.slug}</p>
                    <p className="mt-1 text-xs text-muted">Updated {new Date(post.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button asChild variant="secondary"><Link href={`/admin/posts/${post.id}/edit`}>Edit</Link></Button>
                    <Button asChild variant="ghost"><Link href={`/admin/posts/${post.id}/preview`}>Preview</Link></Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && !error && total > 0 && (
        <nav aria-label="Post pages" className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted">{total} {total === 1 ? "post" : "posts"} · page {page} of {pages}</p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={loading || page <= 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>Previous</Button>
            <Button type="button" variant="secondary" disabled={loading || page >= pages} onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Next</Button>
          </div>
        </nav>
      )}
    </section>
  );
}
