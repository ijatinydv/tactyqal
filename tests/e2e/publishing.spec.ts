import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { createAuthFixture, localAuthAdmin } from "../helpers/local-auth";

// isolate the publication workflow from developer accounts and previously saved demo drafts
let editor: Awaited<ReturnType<typeof createAuthFixture>>;

// hold identifiers for test records so even a failed browser assertion leaves no public fixture
const postIds = new Set<string>();

// provide the browser with an actual invited identity in the disposable local auth stack
 test.beforeAll(async () => { editor = await createAuthFixture("editor"); });

// remove synthetic publication records and media after exercising the real application
 test.afterAll(async () => {
  const admin = localAuthAdmin();
  for (const id of postIds) await admin.from("posts").delete().eq("id", id);
  if (editor) {
    const { data } = await admin.storage.from("covers").list(editor.id);
    if (data?.length) await admin.storage.from("covers").remove(data.map(file => `${editor.id}/${file.name}`));
    await admin.auth.admin.deleteUser(editor.id);
  }
});

// exercise persistence and visibility across the editor public blog and homepage instead of mocking database calls
 test("an editor can save preview publish edit unpublish and delete an article", async ({ page, browser }) => {
  const title = `A first project ${Date.now()}`;
  const slug = `first-project-${Date.now()}`;
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(editor.email);
  await page.getByLabel("Password", { exact: true }).fill(editor.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/posts/new");
  await page.getByLabel(/^Title/).fill(title);
  await page.getByLabel(/^Slug/).fill(slug);
  await page.getByLabel(/^Excerpt/).fill("A synthetic article proving the complete publishing workflow.");
  await page.getByRole("button", { name: "Add paragraph", exact: true }).click();
  await page.getByLabel("Paragraph text", { exact: true }).first().fill("Start with a useful question. Build a small version and learn from actual feedback.");
  await page.getByRole("checkbox", { name: "Getting Started", exact: true }).check();
  const png = await sharp({ create: { width: 320, height: 180, channels: 3, background: "#245544" } }).png().toBuffer();
  await page.getByLabel("Choose image", { exact: true }).setInputFiles({ name: "project-cover.png", mimeType: "image/png", buffer: png });
  await expect(page.getByText("Cover uploaded. Add alt text before saving the post.", { exact: true })).toBeVisible();
  await page.getByLabel(/^Alternative text/).fill("An original forest green editorial cover");
  const saved = page.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname === "/api/admin/posts");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  const response = await saved;
  expect(response.ok()).toBeTruthy();
  const { data } = await response.json();
  postIds.add(data.id);
  await expect(page).toHaveURL(new RegExp(`/admin/posts/${data.id}/edit$`));
  await page.reload();
  await expect(page.getByLabel(/^Title/)).toHaveValue(title);
  await expect(page.getByRole("checkbox", { name: "Getting Started", exact: true })).toBeChecked();
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  expect((await publicPage.goto(`/blog/${slug}`))?.status()).toBe(404);
  expect((await publicPage.goto(`/admin/posts/${data.id}/preview`))?.url()).toContain("/login");
  await page.goto(`/admin/posts/${data.id}/preview`);
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await page.goto(`/admin/posts/${data.id}/edit`);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("Post published.", { exact: false }).first()).toBeVisible();
  expect((await publicPage.goto(`/blog/${slug}`))?.status()).toBe(200);
  await expect(publicPage.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(publicPage.getByAltText("An original forest green editorial cover")).toBeVisible();
  await expect.poll(() => publicPage.getByAltText("An original forest green editorial cover").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await publicPage.goto("/");
  await expect(publicPage.getByRole("link", { name: title, exact: true })).toBeVisible();
  await publicPage.goto(`/blog?q=${encodeURIComponent(title)}`);
  await expect(publicPage.getByRole("link", { name: title, exact: true })).toBeVisible();
  const editedTitle = `${title} — revised`;
  await page.getByLabel(/^Title/).fill(editedTitle);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Save published changes", exact: true }).click();
  await expect(page.getByText("Post published.", { exact: true })).toBeVisible();
  await publicPage.goto(`/blog/${slug}`);
  await expect(publicPage.getByRole("heading", { name: editedTitle, exact: true })).toBeVisible();
  const unpublishResponse = page.waitForResponse(response => response.request().method() === "PATCH" && new URL(response.url()).pathname === `/api/admin/posts/${data.id}`);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Unpublish", exact: true }).click();
  expect((await unpublishResponse).ok()).toBe(true);
  await expect(page.getByText("Draft saved.", { exact: true })).toBeVisible();
  expect((await publicPage.goto(`/blog/${slug}`))?.status()).toBe(404);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Delete post", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/posts$/);
  expect((await publicPage.request.get(`/api/posts/${slug}`)).status()).toBe(404);
  await visitor.close();
});

// retain author input and protect unsaved navigation after the server rejects a duplicate public address
 test("failed saves retain input and unsaved navigation needs confirmation", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(editor.email);
  await page.getByLabel("Password", { exact: true }).fill(editor.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/posts/new");
  await page.getByLabel(/^Title/).fill("A retained draft after a validation error");
  await page.getByLabel(/^Slug/).fill("start-with-one-useful-question");
  await page.getByLabel(/^Excerpt/).fill("The server should reject this duplicate slug without losing the draft.");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator("#slug-error")).toContainText("already used");
  await expect(page.getByLabel(/^Title/)).toHaveValue("A retained draft after a validation error");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("link", { name: "Back to posts", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/posts\/new$/);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("link", { name: "Back to posts", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/posts$/);
});
