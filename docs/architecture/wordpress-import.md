# WordPress import proof of concept

The importer accepts a local JSON file shaped like the WordPress REST API. It never crawls a site, performs an HTTP request, or accepts remote input. Use the checked-in synthetic export as a dry-run example:

```sh
node scripts/import-wordpress.mjs
node scripts/import-wordpress.mjs --file /path/to/local-export.json
node scripts/import-wordpress.mjs --file /path/to/local-export.json --apply
```

Dry-run is the default. The CLI checks the configured Supabase CLI status through `scripts/local-auth.mjs`; that helper refuses non-local API hosts before returning its service-role client. `--apply` is the only write mode. Apply the migration to the local database first; it adds source identity and provenance columns and an invoker-security RPC whose execute grant is limited to `service_role`.

All imported entries become drafts and have no `author_id`. The source post ID and source namespace URL form the unique identity, so repeated applies skip an existing imported row without overwriting editorial changes. A manual post occupying the original slug is reported as a conflict and is not changed. The source URL, source publication date, and display author are stored separately from the actual account author and draft publication timestamp. Categories are matched by normalized slug or inserted together with the post in the same per-record RPC transaction. Duplicate source rows do not update post or category data.

Only paragraphs, H1–H3 headings, lists, bold, italic, and absolute HTTP(S) links are converted to the editor's constrained rich-document format. Scripts, styles, frames, embedded objects, SVG, MathML, images, and their attributes are discarded; unknown harmless containers are unwrapped. Links with non-HTTP(S) protocols lose link formatting. Input sizes, record counts, document nodes, nesting, text, categories, and malformed-record diagnostics are bounded.

The original source URL is retained as provenance; this migration does not create redirects. If source URLs change, review and publish redirect rules through the site's normal routing/deployment process rather than enabling automatic redirects from imported data.

## Local verification

Run focused importer checks with `node --test tests/integration/wordpress-import.test.mjs`. Database persistence tests are opt-in: start the repository's local Supabase stack, apply migrations, then run `WORDPRESS_IMPORT_INTEGRATION=1 node --test tests/integration/wordpress-import.test.mjs`. The test uses uniquely namespaced source records and removes only its own imported rows and categories.
