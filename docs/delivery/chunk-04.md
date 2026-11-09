# Chunk 04 — Database, permissions and reproducible local stack

Implements the Supabase foundation; blog CRUD APIs and the atomic post/category application operation remain Chunk 06.

## Delivered

- PostgreSQL 17 schema: protected profiles, posts, categories, post/category links, and private adult consultation requests.
- Draft/publication integrity, bounded values, foreign keys, timestamps and query indexes.
- Database-owned viewer/editor roles, least-privileged new-user trigger, privileged private bootstrap procedure, and RLS independent of application routing.
- Public-only published article/category reads; direct public/viewer mutations denied or filtered. No public inquiry submission/read policy.
- Public covers with restricted editor writes in their own UUID folder, raster MIME/extension and 5 MiB limits. Actual byte inspection belongs to the upload service in Chunk 07.
- Original synthetic seed articles, no seeded passwords or customer records.
- Generated database types, lockfile-pinned Supabase JavaScript client, and idempotent repository-owned setup.

## Local workflow

Use the Docker runtime and Supabase CLI 3.0.0 used for this verification. Never expose local Studio/database ports as a public Preview. The app's port 3000 is the only published interface.

```sh
pnpm db:start          # starts the local stack, excludes privileged vector log shipper
pnpm db:migrate        # applies pending local migrations without resetting data
pnpm env:local         # creates ignored local URL/nonprivileged key; refuses overwrite
pnpm db:test           # runs the actual pgTAP permission/integrity suite
pnpm db:types          # regenerates TypeScript from the local schema
```

`pnpm db:reset` is explicitly destructive to local development data and identities; use it only when intentionally rebuilding the disposable stack. It is never run by normal setup. The successful reset proved that migrations plus seeds reconstruct this project from scratch.

## Test runner compatibility

The installed Supabase CLI's `supabase test db` asks Docker for security-option overrides when launching pg_prove; this sandbox correctly rejects that container request. The repository does not change the policy or request privileged containers. `pnpm db:test` sends the same pgTAP SQL through `psql` inside the already-running database container and evaluates TAP with the installed standard Perl `prove` runner. SQL errors, failed assertions and incorrect test plans fail the command. Set `SUPABASE_DB_CONTAINER` only when your local container name differs.

## Verified

A real local reset applied the migrations and synthetic seed. `pnpm db:test` passed all 78 permission/integrity assertions; generated types were produced from that database. Managed setup was rerun successfully: frozen dependency installation, healthy local stack, pending migrations, and non-overwriting local environment handling. Normal application configuration contains no service-role/secret key.

See [database architecture and provisioning](../architecture/database.md) for table ownership, role grants, media visibility and bootstrap boundaries. Auth browser verification is recorded separately in Chunk 05.

Independent review identified whitespace-only text as a database validation gap; a follow-up migration and five regression assertions close it without resetting existing Auth identities.
