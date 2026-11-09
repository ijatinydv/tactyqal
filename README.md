# Tactyqal — The Builder’s Studio

An independent hiring-challenge submission: a considered mentoring-brand redesign and an integrated, secure editorial platform.

**Current state:** Chunk 03 application foundation implemented. The local Supabase database foundation is implemented; invited-editor authentication is the next chunk; no working editorial CRUD or consultation submission is claimed.

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

## Preview the design study

Open `docs/design/boards/index.html` in a browser. Alternatively, run `python3 -m http.server 8000 --bind 127.0.0.1` from the repository root and visit `http://localhost:8000/docs/design/boards/`. Do not expose this root-directory server publicly. The study has no application dependencies or backend; its static controls are explicitly labelled as specimens. Google Fonts are optional presentation resources, with local fallbacks if unavailable.

## Technical direction

One Next.js App Router / TypeScript application, feature-based modules, Tailwind and selectively customised shadcn/ui, Supabase PostgreSQL/Auth/Storage, and Vercel deployment. Domain services are shared by server-rendered pages and documented Route Handlers. Database policies protect data independently of page navigation. Versions and package tooling are pinned in package.json and pnpm-lock.yaml.

## Content and evidence

The [audit](docs/research/brand-ux-audit.md) records public sources, observations, rights limitations, and decisions. Public-site screenshots are dated research evidence, not our implementation. Design-board projects/articles are synthetic and visibly labelled. Source attribution is not a licence to reuse student imagery. No private credentials or real inquiry records belong in Git.

## Verification at this phase

Browser inspection of the existing site, documented non-submitting interaction checks, design-board desktop/mobile inspection, documentation-link checks, and diff review. Application build, database, API, and authentication tests are not applicable until their implementation chunks.
