import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createAuthFixture, localAuthAdmin } from "../helpers/local-auth";
import { apiSessionCookie } from "../helpers/api-session";

// verify stored consultation requests remain private and retries cannot duplicate the same request
 test("consultation API validates deduplicates throttles and denies public reads", async ({ request, baseURL }) => {
  const origin = baseURL ?? "http://127.0.0.1:3000";
  const email = `api-inquiry-${randomUUID()}@example.invalid`;
  const editor = await createAuthFixture("editor");
  const viewer = await createAuthFixture("viewer");
  const admin = localAuthAdmin();
  const payload = { adult_contact_name: "Synthetic adult contact", email, relationship: "parent_guardian", message: "Synthetic evaluation request; no child information.", data_use_acknowledged: true, idempotency_key: randomUUID(), website: "" };
  try {
    expect((await request.post("/api/consultations", { headers: { origin: "https://unrelated.example" }, data: payload })).status()).toBe(403);
    expect((await request.post("/api/consultations", { headers: { origin }, data: { ...payload, data_use_acknowledged: false } })).status()).toBe(422);
    expect((await request.post("/api/consultations", { headers: { origin }, data: { ...payload, website: "https://spam.example" } })).status()).toBe(422);
    const created = await request.post("/api/consultations", { headers: { origin }, data: payload });
    expect(created.status(), await created.text()).toBe(201);
    const { data } = await created.json();
    expect(data.receipt_id).toMatch(/^[a-f0-9-]{36}$/);
    expect(JSON.stringify(data)).not.toContain(email);
    const duplicate = await request.post("/api/consultations", { headers: { origin }, data: payload });
    expect([200, 201]).toContain(duplicate.status());
    expect((await duplicate.json()).data.receipt_id).toBe(data.receipt_id);
    const stored = await admin.from("consultation_requests").select("id,adult_contact_name,email,status").eq("email", email);
    expect(stored.error).toBeNull(); expect(stored.data).toHaveLength(1);
    expect(stored.data![0].status).toBe("new");
    expect((await request.get("/api/admin/inquiries")).status()).toBe(401);
    const viewerCookie = await apiSessionCookie(viewer);
    expect((await request.get("/api/admin/inquiries", { headers: { cookie: viewerCookie } })).status()).toBe(403);
    expect((await request.patch(`/api/admin/inquiries/${data.receipt_id}`, { headers: { cookie: viewerCookie, origin }, data: { status: "closed" } })).status()).toBe(403);
    expect((await request.delete(`/api/admin/inquiries/${data.receipt_id}`, { headers: { cookie: viewerCookie, origin } })).status()).toBe(403);
    expect((await request.get("/api/consultations")).status()).toBe(405);
    const editorCookie = await apiSessionCookie(editor);
    const headers = { cookie: editorCookie, origin };
    const listed = await request.get("/api/admin/inquiries", { headers });
    expect(listed.status()).toBe(200);
    expect((await listed.json()).data.items.some((inquiry: { id: string }) => inquiry.id === data.receipt_id)).toBe(true);
    const update = await request.patch(`/api/admin/inquiries/${data.receipt_id}`, { headers, data: { status: "reviewed" } });
    expect(update.status(), await update.text()).toBe(200);
    for (let i = 0; i < 2; i++) expect((await request.post("/api/consultations", { headers: { origin }, data: { ...payload, idempotency_key: randomUUID() } })).status()).toBe(201);
    const limited = await request.post("/api/consultations", { headers: { origin }, data: { ...payload, idempotency_key: randomUUID() } });
    expect(limited.status()).toBe(429); expect(limited.headers()["retry-after"]).toBeTruthy();
    expect((await request.delete(`/api/admin/inquiries/${data.receipt_id}`, { headers })).status()).toBe(200);
    expect((await admin.from("consultation_requests").select("id").eq("id", data.receipt_id)).data).toHaveLength(0);
  } finally {
    await admin.from("consultation_requests").delete().eq("email", email);
    await admin.auth.admin.deleteUser(editor.id); await admin.auth.admin.deleteUser(viewer.id);
  }
});

// exercise adult contact consent persistence and the private inbox through the actual user interface
 test("adult request reaches the protected inbox and can be reviewed and deleted", async ({ page }) => {
  const editor = await createAuthFixture("editor");
  const email = `ui-inquiry-${randomUUID()}@example.invalid`;
  const admin = localAuthAdmin();
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/contact");
    await page.getByLabel("Adult contact name", { exact: true }).fill("Synthetic guardian");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("I am a…", { exact: true }).selectOption("parent_guardian");
    await page.getByLabel(/What would you like to discuss/).fill("A synthetic request to discuss a first app idea.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Send consultation request", exact: true }).click();
    await expect(page.getByText(/Request received/).first()).toBeVisible();
    await expect(page.getByText(/respond within 24 hours/).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto("/login");
    await page.getByLabel("Email address", { exact: true }).fill(editor.email);
    await page.getByLabel("Password", { exact: true }).fill(editor.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/inquiries");
    await page.getByText(email, { exact: true }).click();
    await expect(page.getByText("A synthetic request to discuss a first app idea.", { exact: true })).toBeVisible();
    await page.getByLabel("Status", { exact: true }).selectOption("reviewed");
    await page.getByRole("button", { name: /save status|update status/i }).click();
    await expect(page.getByText(/status updated/i).first()).toBeVisible();
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: /delete request|delete inquiry/i }).click();
    await expect(page.getByText(email, { exact: true })).not.toBeVisible();
  } finally {
    await admin.from("consultation_requests").delete().eq("email", email);
    await admin.auth.admin.deleteUser(editor.id);
  }
});
