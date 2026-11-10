# Chunk 08 — Public Journal and connected resources

## Delivered

- A database-backed published archive with GET search, category filters, bounded paging, result counts and shareable URLs. Clear filters, filtered-no-matches, empty archive and backend failure are distinct states.
- Published article pages with safe structured rich text, real publication timestamps, calculated reading time, alternative text and covers served through the app. Drafts, unpublished posts and missing slugs return 404, not private preview data.
- Related published resources, article metadata/canonical/Open Graph URLs and escaped Article JSON-LD. No invented author biography, student outcome or republished WordPress content is added.
- A generated sitemap containing public destinations and currently published articles only; private admin/API routes are excluded. The 5,000-article generation budget fails explicitly if exceeded or if concurrent changes prevent a complete archive, rather than silently truncating output. Larger production archives would require sitemap partitioning.
- A live latest-articles homepage section. Publishing/editing/unpublishing changes both the Journal and homepage without rebuilding. The complete marketing homepage remains Phase 4 scope.
- Visible independent-demo/sample-content disclosures and the existing noindex policy. A real business release needs the correct public origin and a deliberate indexing decision, not a demo localhost canonical.

## Verification

- The end-to-end publishing test creates through the UI, uploads a genuine raster cover, saves/reloads, previews, publishes, verifies public article/image/homepage/search, edits, unpublishes and deletes.
- Public browser tests check category/search persistence, actual next/previous pagination using isolated fixtures, no-match recovery, canonical metadata, mobile reflow, sitemap inclusion and draft exclusion.
- Rich-text regression tests verify canonical h2/h3 nodes and lists, escaped markup text and blocked unsafe link protocols. No `dangerouslySetInnerHTML` is used for editorial content.
- Managed Preview desktop Journal, mobile article and editor screens are captured and inspected. Final command results and scope limitations are recorded in [delivery status](status.md).

## Configuration and boundaries

Set `NEXT_PUBLIC_SITE_URL` to the public application origin for canonical/OG/JSON-LD/sitemap output. Missing/invalid production origins are not silently invented; sitemap generation fails with a configuration error. Local setup deliberately configures a local origin for development only.

Public pages call the shared server service directly using an anonymous cookie-free Supabase client. Public article/list/homepage reads are dynamic and no-store; mutations also invalidate their paths. Covers are immutable-path public assets with a short delivery cache; they do not expose draft text. Their upstream Supabase service stays private to the local runtime.

Scheduled publication, comments, subscriptions, editorial revision history, full WordPress migration, hosted deployment, and a consultation-request backend are not part of this phase. Changing an existing slug invalidates its old address and returns 404 there; a verified migration redirect map remains future work.
