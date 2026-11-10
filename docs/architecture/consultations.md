# Consultations

## Public submission

`POST /api/consultations` is the only public consultation endpoint. It requires a same-origin request, accepts at most 16 KiB of JSON, and validates a trimmed adult contact name (120 characters), lowercased email (254), `parent_guardian` or `adult_participant`, optional message (1,500), affirmative data-use acknowledgement, UUID idempotency key, and an empty honeypot field. It returns `{ "data": { "receipt_id": "…" } }` and never returns or supports lookup of submitted details. A repeated matching key and payload returns the same receipt; reusing the key with a different payload returns a conflict.

The anonymous Supabase role has no direct inquiry row policy. Its only submission capability is `public.submit_consultation`, a fixed-search-path `SECURITY DEFINER` function that validates its own input, serializes attempts with a transaction advisory lock, and stores the inquiry atomically. It stores normalized email only in the private inquiry table. Durable throttle events retain only an MD5 email index and acceptance timestamp, enforce three accepted requests per email and thirty globally per hour, and expire after 24 hours. Existing editor-created rows using the legacy `guardian` label remain readable; new anonymous submissions accept only the two current relationship values. No raw IP address or service-role credential is used by normal application requests. Rate-limit responses use HTTP 429 and `Retry-After: 3600`.

## Editor inbox

`GET /api/admin/inquiries?status=&page=` returns `{ "data": { "items": [], "total": 0, "page": 1, "pageSize": 20 } }`. `PATCH /api/admin/inquiries/{id}` accepts only `{ "status": "new" | "reviewed" | "closed" }`; `DELETE` permanently removes a record for retention handling. Every operation verifies `auth.getUser()` and the database-owned editor profile role for that request. Writes require same-origin requests. The request-scoped authenticated client and RLS policies govern editor reads, updates, and deletion; there is no service-role path.

## Verification

`src/features/consultations/schemas.test.ts` covers public field normalization, bounds, acknowledgement, idempotency UUID, honeypot, and editor query/status schemas. `supabase/tests/consultations.sql` uses synthetic auth fixtures inside a rolled-back transaction to cover direct anonymous denial, RPC validation/idempotency/conflict/throttling, viewer denial, and editor status/deletion access. Run it through the repository's existing `pnpm db:test` workflow after the migration is applied; do not reset a shared database to verify this feature.
