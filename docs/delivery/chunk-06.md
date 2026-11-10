# Chunk 06 — Persisted content services and CRUD APIs

## Delivered

- A shared server-only content service used by Route Handlers and server-rendered pages; no self-HTTP or normal service-role client.
- Public published-post list/detail and category APIs; protected editor list/get/create/update/delete and category discovery.
- Explicit JSON errors for unauthenticated/forbidden callers, same-origin mutation checks, bounded JSON bodies, strong Zod validation, unique-slug conflict handling and deterministic pagination.
- Constrained rich-text documents with bounded depth/size and safe HTTP(S) links. Publishing requires substantive text; arbitrary HTML and unsupported embeds are not accepted.
- An invoker-rights database function atomically saves a post and its category assignments under the caller's RLS. Author and publication timestamps are not accepted from browser input.
- Public responses omit drafts. Editor role checks query database-owned profiles rather than editable metadata.
- Dynamic public reads plus mutation path invalidation make edits, slug changes, unpublishing and deletion visible without deployment. Old changed slugs become 404; production WordPress redirects remain a migration concern, not a claimed feature here.

## Routes and usage

See [API contract](../architecture/blog-api.md) for request/response examples and error codes. Routes use `/api/posts`, `/api/posts/[slug]`, `/api/categories`, `/api/admin/posts`, `/api/admin/posts/[id]`, and `/api/admin/categories`. Uploads are delivered separately in Chunk 07.

```sh
pnpm db:migrate
pnpm db:types
pnpm db:test
pnpm test:integration
```

The integration runner creates a real temporary local editor, keeps credentials only in process memory, exercises persisted HTTP operations, then removes its records and identity. It requires a running application and disposable local Supabase. It is not a mocked database test and must not run against customer data.

## Verification boundary

The final integrated verification is recorded in [delivery status](status.md). Unit/schema checks, database permission and atomic-rollback assertions, and real HTTP tests cover this chunk. Editorial browser workflow and public Journal evidence are recorded with Chunks 07–08. No hosted production migration or completed WordPress import is implied.
