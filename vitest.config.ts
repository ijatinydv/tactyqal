import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// keep fast component tests independent from persisted browser and database suites
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"], include: ["src/**/*.test.{ts,tsx}"], restoreMocks: true },
});
