# Database foundation

The local Supabase project is configured in `supabase/config.toml`; migrations under `supabase/migrations/` are authoritative and `supabase/seed.sql` contains synthetic editorial fixtures. The API exposes only `public` and `graphql_public`; the internal `private` schema is deliberately omitted from PostgREST.

## Data model and access

- `profiles` maps each `auth.users` identity to a database-owned `viewer` or `editor` role. An auth insert trigger always creates a viewer and ignores user metadata. Users can read their own profile but have no profile write policy or write grant.
- `posts` stores a bounded title and a unique slug, excerpt, constrained JSON document, optional auth author and public cover object path, draft/published status, and timezone-aware publication and audit timestamps. A published row must have `published_at`; drafts must not.
- `categories` and `post_categories` normalize labels and links. Anonymous and viewer reads expose only categories and links attached to currently published posts; editor policies allow all editorial content operations.
- `consultation_requests` stores only an adult contact name, email, relationship, optional bounded message, acknowledgement, inbox status, and timestamps. It has no anon/viewer RLS policy, including for insertion. Submission access is intentionally deferred to the later server API chunk.

RLS is enabled and forced on application tables. `private.is_editor()` is a security-definer policy helper with an empty search path; it consults `profiles`, never JWT user metadata. The public route can read published posts only. Editors can manage posts, categories, joins, and inquiries, while neither viewers nor editors can change role records through table CRUD.

## Editor provisioning

Create or invite an identity through the trusted operational auth flow, then run the following SQL from a trusted administrative database session as `postgres`, or a server-only SQL connection carrying the `service_role` claim:

```sql
CALL private.bootstrap_editor('AUTH_USER_UUID');
```

The procedure rejects other execution contexts, requires an existing profile, changes only its database role, and is not exposed as an RPC: `private` is absent from `api.schemas`, and execute is revoked from `PUBLIC`, `anon`, and `authenticated`. Do not promote users through `user_metadata`, client SQL, or an application-visible RPC. Normal auth profile creation remains `viewer`-only.

## Public covers

The `covers` Storage bucket is public by design, so uploaded cover bytes and paths are publicly readable even while their associated post is a draft. Do not upload private material or treat an unlinked cover as secret. Bucket configuration caps uploads at 5 MiB and accepts JPEG, PNG, and WebP MIME types; Storage RLS further restricts writes, updates, and deletes to editors in their own UUID folder and verifies extension, MIME metadata, and size. Use the Storage API for object operations; do not mutate `storage.objects` in application code.

## Atomic post/category writes

The database foundation does not add a generic or API-visible write RPC. The application-specific atomic post-and-category operation is deferred to Chunk 06, where its input and authorization contract can match the server service. It should remain a narrowly scoped invoker operation with RLS checks rather than a broad `SECURITY DEFINER` CRUD surface.

## Local workflow and tests

With Docker available, run `supabase start -x vector`, `supabase db reset`, then `pnpm db:test`. Reset applies migrations and the synthetic seed before running `supabase/tests/database_security.sql`. The pgTAP file creates only isolated test auth identities, uses rolled-back synthetic Storage rows to exercise RLS, and checks anonymous, viewer, and editor CRUD boundaries, constraints, profile provisioning, inquiry privacy, publication visibility, and Storage policy behavior. Those direct Storage-table writes are test-only; application uploads and deletes must use the Storage API. Seed data intentionally contains no auth users, passwords, real student outcomes, or customer inquiries.

The installed Supabase CLI 3.0.0 pg_prove helper requests a Docker security-option override that this sandbox does not permit. `pnpm db:test` uses the same SQL through the existing database container and the installed standard Perl `prove` TAP runner; it does not change the security policy. Repository setup starts Supabase with `-x vector`, applies pending migrations without resets, and creates local nonprivileged environment settings only when absent.
