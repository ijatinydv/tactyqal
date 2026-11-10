import { expect, test } from "@playwright/test";
import { createAuthFixture, localAuthAdmin } from "../helpers/local-auth";
import { apiSessionCookie } from "../helpers/api-session";

// exercise valid viewer sessions directly so api security cannot rely on the login ui signing them out
 test("viewer cookies cannot read private records or mutate content", async ({ request, baseURL }) => {
  const viewer = await createAuthFixture("viewer");
  const origin = baseURL ?? "http://127.0.0.1:3000";
  try {
    const cookie = await apiSessionCookie(viewer);
    const headers = { cookie, origin };
    for (const path of ["/api/admin/posts", "/api/admin/categories"]) expect((await request.get(path, { headers })).status()).toBe(403);
    const attempt = await request.post("/api/admin/posts", { headers, data: {
      title: "Viewer must not publish", slug: `viewer-denied-${Date.now()}`, excerpt: "An unauthorised fixture", content: { type: "doc", content: [] }, status: "draft", category_ids: [], cover_path: null, cover_alt: "",
    } });
    expect(attempt.status()).toBe(403);
    expect((await request.get("/api/posts/keep-a-build-journal")).status()).toBe(404);
    expect((await request.get("/api/posts?pageSize=99999")).status()).toBe(422);
    expect((await request.get("/api/posts?page=0")).status()).toBe(422);
    const literal = await request.get("/api/posts?q=%25");
    expect(literal.status()).toBe(200);
    expect((await literal.json()).data.total).toBe(0);
  } finally {
    await localAuthAdmin().auth.admin.deleteUser(viewer.id);
  }
});
