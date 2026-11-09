# Invited-editor authentication

## Configuration

The browser-safe Supabase connection uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Both settings are optional during build and local page rendering: if either is absent or invalid, the login and admin entry points render a configuration-required state. Never put a service-role or secret key in a `NEXT_PUBLIC_` variable.

## Session and authorization boundary

`src/lib/supabase/browser.ts` and `src/lib/supabase/server.ts` are the explicit browser and server entry points, respectively. The SSR clients use `@supabase/ssr` cookie storage. `src/proxy.ts` refreshes cookies for `/admin/:path*` and `/login`, carries refreshed cookies into the route request and response, and disables caching on those paths. Proxy refresh is not authorization: each protected page calls `requireEditor()`, which verifies the current user with `auth.getUser()` and reads the role from that user's database-owned `profiles` row on the request. A failed identity or role check fails closed.

The admin layout and each overview, posts, and inquiries page guard their own server render. Every server action that can affect an editor session must independently verify the current editor; the logout form submits a POST Server Action, which revalidates the editor and signs out only the local session. Future editorial actions must follow this same rule and rely on database RLS as an additional boundary.

## Invitation policy

There is no public signup, password recovery, user-metadata role check, role mutation, service-role client, or routine privileged database path. The login action validates email and password with Zod, retains only the email after failure, and returns a generic credential error. A successful authentication is followed by a fresh identity check and a database profile-role lookup. Non-editor accounts are signed out locally and denied access.

## Feature boundary and local operations

`src/features/auth/server.ts` owns the role guard and its typed editor-session contract; Supabase infrastructure remains in `src/lib/supabase`. Both clients use `src/types/database.generated.ts`. The proxy preserves the SDK's response-header argument as well as refreshed cookies. Admin responses are dynamic and private/no-store; no identity or role lookup is globally cached.

Use `pnpm editor:local` for a disposable, confirmed password-based local account. Its operational helper is explicitly local-only and keeps the privileged CLI credential in memory; the generated account password is saved only in ignored private workspace state. The test suite creates/removes distinct synthetic accounts, never relies on a checked-in password, and tests the actual Auth server. Neither helper belongs in a browser bundle or ordinary request path.

For hosted access, provision a confirmed password-based editor through a trusted administrator and grant the role via SQL. The UI is invitation-only in the sense of administrator-provisioned access; it does not yet implement email invitation acceptance or password-recovery callbacks. Do not send invitation emails into a nonexistent callback flow. Disable public signup on the hosted Supabase project as well as in the local config.

The role check is fresh per protected request, but Supabase access-token revocation is not immediate global session revocation. Time-box/inactivity limits are enforced when refresh occurs; access JWTs can outlive local logout until their expiry. Browser tests distinguish valid refresh from expired access plus revoked refresh. See [Supabase sessions](https://supabase.com/docs/guides/auth/sessions) and the [Chunk 05 evidence](../delivery/chunk-05.md).
