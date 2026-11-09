# Chunk 03 — Application foundation

Implements the approved feature-based Next.js foundation, not the completed homepage, blog feed, consultation service, or content editor.

## Delivered

- Next.js 16.4.5 App Router, React 19.3.1, TypeScript 6.0.3, Tailwind 4.3.5; exact dependencies and pnpm lockfile.
- Newsreader and Manrope packaged locally through Fontsource, no build-time font download.
- Public/auth route groups, actual responsive navigation, keyboard/focus-safe Radix mobile dialog, footer, landmarks and recovery screens.
- Shared button/slot, input, alert and a development-only UI reference at `/design-system`.
- Truthful transitional destinations for Journal, consultation, projects and editorial login; no fake forms or successful mutations.
- ESLint feature/UI boundaries, strict TypeScript, Vitest component checks, Playwright public/mobile journeys, security response headers.
- Repository-owned setup and Preview scripts. No Supabase credentials are required for this chunk.

## Commands

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm test:e2e
```

Install a Playwright browser using your authorised dependency setup, or set `CHROME_EXECUTABLE_PATH` to an installed Chrome executable. Set `PLAYWRIGHT_BASE_URL` to reuse a running Preview; otherwise the test runner starts the application itself.

## Version decision

TypeScript 7 is not yet supported by the installed typescript-eslint parser. ESLint 10 is outside the peer ranges of Next's current React/import/accessibility plugins. Pin TypeScript 6.0.3 and ESLint 9.39.5 rather than suppress compatibility warnings or relax linting. Reassess together when the supported dependency ecosystem moves; no automatic major upgrades.

## Verification

`pnpm check` and `pnpm build` pass. Public navigation and mobile keyboard/browser tests passed (2/2) against the production-mode managed Preview. In this sandbox the development server returned HTML but did not hydrate reliably (both default Turbopack and Webpack were checked). Production-mode browser checks pass. The durable managed Preview therefore builds and runs `next start`, proving shipped behavior rather than relying on the development HMR connection. `pnpm dev` remains available for normal development; no claim is made that sandbox HMR works. Desktop/mobile screenshots live in ignored `.hoplite/artifacts/phase-2/`; they are current app evidence, not the Phase 1 board. No database or auth claim belongs to this chunk.
