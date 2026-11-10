"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category, Post, RichDocument } from "@/features/blog/shared";

// preserve the source node beside its editable text until a block is intentionally changed
type EditorBlock = {
  key: string;
  kind: "paragraph" | "heading2" | "heading3" | "bulletList" | "orderedList";
  text: string;
  original: RichNode;
  changed: boolean;
};

// represent supported JSON nodes without coupling the editor to unsafe markup
type RichNode = {
  type: string;
  text?: string;
  attrs?: { level?: number };
  content?: RichNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

// keep initialization and response errors readable without losing editor values
type ApiFailure = { error?: { message?: string; code?: string; fields?: Record<string, string> } };

// turn persisted rich text into block controls while retaining untouched nodes verbatim
function readBlocks(document: RichDocument | undefined): EditorBlock[] {
  const nodes = (document as unknown as { content?: RichNode[] } | undefined)?.content ?? [];
  return nodes.map((node, index) => {
    const kind = node.type === "heading"
      ? node.attrs?.level === 3 ? "heading3" : "heading2"
      : node.type === "bulletList" || node.type === "orderedList" ? node.type : "paragraph";
    const text = node.type === "bulletList" || node.type === "orderedList"
      ? (node.content ?? []).map((item) => readNodeText(item)).join("\n")
      : readNodeText(node);
    return { key: `${index}-${node.type}`, kind, text, original: node, changed: false };
  });
}

// expose nested text to editing controls without interpreting links or HTML
function readNodeText(node: RichNode): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(readNodeText).join("");
}

// detect inline marks so changing their plain text cannot hide a formatting loss
function hasInlineMarks(node: RichNode): boolean {
  return Boolean(node.marks?.length || node.content?.some(hasInlineMarks));
}

// warn when plain text controls cannot preserve source formatting or list nesting
function blockEditWarning(block: EditorBlock): string | null {
  if (!block.changed) return null;
  if (hasInlineMarks(block.original)) return "Editing this block replaces its original inline formatting with plain text.";
  if (block.original.type === "bulletList" || block.original.type === "orderedList") {
    return "Editing this list converts it to plain-text lines; nested lists and item formatting will be removed.";
  }
  return null;
}

// create a constrained document from supported block choices and preserved source nodes
function writeDocument(blocks: EditorBlock[]): RichDocument {
  const content = blocks.map((block) => {
    if (!block.changed) return block.original;
    if (block.kind === "heading2" || block.kind === "heading3") {
      return { type: "heading", attrs: { level: block.kind === "heading2" ? 2 : 3 }, content: [{ type: "text", text: block.text }] };
    }
    if (block.kind === "bulletList" || block.kind === "orderedList") {
      const items = block.text.split("\n").filter((line) => line.trim()).map((line) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: line }] }] }));
      return { type: block.kind, content: items };
    }
    return { type: "paragraph", content: block.text ? [{ type: "text", text: block.text }] : [] };
  });
  return { type: "doc", content } as unknown as RichDocument;
}

// extract the server message while keeping malformed responses nonfatal to the form
function responseMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const message = (payload as ApiFailure).error?.message;
    if (message) return message;
  }
  return fallback;
}

// read an identifier from the persisted mutation response for newly created drafts
function responseId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("data" in payload)) return null;
  const data = (payload as { data?: { id?: unknown; post?: { id?: unknown } } }).data;
  const id = data?.post?.id ?? data?.id;
  return typeof id === "string" ? id : null;
}

// convert a title into a stable editable URL segment without adding server behavior
function slugFromTitle(value: string): string {
  return value.normalize("NFKD").toLowerCase().trim().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// provide a protected editor for drafts and published posts with explicit persistence actions
export function PostEditor({ initialPost }: { initialPost?: Post }) {
  const router = useRouter();
  const [postId, setPostId] = useState(initialPost?.id ?? "");
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initialPost?.slug));
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => readBlocks(initialPost?.content));
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialPost?.categories.map((category) => category.id) ?? []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [coverPath, setCoverPath] = useState(initialPost?.cover_path ?? "");
  const [coverAlt, setCoverAlt] = useState(initialPost?.cover_alt ?? "");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState(initialPost?.status ?? "draft");
  const [revision, setRevision] = useState(0);
  const [savedRevision, setSavedRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState("");
  const [notice, setNotice] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const isDirty = revision !== savedRevision;
  const richDocument = useMemo(() => writeDocument(blocks), [blocks]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/categories", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as { data?: Category[] } | ApiFailure | null;
        if (!response.ok || !payload || !("data" in payload) || !Array.isArray(payload.data)) throw new Error(responseMessage(payload, "Categories could not be loaded."));
        setCategories(payload.data);
        setCategoriesLoading(false);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setCategoryError(reason instanceof Error ? reason.message : "Categories could not be loaded.");
        setCategoriesLoading(false);
      });
    return () => controller.abort();
  }, [requestVersion]);

  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const confirmInternalLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement) || target.target === "_blank") return;
      const destination = new URL(target.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;
      if (window.confirm("You have unsaved changes. Leave this page and discard them?")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    window.document.addEventListener("click", confirmInternalLink, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      window.document.removeEventListener("click", confirmInternalLink, true);
    };
  }, [isDirty]);

  // mark a field edit as unsaved without touching persisted values on request failure
  function changed<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setRevision((current) => current + 1);
    setError("");
    setNotice("");
  }

  // preserve the selected block source unless the author edits or changes its type
  function updateBlock(index: number, patch: Partial<Pick<EditorBlock, "kind" | "text">>) {
    setBlocks((current) => current.map((block, blockIndex) => blockIndex === index ? { ...block, ...patch, changed: true } : block));
    setRevision((current) => current + 1);
    setError("");
  }

  // keep mutations on the fixed admin endpoint contract and retain the form after failures
  async function save(nextStatus: "draft" | "published") {
    if (!title.trim()) {
      setError("Add a title before saving this post.");
      return;
    }
    if (coverPath && !coverAlt.trim()) {
      setError("Add descriptive alt text for the cover image before saving.");
      return;
    }
    if (nextStatus === "published" && !window.confirm(`Publish “${title.trim()}” now?`)) return;
    if (status === "published" && nextStatus === "draft" && !window.confirm(`Unpublish “${title.trim()}” and save it as a draft?`)) return;
    const snapshot = revision;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(postId ? `/api/admin/posts/${postId}` : "/api/admin/posts", {
        method: postId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          content: richDocument,
          status: nextStatus,
          category_ids: selectedCategories,
          cover_path: coverPath || null,
          cover_alt: coverPath ? coverAlt.trim() : "",
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const failure = payload as ApiFailure | null;
        const fields = failure?.error?.fields ?? {};
        if (failure?.error?.code === "DUPLICATE_SLUG") fields.slug = "This slug is already used. Choose a different URL.";
        setFieldErrors(fields);
        throw new Error(responseMessage(payload, "The post could not be saved. Your edits are still here."));
      }
      setFieldErrors({});
      const savedId = responseId(payload) ?? postId;
      if (!savedId) throw new Error("The post was saved, but the response did not include its editor link. Reload the post list to continue.");
      setPostId(savedId);
      setStatus(nextStatus);
      setSavedRevision(snapshot);
      setNotice(nextStatus === "published" ? "Post published." : "Draft saved.");
      if (!postId) router.replace(`/admin/posts/${savedId}/edit`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The post could not be saved. Your edits are still here.");
    } finally {
      setSaving(false);
    }
  }

  // accept only the image formats and size supported by the protected upload endpoint
  async function uploadCover(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setUploadError("Choose a JPEG, PNG, or WebP image no larger than 5 MiB.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const payload = await response.json().catch(() => null) as { data?: { path?: string; url?: string } } | ApiFailure | null;
      if (!response.ok || !payload || !("data" in payload) || !payload.data?.path || !payload.data.url) {
        throw new Error(responseMessage(payload, "The cover upload failed. Your article text is unchanged; please retry."));
      }
      setCoverPath(payload.data.path);
      setCoverUrl(payload.data.url);
      setRevision((current) => current + 1);
      setNotice("Cover uploaded. Add alt text before saving the post.");
      setError("");
    } catch (reason) {
      setUploadError(reason instanceof Error ? reason.message : "The cover upload failed. Your article text is unchanged; please retry.");
    } finally {
      setUploading(false);
    }
  }

  // require a deliberate confirmation before a saved record and its public URL are removed
  async function deletePost() {
    if (!postId || !window.confirm(`Delete “${title || "Untitled post"}”? This cannot be undone.`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseMessage(payload, "The post could not be deleted. Your edits are still here."));
      setRevision(savedRevision);
      router.push("/admin/posts");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The post could not be deleted. Your edits are still here.");
    } finally {
      setSaving(false);
    }
  }

  // add a plain paragraph as the safe starting point for another authored block
  function addBlock() {
    setBlocks((current) => [...current, { key: `new-${Date.now()}-${current.length}`, kind: "paragraph", text: "", original: { type: "paragraph", content: [] }, changed: true }]);
    setRevision((current) => current + 1);
  }

  // remove a block only after the author chooses its dedicated control
  function removeBlock(index: number) {
    setBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index));
    setRevision((current) => current + 1);
  }

  const canPreview = Boolean(postId);

  return (
    <section aria-labelledby="editor-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Editorial workspace / {initialPost ? "Edit post" : "New post"}</p>
          <h1 id="editor-heading" className="section-heading mt-3">{title || (initialPost ? "Edit post" : "Untitled post")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Write with clear blocks. Unsaved text stays in this tab until you save it.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary"><Link href="/admin/posts">Back to posts</Link></Button>
          {canPreview && <Button asChild variant="ghost"><Link href={`/admin/posts/${postId}/preview`}>Preview saved version</Link></Button>}
          {status === "published" && slug && <Button asChild variant="ghost"><Link href={`/blog/${slug}`} target="_blank" rel="noreferrer">View published post</Link></Button>}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-y border-border py-3 text-sm">
        <span className={`rounded-full px-3 py-1 font-semibold ${status === "published" ? "bg-surface-muted text-brand" : "bg-white text-muted"}`}>{status === "published" ? "Published" : "Draft"}</span>
        {isDirty ? <span className="text-muted">Unsaved changes</span> : <span className="text-muted">{postId ? "All changes saved" : "Not saved yet"}</span>}
      </div>

      {error && <div className="mt-5"><Alert tone="error">{error}</Alert></div>}
      {notice && <div className="mt-5"><Alert tone="success">{notice}</Alert></div>}

      <form className="mt-6 space-y-6" onSubmit={(event) => { event.preventDefault(); void save(status === "published" ? "published" : "draft"); }}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-5">
            <label className="block text-sm font-semibold" htmlFor="post-title">Title <span aria-hidden="true">*</span>
              <Input id="post-title" className="mt-2" required maxLength={160} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? "title-error" : undefined} value={title} onChange={(event) => {
                const next = event.target.value;
                changed(setTitle, next);
                if (!slugEdited) setSlug(slugFromTitle(next));
              }} />
            </label>
            {fieldErrors.title && <p id="title-error" className="text-sm text-danger">{fieldErrors.title}</p>}
            <label className="block text-sm font-semibold" htmlFor="post-slug">Slug <span aria-hidden="true">*</span>
              <div className="mt-2 flex min-h-11 items-center rounded-lg border border-control-border bg-white focus-within:outline focus-within:outline-2 focus-within:outline-brand">
                <span className="shrink-0 pl-3 text-sm text-muted">/blog/</span>
                <input id="post-slug" className="min-w-0 flex-1 rounded-r-lg bg-transparent px-2 py-2 text-base outline-none" required maxLength={180} aria-invalid={Boolean(fieldErrors.slug)} aria-describedby={fieldErrors.slug ? "slug-error" : undefined} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={(event) => { setSlugEdited(true); changed(setSlug, event.target.value); }} />
              </div>
              <span className="mt-1 block text-xs font-normal text-muted">Lowercase letters, numbers, and single hyphens.</span>
            </label>
            {fieldErrors.slug && <p id="slug-error" className="text-sm text-danger">{fieldErrors.slug}</p>}
            <label className="block text-sm font-semibold" htmlFor="post-excerpt">Excerpt
              <textarea id="post-excerpt" className="mt-2 min-h-28 w-full rounded-lg border border-control-border bg-white px-3 py-2 text-base font-normal leading-6" required maxLength={320} aria-invalid={Boolean(fieldErrors.excerpt)} aria-describedby={fieldErrors.excerpt ? "excerpt-error" : undefined} value={excerpt} onChange={(event) => changed(setExcerpt, event.target.value)} />
              <span className="mt-1 block text-xs font-normal text-muted">{excerpt.length}/320 characters</span>
            </label>
            {fieldErrors.excerpt && <p id="excerpt-error" className="text-sm text-danger">{fieldErrors.excerpt}</p>}
          </div>

          <aside className="space-y-5 rounded-xl border border-border bg-white p-4 sm:p-5">
            <div>
              <h2 className="font-heading text-2xl">Categories</h2>
              {categoryError && <div className="mt-3"><Alert tone="error"><div className="space-y-2"><p>{categoryError}</p><Button type="button" variant="secondary" onClick={() => { setCategoriesLoading(true); setCategoryError(""); setRequestVersion((value) => value + 1); }}>Retry categories</Button></div></Alert></div>}
              {categoriesLoading && <p className="mt-2 text-sm text-muted" role="status">Loading categories…</p>}
              {!categoriesLoading && !categoryError && categories.length === 0 && <p className="mt-2 text-sm text-muted">No categories are available yet.</p>}
              <fieldset className="mt-3 space-y-2">
                <legend className="sr-only">Post categories</legend>
                {categories.map((category) => (
                  <label key={category.id} className="flex min-h-11 items-center gap-3 text-sm">
                    <input className="size-4 accent-brand" type="checkbox" checked={selectedCategories.includes(category.id)} onChange={(event) => {
                      const next = event.target.checked ? [...selectedCategories, category.id] : selectedCategories.filter((id) => id !== category.id);
                      changed(setSelectedCategories, next);
                    }} />
                    {category.name}
                  </label>
                ))}
              </fieldset>
            </div>

            <div className="border-t border-border pt-4">
              <h2 className="font-heading text-2xl">Cover image</h2>
              <p id="cover-help" className="mt-2 text-xs leading-5 text-muted">JPEG, PNG, or WebP up to 5 MiB. Uploaded media is public even while its article is a draft; do not upload confidential images.</p>
              <label className="mt-3 block text-sm font-semibold" htmlFor="cover-file">Choose image
                <input id="cover-file" className="mt-2 block min-h-11 w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:font-semibold file:text-brand" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="cover-help upload-error" disabled={uploading || saving} onChange={(event) => { void uploadCover(event); }} />
              </label>
              {coverPath && <div className="mt-3 rounded-lg bg-canvas p-3 text-xs leading-5"><p className="break-all font-medium">{coverPath}</p>{coverUrl && <a className="mt-1 inline-block text-brand underline" href={coverUrl} target="_blank" rel="noreferrer">Open uploaded cover</a>}</div>}
              {uploading && <p className="mt-2 text-sm text-muted" role="status">Uploading cover…</p>}
              {uploadError && <div id="upload-error" className="mt-3"><Alert tone="error">{uploadError}</Alert></div>}
              <label className="mt-4 block text-sm font-semibold" htmlFor="cover-alt">Alternative text {coverPath && <span aria-hidden="true">*</span>}
                <Input id="cover-alt" className="mt-2" maxLength={200} required={Boolean(coverPath)} value={coverAlt} onChange={(event) => changed(setCoverAlt, event.target.value)} aria-describedby="alt-help" />
              </label>
              <p id="alt-help" className="mt-1 text-xs leading-5 font-normal text-muted">Describe the image’s meaning, not its appearance alone.</p>
              {coverPath && <Button type="button" variant="ghost" className="mt-2 px-0" onClick={() => { setCoverPath(""); setCoverAlt(""); setCoverUrl(""); setRevision((value) => value + 1); }}>Remove cover</Button>}
            </div>
          </aside>
        </div>

        {fieldErrors.content && <p className="text-sm text-danger">{fieldErrors.content}</p>}
        <section aria-labelledby="body-heading" className="rounded-xl border border-border bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="body-heading" className="font-heading text-3xl">Article body</h2>
              <p className="mt-1 text-sm text-muted">Choose a block type, then write plain text. Saved content is structured JSON, never raw HTML.</p>
            </div>
            <Button type="button" variant="secondary" onClick={addBlock}>Add paragraph</Button>
          </div>
          <div className="mt-5 space-y-4">
            {blocks.length === 0 && <p className="rounded-lg bg-canvas p-4 text-sm text-muted">This article has no body blocks. Add one to begin writing.</p>}
            {blocks.map((block, index) => (
              <fieldset key={block.key} className="rounded-lg border border-border p-3 sm:p-4">
                <legend className="sr-only">Article block {index + 1}</legend>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`block-type-${index}`}>Block type
                    <select id={`block-type-${index}`} className="ml-2 min-h-10 rounded-lg border border-control-border bg-white px-2 text-sm font-medium normal-case tracking-normal text-ink" value={block.kind} onChange={(event) => updateBlock(index, { kind: event.target.value as EditorBlock["kind"] })}>
                      <option value="paragraph">Paragraph</option>
                      <option value="heading2">Heading 2</option>
                      <option value="heading3">Heading 3</option>
                      <option value="bulletList">Bullet list</option>
                      <option value="orderedList">Numbered list</option>
                    </select>
                  </label>
                  <Button type="button" variant="ghost" className="min-h-10 px-2" onClick={() => removeBlock(index)} aria-label={`Remove article block ${index + 1}`}>Remove block</Button>
                </div>
                <label className="mt-3 block text-sm font-semibold" htmlFor={`block-text-${index}`}>
                  {block.kind === "bulletList" || block.kind === "orderedList" ? "List items, one per line" : block.kind.startsWith("heading") ? "Heading text" : "Paragraph text"}
                  <textarea id={`block-text-${index}`} className={`mt-2 w-full rounded-lg border border-control-border bg-canvas px-3 py-3 text-base leading-7 ${block.kind.startsWith("heading") ? "min-h-20 font-heading text-2xl" : "min-h-28"}`} value={block.text} onChange={(event) => updateBlock(index, { text: event.target.value })} />
                </label>
                {blockEditWarning(block) && <p className="mt-2 text-xs text-muted">{blockEditWarning(block)}</p>}
              </fieldset>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving || uploading}>{saving ? "Saving…" : status === "published" ? "Save published changes" : "Save draft"}</Button>
            {status !== "published" && <Button type="button" disabled={saving || uploading} onClick={() => { void save("published"); }}>Publish</Button>}
            {status === "published" && <Button type="button" variant="secondary" disabled={saving || uploading} onClick={() => { void save("draft"); }}>Unpublish</Button>}
          </div>
          {postId && <Button type="button" variant="destructive" disabled={saving || uploading} onClick={() => { void deletePost(); }}>Delete post</Button>}
        </div>
        <p className="text-xs leading-5 text-muted">Saving does not happen automatically. Publishing makes this post visible on the public blog.</p>
      </form>
    </section>
  );
}
