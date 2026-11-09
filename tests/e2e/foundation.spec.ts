import { expect, test } from "@playwright/test";

// prove the real public shell presents the approved offer and honest unfinished destinations
 test("public navigation and resource status", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Build what comes next");
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Journal" }).click();
  await expect(page.getByRole("status")).toContainText("Chunk 08");
});

// protect keyboard navigation and initial action placement on the narrow public shell
 test("mobile menu and faq are keyboard usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const action = page.getByRole("link", { name: "Request a free consultation", exact: true });
  const bounds = await action.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThan(844);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
  const question = page.getByText("Do I need coding experience?", { exact: true });
  await question.focus(); await page.keyboard.press("Enter");
  await expect(page.getByText("The current program is described as beginner-friendly", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
