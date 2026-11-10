# Phase 4 verification scope

The homepage/project and consultation/inbox work are separate deliverables. Current implementation and final commands are recorded in the delivery status before publication.

## Required checks

- Homepage CTA remains visible on mobile; project concepts are visibly illustrative; every story and consultation link has a real destination.
- The public form accepts only minimal adult contact details, explicit data-use acknowledgement, and an optional bounded message. It must not claim a booked slot, sent email, or contact with the real Tactyqal business.
- Actual Supabase persistence, same-key retry deduplication, differing-payload conflict and durable rate limits are tested. Anonymous/viewer direct table reads and inbox APIs must not reveal contacts.
- Editors can view the private inbox, mark a request reviewed/closed and delete it. Privacy wording must reflect actual retention rather than invented automatic deletion.
- Existing article publishing, media security, authentication and public Journal tests remain intact.

## Safe demonstration policy

Use only synthetic `example.invalid` contact addresses and generated editor fixtures. Capture public pages or an empty inbox; do not publish logged-in credentials or contact data. A live Preview is the local demonstration environment, not a production business deployment. No marketing or calendar provider is configured in this phase.

## Confirmed results

The final integrated production build and managed Preview are healthy. `pnpm check` passes 17 unit/component tests plus lint and TypeScript; `pnpm db:test` passes 127 assertions; `pnpm test:e2e` passes all 18 browser tests; `pnpm test:integration` passes the real persisted blog HTTP flow with no skip. Public screenshots and mobile layouts were inspected. The form/API and private inbox tests use ephemeral identities and synthetic contacts, then delete their contact records. Technical rate events remain intentionally durable and contain only an email index and acceptance timestamp.

Database-only rate tests truncate event fixtures inside their own rolled-back transaction. This leaves live demo counters intact and prevents repeat test execution from depending on the number of earlier accepted demo requests. Anonymous row reads remain filtered by RLS, while direct insertion is revoked and the validated submission function is the only public write path.
