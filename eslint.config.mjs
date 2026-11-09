import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// prevent shared presentation code from depending on domain or database internals
export default defineConfig([
  ...nextVitals, ...nextTs,
  { files: ["src/components/ui/**/*.{ts,tsx}"], rules: {
    "no-restricted-imports": ["error", { patterns: ["@/features/*", "@/lib/supabase/*", "@/content/*"] }],
  } },
  { files: ["src/features/**/*.{ts,tsx}"], rules: {
    "no-restricted-imports": ["error", { patterns: [
      { group: ["@/features/*/*", "!@/features/*/server", "!@/features/*/shared"], message: "Use another feature's explicit shared or server entrypoint; use relative imports inside a feature." },
    ] }],
  } },
  globalIgnores([".next/**", "out/**", "coverage/**", "playwright-report/**", "test-results/**", "next-env.d.ts", ".hoplite/**", ".context/**", "docs/design/boards/**"]),
]);
