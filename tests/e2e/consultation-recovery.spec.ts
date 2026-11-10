import { expect, test } from "@playwright/test";

// keep adult contact input intact when a network or rate-limit failure makes submission uncertain
 test("consultation failures preserve input and retry with the same idempotency key", async ({ page }) => {
  const submissions: Array<Record<string, unknown>> = [];
  await page.route("**/api/consultations", async route => {
    submissions.push(route.request().postDataJSON());
    if (submissions.length === 1) await route.fulfill({ status: 429, contentType: "application/json", headers: { "Retry-After": "1" }, body: JSON.stringify({ error: { code: "RATE_LIMITED", message: "Please wait before trying again." } }) });
    else await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ data: { receipt_id: "50000000-0000-4000-8000-000000000005" } }) });
  });
  await page.goto("/contact");
  await page.getByLabel("Adult contact name", { exact: true }).fill("Synthetic retry contact");
  await page.getByLabel("Email", { exact: true }).fill("retry@example.invalid");
  await page.getByLabel("I am a…", { exact: true }).selectOption("adult_participant");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send consultation request", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /wait|try|request/i }).first()).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("retry@example.invalid");
  await expect(page.getByRole("button", { name: "Send consultation request", exact: true })).toBeEnabled({ timeout: 10000 });
  await page.getByRole("button", { name: "Send consultation request", exact: true }).click();
  await expect(page.getByText(/Request received/).first()).toBeVisible();
  expect(submissions).toHaveLength(2);
  expect(submissions[0].idempotency_key).toBe(submissions[1].idempotency_key);
});
