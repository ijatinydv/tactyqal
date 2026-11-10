import { expect, test } from "@playwright/test";
import axe from "axe-core";
import { createAuthFixture, localAuthAdmin } from "../helpers/local-auth";

// check actual rendered public and private screens for automated accessibility regressions before handoff
 test("public and editorial pages satisfy the sampled wcag accessibility rules", async ({ page }) => {
  test.setTimeout(120000);
  const violations: unknown[] = [];
  const editor = await createAuthFixture("editor");
  try {
    for (const path of ["/", "/projects", "/projects/neighbourhood-library", "/blog", "/blog/start-with-one-useful-question", "/contact", "/privacy", "/login"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.evaluate(axe.source);
      const result = await page.evaluate(async () => (window as typeof window & { axe: typeof axe }).axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }));
      if (result.violations.length) violations.push({ path, violations: result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })) });
    }
    await page.getByLabel("Email address", { exact: true }).fill(editor.email);
    await page.getByLabel("Password", { exact: true }).fill(editor.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    for (const path of ["/admin", "/admin/posts", "/admin/posts/new", "/admin/inquiries"]) {
      await page.goto(path); await page.waitForLoadState("networkidle");
      await page.evaluate(axe.source);
      const result = await page.evaluate(async () => (window as typeof window & { axe: typeof axe }).axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }));
      if (result.violations.length) violations.push({ path, violations: result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })) });
    }
    expect(violations).toEqual([]);
  } finally {
    await localAuthAdmin().auth.admin.deleteUser(editor.id);
  }
});

// preserve readable reflow and menu semantics for small screens and enlarged text rather than desktop snapshots alone
 test("mobile navigation and enlarged public text remain accessible", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ["/", "/projects/market-day", "/blog", "/contact", "/privacy"]) {
    await page.goto(path);
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(axe.source);
  const result = await page.evaluate(async () => (window as typeof window & { axe: typeof axe }).axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }));
  expect(result.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) }))).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Menu", exact: true })).toBeFocused();
});
