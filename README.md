# Tactyqal — The Builder’s Studio

An independent hiring-challenge submission: a considered mentoring-brand redesign and an integrated, secure editorial platform.

**Current state:** Phase 2 Chunks 03–05 implemented: responsive application foundation, real local Supabase schema/policies, and verified editor authentication/protected workspace. Blog CRUD, content editing, public feed, and inquiry submission are later chunks—not simulated here.

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

`pnpm test:e2e` runs both public-shell and real local Auth browser tests. The test helpers create temporary accounts and remove them afterwards. Use the isolated local stack, not a customer environment. Managed Preview builds and runs the production app; development HMR was unreliable in this sandbox, so production interaction checks are the evidence of working behavior.

## Preview the design study

Open `docs/design/boards/index.html` in a browser. Alternatively, run `python3 -m http.server 8000 --bind 127.0.0.1` from the repository root and visit `http://localhost:8000/docs/design/boards/`. Do not expose this root-directory server publicly. The study has no application dependencies or backend; its static controls are explicitly labelled as specimens. Google Fonts are optional presentation resources, with local fallbacks if unavailable.

## Technical direction

One Next.js App Router / TypeScript application, feature-based modules, Tailwind and selectively customised shadcn/ui, Supabase PostgreSQL/Auth/Storage, and Vercel deployment. Domain services are shared by server-rendered pages and documented Route Handlers. Database policies protect data independently of page navigation. Versions and package tooling are pinned in package.json and pnpm-lock.yaml.

## Content and evidence

The [audit](docs/research/brand-ux-audit.md) records public sources, observations, rights limitations, and decisions. Public-site screenshots are dated research evidence, not our implementation. Design-board projects/articles are synthetic and visibly labelled. Source attribution is not a licence to reuse student imagery. No private credentials or real inquiry records belong in Git.

## Verification at this phase

Browser inspection of the existing site, documented non-submitting interaction checks, design-board desktop/mobile inspection, documentation-link checks, and diff review. Phase 2 additionally passes lint/type/component/build checks, 78 database assertions, and seven real browser tests. CRUD APIs and publishing remain unimplemented until Chunk 06/07.
