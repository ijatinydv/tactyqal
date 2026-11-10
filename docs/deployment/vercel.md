# Deploy the submission to Vercel + hosted Supabase

This runbook is for a **dedicated synthetic-data demo**, not the official Tactyqal service. Vercel hosts the application; Supabase hosts PostgreSQL, Auth, and Storage. The local Docker stack and `.env.local` are not deployed. A successful Vercel build does not prove database, editor, upload, or consultation functionality: complete the final smoke tests.

## 1. Prepare the repository and a hosted Supabase project

1. Merge the reviewed changes you intend to deploy, including this documentation if desired. Confirm the intended production branch is `main`.
2. Create a dedicated project at [Supabase](https://supabase.com/dashboard). Pick a suitable region and keep its database password in your password manager. Do not reuse a customer database.
3. From **Connect / API settings**, copy the project URL and **publishable key**. Use the hosted URL, not `localhost`/`127.0.0.1`. The legacy `anon` key also works; prefer the publishable key for a new project.
4. Keep secret/service-role keys, database passwords and Supabase access tokens out of chat, Git, screenshots, browser settings and Vercel's `NEXT_PUBLIC_*` variables. Normal app requests do **not** need a service-role key.

## 2. Apply the database migrations to that project

The repository was verified with **Supabase CLI 3.0.0**. These are commands to run yourself in a trusted local terminal; do not send login/database credentials to the agent. Use Supabase's official CLI installation instructions if it is not already installed. Do not mix commands from CLI v2 and v3 without checking `--help`: v3 defaults to the local database unless `--remote` is supplied.

From the repository root:

```bash
supabase login
supabase link --project-ref YOUR_HOSTED_PROJECT_REF
supabase db push --remote --dry-run
supabase db push --remote
```

Check that the linked project is the dedicated hosted demo before confirming the push. `YOUR_HOSTED_PROJECT_REF` is the project identifier, not its URL or a credential. Authenticate via the official CLI flow and answer any secure database-password prompt locally. Do not put passwords into checked-in command files or terminal screenshots.

**Do not run `pnpm db:reset` or remote reset commands to deploy.** `pnpm db:migrate` and `pnpm db:start` are local development commands; Vercel must not start Docker or Supabase. Normal Vercel builds should not run migrations or fixtures.

All versioned SQL migrations should be applied, including RLS, blog atomic writes, consultation limits, cover-policy compatibility and import provenance. PostgreSQL is the source of truth; do not recreate tables manually and skip policies.

### Seed a new demo, optionally

`supabase db push --remote` applies migrations, not the synthetic seed by default. For a **new, empty demo** you can deliberately run:

```bash
supabase db push --remote --include-seed
```

This includes `supabase/seed.sql`. Review it first. It inserts original synthetic categories/articles but no login credentials. It is not an idempotent production seeder: do not repeatedly apply it to an already populated project. Alternatively, leave the archive empty and create content through the editor after provisioning an account.

The WordPress import CLI intentionally refuses hosted destinations; it is a **local proof of concept**, not the hosted seeding/deployment path.

## 3. Create the hosted `covers` Storage bucket

The local bucket in `supabase/config.toml` does **not** create a hosted bucket through SQL migrations. In **Supabase → Storage → New bucket**, create:

| Setting | Value |
|---|---|
| ID/name | `covers` — exact spelling |
| Public | Enabled — editorial cover bytes are intentionally public |
| File size restriction | 5 MiB / 5,242,880 bytes |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |

If the creation dialog does not expose size/MIME restrictions, configure them in the bucket settings immediately afterward. Migrations already install the editor-folder and object-write policies: do not replace them with an “everyone can upload” policy. Cover images are public even when their post is a draft; do not upload confidential media.

**Vercel upload limitation:** the current app posts images through a Node function. Vercel's request/response payload limit is **4.5 MB**, lower than the app's local 5 MiB file limit. For this demo, use small covers (recommended **under 2 MB**) and state this to editors. A larger image can get `413 FUNCTION_PAYLOAD_TOO_LARGE` before the app validates it. The app is not currently using direct-to-Storage/signed browser uploads; do not claim that the full 5 MiB local upload allowance works on Vercel. Keep the bucket limit as defense in depth; do not try to raise the Vercel limit in this project.

## 4. Provision an editor and disable public signup

1. In **Supabase → Authentication → settings**, disable new public user signups. `enable_signup = false` in the local config does not configure your hosted Auth service.
2. In **Authentication → Users**, create a dedicated demo user with an email and strong password. Mark its email confirmed using the administrator creation controls. Use a synthetic/demo identity, not an unrelated person's email.
3. Copy that user's **UUID**. In the trusted **SQL Editor**, run:

```sql
CALL private.bootstrap_editor('REPLACE_WITH_AUTH_USER_UUID'::uuid);
```

4. Confirm `public.profiles` contains the user with role `editor`. Profiles otherwise default to `viewer`, regardless of editable user metadata.

The application supports **administrator-provisioned password sign-in**. It does not implement email-invitation acceptance or password-recovery callbacks. Do not rely on “Send invitation” or password-reset emails as the judge-access flow. Do not publish a shared administrator password in the README. Provide dedicated judge credentials privately and revoke/remove them when evaluation ends.

`pnpm editor:local` creates a local fixture only and refuses hosted services. It is not the hosted editor-setup command.

## 5. Import the GitHub repository into Vercel

1. Open **Vercel → Add New → Project → Import Git Repository**.
2. Select `ijatinydv/tactyqal` and grant the Vercel GitHub integration access if requested.
3. Use the repository root (`./`) as **Root Directory** and **Next.js** as **Framework Preset**.
4. Set or confirm:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Node.js version | **24.x** (matches the tested Node 24 environment and package engines) |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output directory | Leave the Next.js framework default; no custom static export directory |

The committed `packageManager` field and lockfile select pnpm 10.34.9. Do not configure `scripts/setup.sh`, `.hoplite/setup.sh`, `pnpm db:start`, or `scripts/preview.sh` as Vercel install/build/start commands. Those are local sandbox lifecycle commands; Vercel uses its Next.js adapter rather than running the managed Preview server.

## 6. Add the three Vercel environment variables

In **Vercel project → Settings → Environment Variables**, configure:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_PROJECT.vercel.app
```

Use the exact HTTPS site origin without an extra path. `NEXT_PUBLIC_SITE_URL` drives canonical metadata, Open Graph URLs, and sitemap generation. The public Supabase URL/key are intentionally browser-safe identifiers; permissions still depend on RLS. **Do not add `SUPABASE_SERVICE_ROLE_KEY` or a database password for the normal app.**

Select **Production** for the production demo. If you enable Preview deployments, either use a separate disposable Supabase project for them or deliberately understand that they share the production-demo data. Do not let unreviewed preview code operate against customer data. Configure an appropriate canonical origin per environment rather than assuming every preview has the production hostname.

If the Vercel domain is not known until the first deployment, deploy once to discover the assigned project domain, set `NEXT_PUBLIC_SITE_URL` to it, and **redeploy**. Environment changes apply to new deployments; the `NEXT_PUBLIC_*` values are used in the browser build. Redeploy again after changing the final domain or hosted Supabase values. Never copy the workspace's local `.env.local` into Vercel.

## 7. Set the hosted Auth URL

After the Vercel domain is assigned, set **Supabase → Authentication → URL Configuration → Site URL** to the same HTTPS origin. This app's current password flow does not need an email/OAuth callback route. Do not invent `/auth/callback` URLs or enable invitation/reset flows that have no implementation. Configure exact allowed redirects if those flows are added and tested later.

Keep Auth signup disabled, and keep the application URL/hosted public keys correct. Do not weaken RLS if a login has no editor access—check the protected profile role instead.

## 8. Smoke-test the hosted head before submitting

Use synthetic `example.invalid` contact data only:

- [ ] `/`, `/projects`, both project stories, `/blog`, article pages, `/contact`, and `/privacy` render on phone and desktop.
- [ ] `/sitemap.xml` returns valid hosted URLs, not localhost; imported/private drafts are absent.
- [ ] `/login` signs the dedicated editor in; an incognito visitor cannot open admin or saved preview pages.
- [ ] Create draft → refresh → preview → publish → verify public article and homepage → edit → unpublish → delete.
- [ ] Upload a genuine small raster cover (<2 MB), save alt text, and verify the public image loads. Test one fake image file is rejected.
- [ ] Submit one synthetic consultation request; success says no appointment/email was created. Confirm the editor inbox can update/delete it and a visitor cannot retrieve it.
- [ ] Repeated identical submission does not create duplicate requests. Avoid exhausting the deliberate 3/email/hour and 30/global/hour demo limits while testing.
- [ ] No secrets appear in browser assets, logs, screenshots or the repository.
- [ ] Judges can reach the public Vercel URL without account-level deployment protection. Give editor credentials through the submission platform's private channel, never a public README.

Public demo pages intentionally remain `noindex`. Do not remove this safeguard merely to make a search engine index a hiring prototype.

### Common failures

| Symptom | Check |
|---|---|
| “Authentication needs configuration” | Correct public URL/key in Vercel, then redeploy |
| Login works but access is denied | Confirm the email and run the trusted editor bootstrap for that exact UUID |
| Blog/API reports database unavailable | Verify all hosted migrations ran and the public URL/key address the same project |
| Image upload fails | Confirm `covers` exists, bucket restrictions/policies, editor role/folder and a file under 2 MB |
| Vercel 413 before app error | Hosted 4.5 MB function limit; resize/compress the cover before sending |
| Consultation 429 | Intentional database limits; wait for the hour window, do not disable protections |
| Sitemap error or localhost metadata | Set the final `NEXT_PUBLIC_SITE_URL` and redeploy |
| Empty Journal after successful deployment | Seed once on a fresh demo or publish original articles; migrations alone do not populate the feed |

## References

Consulted 2026-11-10; the instructions above also check the repository's installed Supabase CLI **3.0.0** help output.

- [Vercel: Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel: environment variables](https://vercel.com/docs/projects/environment-variables/managing-environment-variables)
- [Vercel: function limits](https://vercel.com/docs/functions/limitations)
- [Supabase: database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase: bucket creation](https://supabase.com/docs/guides/storage/buckets/creating-buckets)
- [Supabase: API keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase: Auth URL configuration](https://supabase.com/docs/guides/auth/redirect-urls)
