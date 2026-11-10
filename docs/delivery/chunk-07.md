# Chunk 07 — Protected editorial workflow and media

## Delivered

- A persisted post collection with search, status filters, pagination, explicit retry and truthful loading/empty/error states.
- Protected new/edit/preview routes and a structured block editor supporting paragraphs, level-two/three headings and ordered/unordered lists. Unchanged rich-text nodes retain their original marks and nesting. Editing a formatted block explicitly warns when converting it to plain text; arbitrary HTML is not accepted.
- Title, unique slug, excerpt, categories, cover alt text and explicit save, publish, unpublish and delete operations. Server validation and duplicate-slug feedback preserve inputs; saved status appears only after a successful response.
- Unsaved-change protection for internal navigation and browser unloading. This is in-memory editing, not autosave or local-disk persistence.
- Genuine cover upload: editor/session/origin checks, 5 MiB request/file limits, raster signatures, full Sharp decoding with a 20-megapixel cap, metadata removal/re-encoding to WebP, and bounded 1920px output. No filename or MIME claim alone is accepted.
- Same-origin public cover delivery under `/media/covers/...` so the remote browser does not require access to the local Supabase port. Covers intentionally remain public even for draft articles; uploads do not use a routine service-role key.
- An additive Storage-policy compatibility migration. Storage v1.88.0 checks `contentLength` during upload permission probes and records `size` after upload. Both are bounded without relaxing MIME, folder, or editor rules. Four database regressions and the actual Storage API upload test cover this boundary.

## Verification

- The real browser workflow saves a draft, refreshes it, restores categories, uploads a valid cover, sets alt text, checks private preview, publishes, verifies the public article and homepage, edits, unpublishes and deletes.
- A second browser test checks duplicate-slug failure, input preservation and the unsaved-navigation confirmation.
- The media test covers unauthenticated/viewer denial, unrelated origins, a fake PNG containing script text, an oversized file, successful image normalization/storage, and public retrieval through the same-origin route.
- The integrated TypeScript/lint/unit/build checks and the complete browser/database suites are recorded in [delivery status](status.md). Screenshots were captured from the actual running application, not the Phase 1 board.

## Boundaries

Uploaded covers are standalone public assets; replacing/removing a post reference does not promise deletion of the storage object. Automatic orphan-media cleanup and revision history are not part of this workflow. The admin Inquiries destination remains explicitly unimplemented until the consultation phase, rather than presenting invented requests or reply buttons. The content renderer and URL helpers are shared with the public Journal delivered next.

Reference for the observed preflight field: [Storage v1.88.0 uploader](https://github.com/supabase/storage/blob/v1.88.0/src/storage/uploader.ts). Storage constraints protect ownership and metadata; server-side raster decoding proves byte validity on the app's upload endpoint.
