# Delivery status

Updated 2026-11-10. Phases 1–5 are complete through Chunk 12. Do not interpret later acceptance checklists as passing implementation tests.

## Completed in order

| Work | Status | Evidence |
|---|---|---|
| Repository structure | Complete | [Feature-based monolith, boundaries, security, scale and test ownership](../architecture/repository-structure.md) |
| Chunk 01: brand and UX research | Complete | [Dated live-site audit](../research/brand-ux-audit.md), four public screenshots, non-submitting interaction checks |
| Chunk 01: product definition | Complete | [Audience journeys, scope, routes and quality gates](../product/product-brief.md) |
| Chunk 02: design contract | Complete | [Tokens, real copy, responsive layouts and component states](../design/design-specification.md) |
| Chunk 02: visual reference | Complete | [Responsive static study](../design/boards/index.html), [desktop](../design/evidence/2026-11-09-home-desktop.png), [mobile](../design/evidence/2026-11-09-home-mobile.png) |
| Chunk 02: screen acceptance | Complete as specification | [Implementation checklist](../design/screen-acceptance.md); implementation boxes deliberately unchecked |

The visual study contains original illustrative projects/articles and static product-control specimens. Its six document-navigation links and native FAQ disclosures work, but it does not implement routing, authentication, database storage, uploads, editing, publishing, or inquiry submission.

## Verification performed

### Existing public site

Chromium desktop 1440 × 1000 and mobile 390 × 844 inspection; source text and DOM checks on homepage, blog and About. Clicked primary consultation CTA to `#contact` and inspected the rendered Google Calendar scheduler, without booking. Opened the homepage mobile menu and FAQ by pointer, and checked the blog mobile menu’s expanded state. No performance benchmark, complete accessibility audit, form submission, or conversion measurement was performed.

### Current design study

- Browser layout checks at 1440 × 1000, 1024 × 900, 768 × 1024, 390 × 844, and 375 × 812: no document horizontal overflow or sampled right-edge element overflow.
- Original cover illustrations checked for internal text overflow after a cramped tablet composition was found and corrected.
- Primary CTA bottom measured relative to the homepage frame: 694px, 633px, 496px, 543px, 543px respectively. This is a design-board result, not a deployed-app conversion or viewport measurement; the surrounding study title/navigation are outside that frame.
- Six internal screen-navigation links passed. Native FAQ disclosure opened/closed with Enter. Static menu and form specimens are intentionally not functional; no app behavior is implied.
- Newsreader loaded in the inspected browser. Desktop/mobile homepage, tablet composition, Journal, article, editor, and contact screenshots were captured; the homepage, tablet, article, editor and contact views were visually inspected.
- Token calculations: ink/canvas 14.17:1; muted/canvas 5.82:1; white/forest 8.54:1; control border/white 4.02:1; control border/canvas 3.69:1; danger/white 7.17:1. These pairings meet their specified text/UI thresholds, not a certification of all screens or states.
- Final handoff checks passed: 28 local Markdown references, HTML fragment/stylesheet references, ignored local/secret paths, and diff whitespace.
- Independent read-only architecture/document review returned no material must-fix issues.

At the Phase 1 boundary, no application or database tests applied. Chunk 03 adds application lint, type, unit, build and browser checks; later sections track the implemented chunks.

## Next chunks and dependencies

| Chunk | Work | Depends on | Current state |
|---|---|---|---|
| 03 | Next.js foundation, pinned versions, design tokens and actual shell | 02 | Complete; see [verification](chunk-03.md) |
| 04 | Supabase schema, migrations, policies, storage, synthetic seeds | 03 | Complete; see [verification](chunk-04.md) |
| 05 | Invited-editor auth and protected admin shell | 04 | Complete; see [verification](chunk-05.md) |
| 06 | Shared content service and CRUD APIs | 05 | Complete; see [verification](chunk-06.md) |
| 07 | Editorial dashboard and real publishing workflow | 06 | Complete; see [verification](chunk-07.md) |
| 08 | Database-backed Journal/article pages | 07 | Complete; see [verification](chunk-08.md) |
| 09 | Homepage and project storytelling | 08 | Complete; see [verification](chunk-09.md) |
| 10 | Consultation request and private inbox | 09 + database/auth | Complete; see [verification](chunk-10.md) |
| 11 | Synthetic WordPress import proof of concept | 08; after core flow | Complete; see [verification](chunk-11.md) |
| 12 | Release verification and polish | 09–10; 11 if included | Complete; see [verification](chunk-12.md) |
| 13 | Deployment and safe judge access | 12 | Not started |
| 14 | README, evidence and walkthrough submission | 13 | Not started |

## Unresolved inputs and safe defaults

- No confirmed current price/refund/scarcity: omit these claims.
- No approved mentor bios/student-media rights: no fabricated team or republished portraits/screenshots.
- No production calendar authority: isolated demo requests, not bookings into the real business calendar.
- No user analytics/interviews: audience/funnel recommendations remain reasoned hypotheses.
- No hosted Supabase settings are required for this phase. Add public URL/publishable key through project environment settings before hosted integration; never paste database passwords or secret keys in chat. Browser API keys do not authorise migrations.
- Repository is connected to `ijatinydv/tactyqal`; `main` contains the Phase 2 baseline. Phase 3 commits are reviewed separately through the feature branch and PR; no merge or hosted production deployment is implied. The managed local Preview is available.

## Phase 2 handoff

- Chunk 03: `13655e4` responsive Next.js foundation.
- Chunk 04: `202df48` database/schema/policies/seeds, including nonblank-text regression hardening.
- Chunk 05: separate invited-editor auth commit in this delivery; see Git history for its final hash.
- Verification: `pnpm check`, `pnpm build`, `pnpm db:test` (78 assertions), and `pnpm test:e2e` (7 real browser tests) pass. Local managed setup is idempotent and the Preview uses production mode to avoid the observed dev/HMR failure.
- Auth credentials remain in ignored local state. No hosted secrets are needed for local verification; hosted configuration and safe reviewer access belong to the deployment chunk.

## Phase 3 handoff

Three separate implementation commits preserve the API, editorial/media, and public-Journal work. Commit messages describe the actual changes without phase/chunk numbering. The Phase 3 PR targets `main`, which already contains the Phase 2 baseline.

Verification against the real disposable local stack:

- `pnpm check`: lint, strict type checks, and 13 unit/component tests pass.
- `pnpm db:test`: 100 pgTAP assertions pass, including atomic rollback, role boundaries, draft privacy and Storage preflight regression coverage.
- `pnpm test:integration`: persisted HTTP CRUD passes with no skipped test; ephemeral credentials remain only in operational process memory.
- `pnpm test:e2e`: all 14 browser tests pass, covering public navigation, actual viewer API denial, Auth lifecycle, safe refresh/expiry, Journal search/categories/pagination, metadata, media validation, complete publishing, failed-save recovery and unsaved-navigation checks.
- Production build and managed Preview are verified. The existing development-HMR limitation remains; the Preview uses `next build`/`next start` and does not claim working sandbox HMR.
- Fresh desktop/mobile screenshots and live interaction checks are inspected. Only original demo data is used; uploaded evidence contains no credentials or real inquiries.

An independent review identified incompatible heading node representations during integration. The canonical heading representation is now used by both editor and reader and has a regression test. Actual Storage API testing identified `contentLength` preflight metadata versus final `size`; an additive migration supports both while keeping MIME/size/folder/role restrictions. A mutation-origin check now accounts for trusted hosting proxy headers rather than Next's internal listener address.

Limitations: no consultation collection, real business calendar integration, production hosting, WordPress migration, or automatic orphan-media cleanup. Demo pages remain noindexed. Article slug changes return 404 at the old address until a verified redirect map is introduced. Public requests fetch current published data; cover assets use immutable generated paths.

## Phase 4 handoff

- PR #1 is confirmed merged. The new Phase 4 branch is derived from the merged `main` baseline, not stacked onto an open Phase 3 PR.
- Separate commits preserve homepage/project storytelling and consultation/backend/inbox work. Commit messages use descriptive feature names without chunk labels.
- `pnpm check` passes lint/type checking and 17 unit/component tests.
- `pnpm db:test` passes 127 assertions, including public/viewer privacy, transactional submission, idempotency conflict, per-email/global rate limits, and editor status/deletion.
- `pnpm test:e2e` passes all 18 browser tests. Actual form/API submission, identical retry, durable throttling, viewer denial, private review/delete, mocked retry recovery, project navigation, mobile CTA/reflow, and the existing publishing/auth/media flows are covered.
- `pnpm test:integration` passes persisted blog CRUD with no skipped test. The production build and managed Preview are healthy; the earlier sandbox dev-HMR limitation is unchanged.
- Desktop/mobile homepage, project and contact screenshots are captured and inspected. The actual editor inbox loads at 390px without page overflow. No real contact information or credentials is included in published evidence.
- Narrowing the adult relationship enum required fixture values to use `parent_guardian`. Database rate tests isolate counters inside a rolled-back transaction, so they are repeatable without clearing real retained demo counters. This changes test setup, not the enforced limits.

## Phase 5 handoff

- PR #2 is confirmed merged; Phase 5 starts from its merged `main` baseline on a separate feature branch.
- Import proof of concept and release repairs are committed separately with descriptive messages, without chunk labels.
- The actual fixture CLI produced dry_run → inserted → skipped; its synthetic draft was inspected in the protected editor, then only that explicitly created fixture was removed to keep the demo seed archive reproducible.
- `pnpm test:import` passes four tests with persistence enabled and no skip: sanitisation, bounded diagnostics, repeat-import/editor-change preservation, provenance/category mapping, slug collision and transaction rollback.
- `pnpm db:test` passes 131 assertions, including import RPC grants restricted to the operational role. `pnpm check` passes 17 unit/component tests plus lint and strict TypeScript.
- Automated accessibility checks cover eight public/auth routes, four private editorial routes, the mobile dialog and 200% text reflow at 375px. They are sampled rule checks, not certification.
- The release audit repaired an uneditable native search field, mismatched accessible link names, duplicate SVG title IDs, and enlarged-text overflow. Regression checks exercise the actual corrected behavior rather than weakening expectations.
- One fresh local production-browser performance sample measured LCP 628ms, CLS0.0331, FCP628ms, TTFB84.9ms and281894bytes at390×844 without throttling. These figures are not hosted/field/Lighthouse/INP claims.
- Final production build and managed Preview pass. The full 20-test browser suite, persisted HTTP CRUD, four importer tests with no skip, 131 database assertions, and 17 unit/component tests pass. No live WordPress migration, hosted deployment or submission video is implied.

## Immediate implementation instruction

Proceed to Phase 6 only when requested: authorised Vercel/Supabase deployment and safe judge access, then final README/evidence/walkthrough packaging. Confirm real-business content rights, commercial details, privacy/retention needs and canonical origins before any official launch. Keep demo data synthetic and do not publish editor credentials. PR creation does not authorise merging.
