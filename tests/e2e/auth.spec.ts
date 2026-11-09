import { expect, test } from "@playwright/test";
import { createAuthFixture, expireLocalSessions, expireBrowserAccessToken, localAuthAdmin } from "../helpers/local-auth";

// hold only temporary local identities for the real session lifecycle tests
let editor: Awaited<ReturnType<typeof createAuthFixture>>;

// retain a separate unprivileged identity to test database owned role boundaries
let viewer: Awaited<ReturnType<typeof createAuthFixture>>;

// create genuine auth accounts before exercising the production application through its login form
 test.beforeAll(async () => {
  editor = await createAuthFixture("editor");
  viewer = await createAuthFixture("viewer");
});

// remove temporary identities and their sessions after the browser suite completes
 test.afterAll(async () => {
  const admin = localAuthAdmin();
  for (const fixture of [editor, viewer]) if (fixture) await admin.auth.admin.deleteUser(fixture.id);
});

// prevent unauthenticated visitors from reaching any protected administrative route
 test("unauthenticated admin routes return to login", async ({ page }) => {
  for (const path of ["/admin", "/admin/posts", "/admin/inquiries"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  }
});

// preserve safe login feedback without leaking whether a submitted identity exists
 test("invalid credentials and noneditor identities cannot enter", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(viewer.email);
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password-for-test");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.locator("form").getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(viewer.email);
  await page.getByLabel("Password", { exact: true }).fill(viewer.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(/access|editor|permission/i);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

// prove invited editors retain an authorised session across refresh and clear it through a post action
 test("editor signs in, refreshes and signs out", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(editor.email);
  await page.getByLabel("Password", { exact: true }).fill(editor.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/admin$/);
  const response = await page.goto("/admin/posts");
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await page.getByRole("button", { name: /sign out|log out/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

// renew an expired access token through the proxy when its refresh session remains valid
 test("valid refresh sessions renew without exposing cached auth responses", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(editor.email);
  await page.getByLabel("Password", { exact: true }).fill(editor.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expireBrowserAccessToken(page.context());
  const response = await page.goto("/admin/posts");
  await expect(page).toHaveURL(/\/admin\/posts$/);
  expect(response?.headers()["cache-control"]).toContain("no-store");
  expect(response?.headers()["pragma"]).toBe("no-cache");
  expect(response?.headers()["expires"]).toBe("0");
  const headers = await response!.allHeaders();
  expect(headers["set-cookie"]).toContain("sb-");
  await page.reload();
  await expect(page).toHaveURL(/\/admin\/posts$/);
});

// reject an expired access token when its refresh session is no longer valid
 test("expired sessions cannot retain administrative access", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(editor.email);
  await page.getByLabel("Password", { exact: true }).fill(editor.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expireBrowserAccessToken(page.context());
  expireLocalSessions(editor.id);
  await page.goto("/admin/inquiries");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});
