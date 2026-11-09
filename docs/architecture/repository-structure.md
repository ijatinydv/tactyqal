# Repository structure and architecture

Status: decided for the initial submission, 2026-11-09. Changes require a recorded reason, not speculative scale. This is a target map: only documentation and design evidence exist in Phase 1. Create implementation directories when they acquire real files; do not populate an empty scaffold with placeholders.

## Decision: a feature-based modular monolith

Use one Next.js deployment and one Supabase project per environment. A single deployable is enough for the actual product, while explicit module boundaries keep content, identity, and inquiries independent. Do not introduce `apps/`, `packages/`, Turborepo, a separate Express service, queues, or generic repository frameworks. Extract a package/service only when a second consumer or measured workload requires it.

```text
tactyqal/
├── src/
│   ├── app/                         # routes, layouts, metadata, and thin HTTP adapters
│   │   ├── (public)/
│   │   │   ├── page.tsx             # /
│   │   │   ├── projects/[slug]/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── blog/[slug]/page.tsx
│   │   │   ├── blog/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── privacy/page.tsx
│   │   ├── (auth)/login/page.tsx
│   │   ├── (admin)/admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── posts/page.tsx
│   │   │   ├── posts/new/page.tsx
│   │   │   ├── posts/[id]/edit/page.tsx
│   │   │   ├── posts/[id]/preview/page.tsx
│   │   │   └── inquiries/page.tsx
│   │   ├── api/
│   │   │   ├── posts/route.ts
│   │   │   ├── posts/[slug]/route.ts
│   │   │   ├── admin/posts/route.ts
│   │   │   ├── admin/posts/[id]/route.ts
│   │   │   └── consultations/route.ts
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── features/
│   │   ├── blog/                    # posts, editor, categories, and publication lifecycle
│   │   │   ├── components/
│   │   │   ├── schemas.ts
│   │   │   ├── schemas.test.ts
│   │   │   ├── types.ts
│   │   │   ├── shared.ts            # explicit browser-safe exports only
│   │   │   ├── server.ts            # explicit server-only public entrypoint
│   │   │   ├── service.server.ts
│   │   │   └── repository.server.ts
│   │   ├── auth/                    # identity and editorial authorisation
│   │   ├── consultations/           # request submission and private inbox
│   │   ├── marketing/               # program/homepage presentation
│   │   └── projects/                # source-controlled project stories
│   ├── components/
│   │   ├── ui/                      # domain-neutral accessible primitives
│   │   └── layout/                  # shared public/admin chrome
│   ├── content/                     # typed program, project, and provenance data
│   ├── lib/
│   │   ├── supabase/                # separate browser, public, and request-scoped SSR clients
│   │   ├── env/                     # explicit public/server environment validation
│   │   └── http/                    # shared response/error contracts when reused
│   └── types/database.generated.ts  # generated from migrations, not maintained by hand
├── public/                         # licensed, optimised public assets only
├── supabase/
│   ├── config.toml
│   ├── migrations/                 # schema, constraints, RLS, storage policies, atomic RPCs
│   ├── tests/                      # database permission and integrity tests
│   └── seed.sql                    # synthetic local/test content; never passwords
├── tests/
│   ├── integration/                # persisted service/API checks against isolated Supabase
│   ├── e2e/                        # public and editor browser journeys
│   └── fixtures/                   # synthetic articles, upload files, WordPress fixtures
├── scripts/                        # specific import/setup tasks as they become necessary
├── docs/
│   ├── architecture/
│   ├── research/evidence/
│   ├── product/
│   ├── design/boards/
│   └── delivery/
├── .env.example                    # placeholders only; introduced with the application
├── package.json                    # one package manifest and lockfile, added in Chunk 03
└── README.md
```

`[slug]` is for public human-readable URLs; `[id]` is for stable internal editing. Route groups do not affect URLs. Route-specific loading/error files are added where useful, not copied into every directory. Auth callback/reset endpoints are added only for the chosen flow. `proxy.ts` versus `middleware.ts` is selected against the installed Next.js version in Chunk 03/05.

## Dependency boundaries

```text
app route/page → feature server entrypoint → domain service → feature repository → Supabase
app/client UI → feature shared types/schemas + domain-neutral UI
feature → lib infrastructure + components/ui + typed content where applicable
```

- `app/` handles routing, HTTP parsing, metadata, and composition; it does not hold SQL or core business rules.
- `features/` owns domain behavior. Keep small features small; the blog shape is a reference, not a requirement to create every layer everywhere.
- `shared.ts` exports only client-safe types, validation, and constants. Server modules import `server-only`; do not use mixed client/server barrels.
- Client components never import repositories or server environment configuration. Use client components only for interaction.
- Features cannot import another feature’s internal file. Use an explicit entrypoint; avoid circular dependencies.
- Shared UI must not know about posts, Supabase, or editorial roles. Promote a local component only when genuine reuse appears.
- Server pages call domain services directly. They do not call the app’s own HTTP API. APIs invoke the same services.
- Establish import/lint boundary checks in the foundation chunk using compatible existing tooling.

## Data and security decisions

1. **Database-owned identity:** `profiles` roles are protected by policies; do not trust editable user metadata. No public signup or client role elevation.
2. **Defense in depth:** authenticate/authorise server reads and writes and enforce RLS. A route group or proxy is not a permission boundary.
3. **No routine privileged client:** public reads use a non-privileged client; editorial operations use the editor session. Secret/service-role credentials are reserved for explicitly authorised operational work, not request handling.
4. **Atomic writes:** post/category updates requiring multiple table writes use a narrowly scoped database transaction/RPC. Prefer invoker rights; any definer function needs explicit grants, a fixed search path, and dedicated policy tests. Never expose a generic SQL RPC.
5. **Content:** constrained structured rich text, safe rendering, normalised unique slugs, draft/published states, and no arbitrary embeds. Publication includes title, body, excerpt, author, and valid cover reference if supplied.
6. **Media:** cover uploads are intentionally public editorial media; the editor must say so. Do not upload confidential draft media there. Private draft attachments are out of scope and would require a separate private bucket and authorised delivery.
7. **Inquiries:** store minimal adult contact information. No public select access; protect insertion behind server validation and durable abuse controls. If submission needs a narrow privileged mechanism, prefer a restricted RPC with no read permission over a broadly privileged client; design and test it in Chunk 10. No customer records in seeds or recordings.
8. **Demo separation:** synthetic fixtures and demo branding are explicit. Review access belongs to a dedicated demo environment, not a real business account.

## Scalability without unnecessary infrastructure

- Bound list sizes, add indexes matching publication/category queries, and avoid fetching full article bodies for cards.
- Keep personalised queries request-scoped; never cache sessions or admin pages globally.
- Cache only public published content. Mutations invalidate affected index/detail/homepage entries; include the previous slug when it changes. Set a documented fallback freshness interval and verify invalidation against the pinned Next.js version.
- Slug changes produce a documented redirect mapping when replacing existing URLs. Import does not silently change canonical URLs.
- Use optimised media with explicit dimensions. Add search indexes based on the chosen query strategy rather than adopting an external search service.
- Keep SQL migrations authoritative and regenerate database types. Use isolated local/test data; the initial hosted project is a dedicated demo, not production.
- Logs contain request identifiers and safe error categories, not tokens, article drafts, inquiry bodies, or email addresses.
- Defer revision history, scheduling, analytics dashboards, multi-tenancy, payments, and independent services.

## Verification ownership

Colocate pure unit tests with feature logic; put RLS/constraint tests in `supabase/tests`, API/persistence tests in `tests/integration`, and user journeys in `tests/e2e`. Mocked Supabase calls alone do not prove persistence or RLS. Every implementation chunk updates the delivery status with commands and outcomes. No Phase 1 document implies those tests have already run.

Reference: [Next.js project-structure conventions](https://nextjs.org/docs/app/getting-started/project-structure), consulted 2026-11-09.
