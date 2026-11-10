import { expect, test } from "@playwright/test";

// connect the mentoring offer to transparent project stories and a meaningful consultation destination
 test("homepage and illustrative projects work across mobile and desktop", async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Build what comes next");
    const action = page.getByRole("link", { name: "Request a free consultation", exact: true }).first();
    if (width === 390) { const box = await action.boundingBox(); expect(box!.y + box!.height).toBeLessThan(844); }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto("/projects");
  await expect(page.getByText(/illustrative|original concept/i).first()).toBeVisible();
  await page.getByRole("link", { name: /Neighbourhood Library/i }).first().click();
  await expect(page).toHaveURL(/\/projects\/neighbourhood-library$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Neighbourhood Library");
  await expect(page.getByText(/not a.*student|not.*student outcome|illustrative/i).first()).toBeVisible();
  expect((await page.goto("/projects/not-a-project"))?.status()).toBe(404);
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
