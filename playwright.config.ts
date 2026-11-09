import { defineConfig, devices } from "@playwright/test";

// exercise the actual app against either a managed preview or a dedicated local process
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000", trace: "retain-on-failure", launchOptions: { executablePath: process.env.CHROME_EXECUTABLE_PATH } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: "pnpm dev", url: "http://127.0.0.1:3000", reuseExistingServer: !process.env.CI },
});
