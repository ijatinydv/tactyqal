# Blog persistence and API

The blog API is a thin Route Handler adapter over `src/features/blog/server.ts` and `src/features/blog/service.server.ts`. All reads use Supabase row-level security. Public calls create a separate anonymous, cookie-free client with `cache: "no-store"`; editor calls create the request-scoped SSR client, call `auth.getUser()`, and verify `profiles.role = 'editor'` on every operation. API authorization returns JSON `401` or `403` responses and never invokes the navigation redirect helper. No service-role client is used.

## Browser contract

Successful responses use `{ "data": ... }`; failures use `{ "error": { "code": "...", "message": "...", "fields": {} } }`, with `fields` omitted when there are no field errors. Every response is `Cache-Control: no-store`.

| Route | Access | Result |
| --- | --- | --- |
| `GET /api/posts` | Public | `{ items, total, page, pageSize }` of `PostSummary` records |
| `GET /api/posts/:slug` | Public | Complete published `Post`, otherwise JSON `404` |
| `GET /api/categories` | Public | Published-post categories only |
| `GET /api/admin/posts` | Editor | Paginated summaries with optional status, category, and query filters |
| `GET /api/admin/posts/:id` | Editor | Complete post, including drafts |
| `POST /api/admin/posts` | Editor + same origin | Create draft or published post and category links |
| `PATCH /api/admin/posts/:id` | Editor + same origin | Merge a partial editor payload atomically |
| `DELETE /api/admin/posts/:id` | Editor + same origin | Delete post and cascading category links |
| `GET /api/admin/categories` | Editor | All editorial categories |


`Post` keeps the persisted snake_case fields (`author_id`, `cover_path`, `cover_alt`, timestamps, status, and categories). `PostSummary` omits `content` and adds computed `reading_time`. Editor mutations accept snake_case fields, a unique slug, at most ten distinct category UUIDs, and a bounded structured document. New posts default to `draft` when status is omitted. The only allowed nodes are paragraphs, level-two/three headings, bullet/ordered lists, list items, and text; the only marks are bold, italic, and HTTP(S) links. HTML, arbitrary node attributes, unsafe link protocols, oversized documents, and excessive nesting are rejected. Draft content can be empty; title and excerpt remain required. Publishing requires at least 80 characters of extracted body text.

List filters bound `pageSize` to 20 and `q` to 100 characters. Search escapes SQL wildcard characters so `%` and `_` are literal. Category filters accept one exact slug. Public archives return published, currently visible rows only and order by `published_at DESC, id DESC`; admin archives can filter `draft` or `published` and order by `updated_at DESC, id DESC`.

## Atomic writes and cache behavior

Migration `20261110000000_blog_api.sql` adds `cover_alt` and a narrow `public.blog_save_post` RPC. The function is `SECURITY INVOKER`, uses a fixed search path, checks the database-owned editor role, assigns new authors from `auth.uid()`, and relies on table grants and RLS for both post and category-link mutations. It commits the post and complete category replacement as one transaction. Creation defaults to draft in the API schema when the client omits status; a published timestamp is assigned by the database, preserved while remaining published, and cleared on unpublish. Duplicate slugs return `409`; invalid references and validation failures return `422`; missing records return `404`.

Mutation handlers require an `Origin` matching the externally addressed request host and protocol (including trusted hosting proxy headers) and reject absent or cross-origin values with JSON `403`. They invalidate `/`, `/blog`, `/sitemap.xml`, and affected article paths with `revalidatePath`; API responses and anonymous Supabase fetches are not cached so publish, edit, unpublish, and delete are immediately reflected.

## Verification

`src/features/blog/schemas.test.ts` covers rich document safety, bounds, draft/publish requirements, and partial patches. `supabase/tests/blog_api.sql` covers invoker privileges, editor RLS, actor attribution, atomic category writes, publication timestamps, and cover alternative text. `tests/integration/blog-api.test.ts` is an opt-in real HTTP suite; configure `BLOG_API_BASE_URL`, `BLOG_API_EDITOR_EMAIL`, `BLOG_API_EDITOR_PASSWORD`, and the standard public Supabase URL/key for a running local app and disposable editor. The suite is intentionally separate from the Vitest UI configuration.

Run `pnpm test:integration` to create and clean up an ephemeral local editor automatically; privileged fixture credentials stay only in the operational process. The same-origin helper accounts for Next.js internal listener URLs and hosting proxy headers. A deployment must trust and normalise forwarded headers at its ingress, not forward arbitrary client-supplied host overrides.
