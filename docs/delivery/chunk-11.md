# WordPress import proof of concept

## Delivered

- A local-only CLI and original WordPress REST-shaped fixture; no production crawling, remote source fetches, or implicit writes.
- Dry-run by default, explicit `--apply`, a 2 MiB file bound, at most 500 records, bounded diagnostics, and inert HTML parsing with no scripts/resource execution.
- Allowlisted conversion into the editor's paragraph/heading/list/text/mark vocabulary. Executable elements, arbitrary attributes and unsafe links are discarded; original content is never rendered as HTML.
- A service-role-only invoker RPC atomically inserts each draft and its categories. This operational privilege remains outside normal application requests and browser bundles.
- Unique source namespace/ID idempotency, repeat skips that preserve editorial changes, conflict reporting for occupied manual slugs, and source URL/date/author/category provenance separate from live publication identity.

## Commands

```sh
pnpm db:migrate
pnpm db:types
pnpm import:wordpress
pnpm import:wordpress --apply
pnpm test:import
```

The dry-run does not require a running database. Apply and the persisted tests use only the disposable local Supabase stack through the existing guarded operational client. Dependencies include the repository's development-only JSDOM parser; install declared dev dependencies for these tools.

## Verification and boundaries

Four importer tests pass with real persistence enabled, none skipped. They cover dry-run arguments, unsafe markup conversion, malformed diagnostics, two identical applies, preserved provenance/categories, manual-slug conflicts and per-record category atomicity. Four SQL permission assertions confirm that ordinary anonymous/authenticated users cannot invoke the import writer.

A synthetic fixture was also applied twice through the actual CLI and inspected in the protected editor. Public draft privacy remains enforced. The source publication date is preserved as `imported_published_at`; drafts remain unpublished with `published_at = null`. Publishing is a separate human-reviewed editor action, not an automatic reproduction of WordPress status.

This is not a completed production migration. Covers are not downloaded/imported; unsupported layouts and embeds are omitted rather than recreated. Original URLs are retained for a later reviewed redirect manifest; no arbitrary source-driven redirect is activated. See [import architecture](../architecture/wordpress-import.md).
