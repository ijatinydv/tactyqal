# Chunk 05 — Invited-editor authentication and protected workspace

## Delivered

- Lockfile-pinned Supabase SSR integration with separate typed browser and request-scoped server clients.
- Browser-safe configuration validation with a configuration-required screen instead of a build crash when settings are absent.
- Next.js Proxy refreshes cookies for login/admin requests and propagates both cookie and response-cache headers. Protected routes are private/no-store with Expires and Pragma safeguards.
- `src/features/auth/server.ts` verifies identity through `getUser()` and reads the database-owned role on every protected request. Layout and individual pages guard themselves; proxy navigation is not authorisation.
- Real server-action login, Zod validation, generic credential failures, email preservation, password clearing, pending state, and viewer rejection even if mutable user metadata claims editor access.
- Guarded POST logout and honest protected overview/posts/inquiry shells. No fake counts, editor CRUD, or inquiry inbox data is claimed before the corresponding chunks.
- Local-only editor provisioning with generated credentials stored in ignored mode-0600 workspace state. Normal application requests use no service-role/secret key.

## Verified

- `pnpm check`: lint, strict type checking, and two primitive component tests pass.
- `pnpm build`: public pages, dynamic login/admin routes and Proxy compile successfully.
- Seven production-mode Playwright browser tests pass: unauthenticated protection; invalid credentials and viewer denial; editor sign-in, refresh and logout; genuine access-token expiry with a valid refresh; expiry with a revoked refresh; public navigation; mobile menu/FAQ keyboard behavior.
- Refresh checks assert actual response Set-Cookie and private/no-store/Pragma/Expires headers, then reload the protected page successfully.
- Expiry fixtures are restricted to local Supabase. They first prove a locally signed nonexpired control token is accepted, then prove the corresponding expired token is rejected specifically for expiry. They replace only the isolated browser's test cookies and exercise both valid and revoked refresh paths. They never expose the local JWT signing secret to application configuration or logs.
- `pnpm db:test`: all 78 database permission/integrity assertions still pass.
- Actual managed-browser login and POST logout completed with the disposable local editor. Desktop/mobile login and mobile admin screenshots were inspected; admin has no page-level overflow at 390px.
- Independent read-only security review identified whitespace-only database fields; Chunk 04 closes the gap with a migration and five regression checks. No material auth privilege/cookie/cache issue was reported in that review; this is not a security certification.

The managed Preview deliberately uses the production build because this sandbox's dev HMR connection did not hydrate reliably. Production interaction tests pass; the precise dev/HMR infrastructure cause is unconfirmed. See Chunk 03 for the workaround.

## Local access and operating boundaries

```sh
pnpm editor:local
```

The helper creates a confirmed synthetic editor only against the repository's running local stack and calls the trusted database bootstrap procedure. It stores credentials in ignored `.hoplite/runtime/local-editor.json`, never prints the password, and reuses an existing live fixture. After a deliberate database reset it refuses to silently replace a stale file; remove the stale file explicitly before provisioning again.

For a hosted demo, create a confirmed password-based account through the authorised Supabase administrator workflow and promote its profile through trusted SQL. Do not publish credentials in README or chat. Email invitation acceptance, password recovery, and public signup are not implemented. Configure the hosted project's signup settings explicitly; this repository disables local signup in `supabase/config.toml`.

Supabase session time-box/inactivity policies are evaluated on refresh, not immediately at their deadline. Already-issued access tokens may remain valid until JWT expiry; do not interpret the browser logout test as immediate global JWT revocation. The tested guarantees are cookie removal/local sign-out, protected-route rejection without a valid session, safe refresh, and rejection when expiry cannot be refreshed. Reference: [Supabase session semantics](https://supabase.com/docs/guides/auth/sessions).

## Next

Chunk 06 adds shared editorial services and persisted CRUD APIs. Chunk 07 connects the actual content editor. Chunk 08 connects the public Journal. The current protected posts/inquiries pages intentionally describe pending functionality instead of presenting fake working controls.
