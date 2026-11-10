# Tactyqal — The Builder’s Studio

An independent hiring-challenge submission: a considered mentoring-brand redesign and an integrated, secure editorial platform.

**Current state:** Phases 1–4 are implemented: a completed mentoring homepage, transparent illustrative project stories, database-backed blog publishing, and a real consultation-request/private-inbox workflow. This remains an independent demo, not the official Tactyqal business service; it does not book appointments or send email.

## Read in order

1. [Repository structure and architecture](docs/architecture/repository-structure.md)
2. [Chunk 01: evidence-based brand and UX audit](docs/research/brand-ux-audit.md)
3. [Product brief, journeys, and scope](docs/product/product-brief.md)
4. [Chunk 02: design specification](docs/design/design-specification.md)
5. [Screen acceptance checklist](docs/design/screen-acceptance.md)
6. [Visual design board](docs/design/boards/index.html)
7. [Delivery status and remaining decisions](docs/delivery/status.md)

## Run the application

Use Node 22–24 and pnpm 10.34.9. Run `pnpm install --frozen-lockfile`, then `pnpm dev`. Validate with `pnpm check`, `pnpm build`, and `pnpm test:e2e`. See [Chunk 03 verification and version decisions](docs/delivery/chunk-03.md). The `/design-system` reference is available only in development.

## Local Supabase

The repository requires a Docker daemon and Supabase CLI 3.0.0. Run `pnpm db:start`, `pnpm env:local`, and `pnpm db:test`; normal managed setup handles startup and pending migrations idempotently. Do not run `pnpm db:reset` unless you intend to erase the disposable local data. See [Chunk 04](docs/delivery/chunk-04.md) and [database architecture](docs/architecture/database.md). Keep hosted credentials out of chat and Git; the local helper writes only an ignored URL/publishable key.

## Editor access and verification

Run `pnpm editor:local` to create a disposable confirmed local editor. The helper stores generated credentials in ignored `.hoplite/runtime/local-editor.json` and never prints the password. Never publish that file. See [authentication boundaries](docs/architecture/authentication.md) and [Chunk 05 evidence](docs/delivery/chunk-05.md).

`pnpm test:e2e` runs public, real Auth, API-access, media, and end-to-end publishing browser tests. `pnpm test:integration` creates an isolated local editor for the persisted HTTP CRUD suite. The test helpers create temporary accounts and remove them afterwards. Use the isolated local stack, not a customer environment. Managed Preview builds and runs the production app; development HMR was unreliable in this sandbox, so production interaction checks are the evidence of working behavior.

## Editorial workflow

Sign in → Posts → New post → add title/slug/excerpt and article blocks → select categories → optionally upload a cover and provide alt text → Save draft → Preview saved version → Publish. Published articles appear on `/blog` and the homepage. Saving published changes updates the public article; unpublishing and deleting remove public access. Draft preview requires editor authentication.

Uploads are decoded and re-encoded to WebP before storage; covers are intentionally public even when an article is a draft. The server enforces authorisation and RLS independently of the UI. See [API contract](docs/architecture/blog-api.md), [editor/media](docs/delivery/chunk-07.md), and [public Journal](docs/delivery/chunk-08.md). The block editor preserves untouched formatting and explicitly warns before flattening an edited formatted block; it is not a general HTML editor.

## Consultation demo

`/contact` accepts synthetic adult contact details, relationship, optional message and an explicit data-use acknowledgement. A successful submit returns an opaque receipt—not a booking or email. An invited editor can review, change status, and delete requests at `/admin/inquiries`. Public visitors and viewer accounts cannot read the inbox.

The database atomically enforces identical-request retries, three accepted requests per email/hour and thirty globally/hour. A narrow validated anonymous function performs submission; no service-role key is used by normal request handling. Use `example.invalid` contacts only. Records remain until editor deletion or an explicit demo reset; this is not a production retention commitment. See [consultation architecture](docs/architecture/consultations.md), [workflow evidence](docs/delivery/chunk-10.md), and `/privacy`.

## Preview the design study

Open `docs/design/boards/index.html` in a browser. Alternatively, run `python3 -m http.server 8000 --bind 127.0.0.1` from the repository root and visit `http://localhost:8000/docs/design/boards/`. Do not expose this root-directory server publicly. The study has no application dependencies or backend; its static controls are explicitly labelled as specimens. Google Fonts are optional presentation resources, with local fallbacks if unavailable.

## Technical direction

One Next.js App Router / TypeScript application, feature-based modules, Tailwind and selectively customised shadcn/ui, Supabase PostgreSQL/Auth/Storage, and Vercel deployment. Domain services are shared by server-rendered pages and documented Route Handlers. Database policies protect data independently of page navigation. Versions and package tooling are pinned in package.json and pnpm-lock.yaml.

## Content and evidence

The [audit](docs/research/brand-ux-audit.md) records public sources, observations, rights limitations, and decisions. Public-site screenshots are dated research evidence, not our implementation. Design-board projects/articles are synthetic and visibly labelled. Source attribution is not a licence to reuse student imagery. No private credentials or real inquiry records belong in Git.

## Verification at this phase

Browser inspection of the existing site, documented non-submitting interaction checks, design-board desktop/mobile inspection, documentation-link checks, and diff review. Phase 4 verification includes lint/type/build checks, 17 unit/component tests, 127 database assertions, persisted HTTP CRUD, and 18 real browser tests. See [current delivery status](docs/delivery/status.md) for exact results and limits.
