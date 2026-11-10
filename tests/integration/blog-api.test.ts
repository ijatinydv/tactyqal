import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";

// opt in only when a real local app and disposable editor credentials are configured
const baseUrl = process.env.BLOG_API_BASE_URL;

// keep integration execution explicit so ordinary unit tests need no local stack
const integrationEnabled = Boolean(
  baseUrl
  && process.env.NEXT_PUBLIC_SUPABASE_URL
  && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  && process.env.BLOG_API_EDITOR_EMAIL
  && process.env.BLOG_API_EDITOR_PASSWORD,
);

// prove the persisted browser contract across real public and protected http routes
test("blog api persists authorized posts and hides drafts from public reads", { skip: !integrationEnabled }, async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  assert.ok(baseUrl && supabaseUrl && publishableKey);

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const signIn = await supabase.auth.signInWithPassword({
    email: process.env.BLOG_API_EDITOR_EMAIL!,
    password: process.env.BLOG_API_EDITOR_PASSWORD!,
  });
  assert.ok(signIn.data.session, "configured integration editor must be able to sign in");
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = `base64-${Buffer.from(JSON.stringify(signIn.data.session)).toString("base64url")}`;
  const origin = new URL(baseUrl).origin;
  const slug = `blog-api-integration-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let postId: string | undefined;

  // add only the session cookie and same-origin header required by mutation adapters
  const request = (path: string, init: RequestInit = {}) => fetch(new URL(path, baseUrl), {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      cookie: `${cookieName}=${cookieValue}`,
      origin,
    },
  });

  try {
    const anonymousAdmin = await fetch(new URL("/api/admin/posts", baseUrl));
    assert.equal(anonymousAdmin.status, 401);
    assert.match(anonymousAdmin.headers.get("content-type") ?? "", /application\/json/);
    assert.equal((await anonymousAdmin.json() as { error: { code: string } }).error.code, "UNAUTHENTICATED");
    const anonymousCategories = await fetch(new URL("/api/admin/categories", baseUrl));
    assert.equal(anonymousCategories.status, 401);
    const publicCategories = await fetch(new URL("/api/categories", baseUrl));
    assert.equal(publicCategories.status, 200);
    assert.ok(Array.isArray((await publicCategories.json() as { data: unknown }).data));

    const crossOrigin = await fetch(new URL("/api/admin/posts", baseUrl), {
      method: "POST",
      headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(crossOrigin.status, 403);

    const content = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "This integration article contains enough substantive text to publish safely and verify the public api contract." }] }],
    };
    const created = await request("/api/admin/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Blog API integration article",
        slug,
        excerpt: "A real persisted API fixture",
        content: { type: "doc", content: [] },
        status: "draft",
        category_ids: [],
        cover_path: null,
        cover_alt: "",
      }),
    });
    assert.equal(created.status, 201);
    const createdBody = await created.json() as { data: { id: string; status: string } };
    postId = createdBody.data.id;
    assert.equal(createdBody.data.status, "draft");
    assert.equal((await request("/api/admin/categories")).status, 200);

    const hiddenDraft = await fetch(new URL(`/api/posts/${slug}`, baseUrl));
    assert.equal(hiddenDraft.status, 404);
    assert.equal((await hiddenDraft.json() as { error: { code: string } }).error.code, "NOT_FOUND");

    const published = await request(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, status: "published" }),
    });
    assert.equal(published.status, 200);
    const publicDetail = await fetch(new URL(`/api/posts/${slug}`, baseUrl));
    assert.equal(publicDetail.status, 200);
    const detailBody = await publicDetail.json() as { data: Record<string, unknown> };
    assert.equal(detailBody.data.status, "published");
    assert.equal(detailBody.data.cover_alt, "");
    const publicList = await fetch(new URL("/api/posts?q=Blog%20API%20integration%20article&page=1&pageSize=20", baseUrl));
    assert.equal(publicList.status, 200);
    const listBody = await publicList.json() as { data: { items: Array<Record<string, unknown>>; total: number; page: number; pageSize: number } };
    const summary = listBody.data.items.find((item) => item.slug === slug);
    assert.ok(summary);
    assert.equal("content" in summary, false);
    assert.equal(typeof summary.reading_time, "number");

    const duplicate = await request("/api/admin/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Duplicate article",
        slug,
        excerpt: "A duplicate slug fixture",
        content: { type: "doc", content: [] },
        status: "draft",
        category_ids: [],
        cover_path: null,
        cover_alt: "",
      }),
    });
    assert.equal(duplicate.status, 409);
    assert.equal((await duplicate.json() as { error: { code: string } }).error.code, "DUPLICATE_SLUG");

    const deleted = await request(`/api/admin/posts/${postId}`, { method: "DELETE" });
    assert.equal(deleted.status, 200);
    postId = undefined;
    assert.equal((await fetch(new URL(`/api/posts/${slug}`, baseUrl))).status, 404);
  } finally {
    if (postId) await request(`/api/admin/posts/${postId}`, { method: "DELETE" });
    await supabase.auth.signOut({ scope: "local" });
  }
});
