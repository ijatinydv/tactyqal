# Consultation requests and private editorial inbox

## Delivered

- A responsive, accessible adult-contact form with visible labels, minimal bounded fields, explicit data-use acknowledgement, an optional message and a hidden honeypot. No age, school, phone, or child identity is requested.
- Real PostgreSQL persistence through a narrow validated anonymous submission function. Normal request handling contains no service-role key. Direct anonymous insertion has no grant; anonymous reads/updates/deletes see no rows under RLS.
- UUID request idempotency: identical retries return the same opaque receipt; differing details with the same key produce a conflict instead of overwriting contacts. The form holds the key across failures and prevents duplicate pending submissions.
- Durable, transactionally serialised limits of three accepted requests per email/hour and thirty globally/hour. Rate-limit metadata contains an MD5 email index and timestamp, not an IP address; this index is not represented as cryptographic anonymisation. Entries older than 24 hours are removed on subsequent accepted submissions.
- A private editor inbox with bounded pages, status filters, selected-request details, review/close transitions and confirmed permanent deletion. Every read and mutation verifies identity and the database-owned role; writes also require the same-origin boundary.
- Honest success/retention/privacy language. The demo stores requests but does not schedule appointments, send email, market to contacts, or contact the real Tactyqal business. Evaluation uses synthetic `example.invalid` details only.

## Verification

The integrated test evidence is recorded in [delivery status](status.md). Database tests exercise validation, anonymous/viewer privacy, direct-write denial, idempotency conflict, email/global limits and editor mutations. The real API/browser tests submit a request, check only a receipt is returned, retry without duplication, verify viewer denial, update status, delete the record and exercise throttling. The real form/inbox workflow and a separately mocked network/rate-limit recovery path preserve text and the original retry key.

The new relationship enum narrows previously unrestricted fixture values; existing database fixtures now use the allowed `parent_guardian` value. SQL tests inspect persisted records from a trusted test context, not from the anonymous context whose inability to read contacts is itself under test. Coverage is not weakened to make privacy checks pass.

## Operating boundaries

Request records stay until an editor deletes them or the disposable demo database is explicitly reset. There is no unimplemented automatic retention promise. Technical throttle events do not contain names, messages, receipt IDs or raw contact emails. Idempotency keys are stored on requests and disappear when those requests are deleted. The global throttle is deliberately conservative for this demo; a production launch needs a reviewed abuse/retention strategy rather than an unqualified scalability claim.

See [consultation architecture](../architecture/consultations.md) and the public `/privacy` page for the exact data and access model. Public request content is never logged or included in shareable screenshots.
