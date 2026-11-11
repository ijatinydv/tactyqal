import { expect, test } from "@playwright/test";

// prove the public shell connects the program offer to the implemented journal archive
 test("public navigation and resource status", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("launched app in 8 weeks");
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Journal" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ideas, tested");
  await expect(page.getByRole("link", { name: "Start With One Useful Question", exact: true })).toBeVisible();
});

// protect keyboard navigation and initial action placement on the narrow public shell
 test("mobile menu and faq are keyboard usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const action = page.getByRole("link", { name: "Book a free consultation", exact: true });
  const bounds = await action.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThan(844);
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();
  const question = page.getByText("What if my teen has no coding experience?", { exact: true });
  await question.focus(); await page.keyboard.press("Enter");
  await expect(page.getByText("No problem! Our program is designed for beginners.", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
