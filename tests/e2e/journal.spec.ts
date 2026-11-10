import { expect, test } from "@playwright/test";
import { localAuthAdmin } from "../helpers/local-auth";

// keep public resource discovery shareable and stable across refreshes at the real database boundary
 test("journal search categories and empty states remain navigable", async ({ page }) => {
  await page.goto("/blog?category=getting-started");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start With One Useful Question", exact: true })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/category=getting-started/);
  await page.goto("/blog?q=nonexistent-resource-937462");
  await expect(page.getByText(/no (articles|posts|results|matches)|nothing matched/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /clear|reset|all articles/i }).first()).toBeVisible();
});

// protect article readability metadata and private draft boundaries on a mobile viewport
 test("published articles have metadata while drafts stay missing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/blog/start-with-one-useful-question");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Start With One Useful Question" })).toBeVisible();
  await expect(page).toHaveTitle(/Start With One Useful Question/);
  expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toContain("/blog/start-with-one-useful-question");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("start-with-one-useful-question");
  expect(await sitemap.text()).not.toContain("keep-a-build-journal");
  expect((await page.goto("/blog/keep-a-build-journal"))?.status()).toBe(404);
});

// verify real next and previous navigation without relying on an archive too small to paginate
 test("pagination preserves search and category filters", async ({ page }) => {
  const admin = localAuthAdmin();
  const query = `pagination-${Date.now()}`;
  const { data: category, error: categoryError } = await admin.from("categories").select("id").eq("slug", "getting-started").single();
  expect(categoryError).toBeNull();
  const { data: posts, error } = await admin.from("posts").insert(Array.from({ length: 10 }, (_, index) => ({
    title: `${query} article ${index + 1}`, slug: `${query}-${index + 1}`, excerpt: "Synthetic pagination fixture", content: { type: "doc", content: [] }, status: "published", published_at: new Date(Date.now() - (index + 1) * 1000).toISOString(),
  }))).select("id");
  expect(error).toBeNull();
  const ids = posts!.map(post => post.id);
  try {
    const linked = await admin.from("post_categories").insert(ids.map(id => ({ post_id: id, category_id: category!.id })));
    expect(linked.error).toBeNull();
    await page.goto(`/blog?q=${query}&category=getting-started`);
    await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Next", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`q=${query}.*category=getting-started.*page=2`));
    await expect(page.getByText("Page 2 of 2", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("link", { name: `${query} article 10`, exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Previous", exact: true }).click();
    await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  } finally {
    await admin.from("posts").delete().in("id", ids);
  }
});
