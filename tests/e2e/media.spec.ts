import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { createAuthFixture, localAuthAdmin } from "../helpers/local-auth";
import { apiSessionCookie } from "../helpers/api-session";

// prove real storage accepts decoded raster covers while rejecting forged metadata and unauthorised callers
 test("cover uploads enforce permissions origin and actual image content", async ({ page, request, baseURL }) => {
  const editor = await createAuthFixture("editor");
  const viewer = await createAuthFixture("viewer");
  const origin = baseURL ?? "http://127.0.0.1:3000";
  const png = await sharp({ create: { width: 24, height: 24, channels: 3, background: "#245544" } }).png().toBuffer();
  try {
    const anonymous = await request.post("/api/admin/uploads", { headers: { origin }, multipart: { file: { name: "cover.png", mimeType: "image/png", buffer: png } } });
    expect(anonymous.status()).toBe(401);
    const viewerCookie = await apiSessionCookie(viewer);
    const viewerUpload = await request.post("/api/admin/uploads", { headers: { origin, cookie: viewerCookie }, multipart: { file: { name: "cover.png", mimeType: "image/png", buffer: png } } });
    expect(viewerUpload.status()).toBe(403);
    await page.goto("/login");
    await page.getByLabel("Email address", { exact: true }).fill(viewer.email);
    await page.getByLabel("Password", { exact: true }).fill(viewer.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText("editor access");
    await page.getByLabel("Email address", { exact: true }).fill(editor.email);
    await page.getByLabel("Password", { exact: true }).fill(editor.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    const crossOrigin = await page.request.post("/api/admin/uploads", { headers: { origin: "https://unrelated.example" }, multipart: { file: { name: "cover.png", mimeType: "image/png", buffer: png } } });
    expect(crossOrigin.status()).toBe(403);
    const disguised = await page.request.post("/api/admin/uploads", { headers: { origin }, multipart: { file: { name: "cover.png", mimeType: "image/png", buffer: Buffer.from("<script>unsafe()</script>") } } });
    expect(disguised.status()).toBe(422);
    const oversize = await page.request.post("/api/admin/uploads", { headers: { origin }, multipart: { file: { name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) } } });
    expect([413, 422]).toContain(oversize.status());
    const upload = await page.request.post("/api/admin/uploads", { headers: { origin }, multipart: { file: { name: "cover.png", mimeType: "image/png", buffer: png } } });
    expect(upload.status(), await upload.text()).toBe(201);
    const { data } = await upload.json();
    expect(data.path).toMatch(new RegExp(`^${editor.id}/.*\\.webp$`));
    const publicImage = await request.get(data.url);
    expect(publicImage.status()).toBe(200);
    expect(publicImage.headers()["content-type"]).toContain("image/webp");
  } finally {
    const admin = localAuthAdmin();
    const { data } = await admin.storage.from("covers").list(editor.id);
    if (data?.length) await admin.storage.from("covers").remove(data.map(file => `${editor.id}/${file.name}`));
    await admin.auth.admin.deleteUser(editor.id);
    await admin.auth.admin.deleteUser(viewer.id);
  }
});
