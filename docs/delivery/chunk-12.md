# Release verification and polish

## Scope

Verify the completed public/editorial/request flows, importer and permissions, fix demonstrated defects, and record honest release evidence. Deployment and the submission video remain Phase 6, not silently included here.

## Defects found and addressed

- Journal search used a controlled input without an update handler, so typing was blocked. It now uses native GET-form defaults and the browser test actually types/submits a query.
- Several homepage project links replaced their visible text with incompatible accessible names. Removed the redundant overrides; the wordmark/menu now expose matching visible labels.
- Repeated project artwork reused SVG title IDs. React-generated IDs keep image naming unique across the page.
- Mobile navigation and the final homepage CTA could overflow at 200% text size. Navigation now wraps and controls respect available width instead of clipping content.
- Import collision coverage now uses a distinct source identity when testing an occupied slug, rather than accidentally exercising the intentional repeat-import skip path.

## Automated accessibility

Axe Core 4.14.0 is pinned as a development-only test dependency. The browser suite scans eight public/auth pages and four private editorial pages against WCAG 2 A/AA, WCAG 2.1 A/AA and best-practice rules. A separate check covers the mobile menu and 200% text reflow. Failures are repaired, not suppressed by disabling rules. Automated scanning is not certification and does not replace keyboard/manual review.

## Performance evidence

A fresh unthrottled Chrome session at 390 × 844 against the local production build measured homepage TTFB 84.9 ms, FCP 628 ms, LCP 628 ms, CLS 0.0331, load 1162.8 ms and 281,894 transferred bytes. This is one local lab sample, not a Lighthouse score, hosted-network benchmark, field Core Web Vitals, percentile, or INP proof. Cache/network/host conditions materially affect these figures. The current bundled fonts avoid runtime third-party font requests.

## Remaining release boundaries

- Public demo remains noindexed; hosted canonical origins and actual deployment credentials are Phase 6 work.
- Production WordPress migration, media transfer, arbitrary page-layout support and active redirect rules are not claimed.
- Consultation throttling is a deliberately small-demo policy, not a production anti-abuse guarantee. Synthetic contacts only; no email/calendar integration.
- Public editorial media remains public even for drafts; orphan cleanup and revision history are documented exclusions.
- Managed Preview uses a production build because development HMR was unreliable in this sandbox. Current production browser tests, not dev-server HTML alone, establish behavior.

The final commands/counts and inspected screenshots are recorded in [delivery status](status.md).

## Final check results

- `pnpm check`: lint, strict TypeScript and 17 unit/component tests pass.
- `pnpm test:e2e`: all 20 production-mode browser tests pass, including the sampled automated accessibility and enlarged-text/mobile-menu checks.
- `pnpm test:import`: all four importer tests pass with persistence enabled and no skip.
- `pnpm test:integration`: real persisted HTTP CRUD passes.
- `pnpm db:test`: 131 SQL assertions pass.
- Managed production build/Preview pass. Current mobile homepage/Journal screenshots and the protected imported-provenance panel were inspected; no private data is shared.
- The explicit CLI demonstration fixture was removed after its editor inspection; namespaced automated test records clean up their own rows. SQL fixture checks run in rolled-back transactions.

Source attribution is visible in protected imported previews, not silently turned into a new verified editor identity. Automated scan results cover the sampled routes/states, not every possible authored article or unknown assistive technology.
