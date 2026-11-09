# Product brief — Tactyqal Builder’s Studio

Approved working direction for implementation, 2026-11-09. This is an independent submission, not a commissioned production rebrand. Company claims and asset permissions remain governed by the [audit](../research/brand-ux-audit.md).

## Objective and positioning

Build a trustworthy mentoring-brand experience and a genuinely integrated editorial system. The homepage explains the eight-week program; Journal resources serve young builders and the wider entrepreneurship audience. The primary conversion is a **consultation request**, not a paid enrolment or a confirmed appointment.

Success means an evaluator can understand the offer, use it comfortably on mobile, and witness a real article move from a protected draft to the public blog and homepage. No published hiring rubric exists; priority choices are our product judgments, not guaranteed winning criteria.

## Audience journeys

| Audience | Journey | Questions resolved | Completion |
|---|---|---|---|
| Young builder | Hero → project → weekly journey → FAQ → contact | Can I build something? Must I code already? What happens each week? | A clearly explained next step; optional request submitted by adult contact |
| Parent/guardian | Hero → program format → evidence/provenance → practical details → contact | Who helps? What time is needed? What is included? What is and is not promised? | Valid consultation request; no false booking claim |
| Resource reader | Search/direct article → Journal → category/search → article | Is this useful and readable? Can I find the next relevant resource? | Finds and reads published content without an account |
| Editor/judge | Login → new draft → cover → save → preview → publish → verify → edit/unpublish/delete | Is it genuinely full-stack? Are unpublished records private? | Persisted and authorised lifecycle with accurate public updates |

## Scope and order

### Required for the challenge

- Responsive, accessible homepage redesign reflecting the actual business.
- Database-backed blog CRUD, documented APIs, schema/migrations and reproducible setup.
- Public blog listing/article pages to demonstrate the backend integration.
- A protected editor flow, including persistence and draft privacy.
- Live demo or video, plus complete GitHub source. We aim to provide both demo and video.

### Submission differentiators after the core works

- Source-attributed project stories and consistent public identity.
- Genuine consultation requests and a private inbox, with minimal data and anti-abuse controls.
- Synthetic WordPress import proof of concept with idempotency and URL-preservation documentation.
- Thoughtful loading/error/empty states, test evidence, and a clear technical handoff.

### Explicit exclusions

Student LMS, course progress, payments, account self-registration, public comments, AI chat, a general page builder, scheduled publishing, multi-tenancy, email-delivery claims without a configured provider, full production WordPress migration, and admin editing of every marketing sentence.

## Route and information architecture

| Destination | Content / source |
|---|---|
| `/` | Program, selected projects, mentoring, parent information, live Journal, FAQ |
| `/#program`, `/#faq` | Clear anchors, not duplicate pages |
| `/projects`, `/projects/[slug]` | Typed source-controlled stories with attribution or illustration labels |
| `/blog?q=&category=&page=` | Published content, bounded lists and shareable filter state |
| `/blog/[slug]` | Published article; same public navigation and visual system |
| `/contact` | Minimal real request flow, response explanation, privacy |
| `/privacy` | Accurate demo data handling, not copied enterprise boilerplate |
| `/login` | Invited editor login only |
| `/admin` and child routes | Editorial overview, posts, protected preview, private inquiry inbox |

## Information and operating rules

- Marketing/program content and projects are typed source-controlled content; posts/categories are database-managed.
- Public article listing/detail returns published records only. A public request for a draft behaves like a missing article, not an informative permission leak.
- Editors are created through an authorised operational process; no visitor can choose the role.
- Draft/published is sufficient. Publishing validates required fields; unpublishing removes public access.
- Covers are public media, even when attached to drafts; clearly disclose this in the upload UI.
- Preserve source slug/date/category fields in any import; publication requires human review.
- Demo articles, projects, and inquiry fixtures must be original/synthetic and labelled. Never seed invented student results.
- Consultation form: adult contact name, email, relationship (parent/guardian or adult participant), optional short message, and explicit data-use acknowledgement. No date of birth, school, phone, or child identity fields.
- Success: “Request received. This demo has not scheduled an appointment or sent an email.” Do not promise a real response from Tactyqal.
- A future authorised business deployment can use the observed scheduling service with a visible external fallback; do not send demo traffic into the real calendar.

## Quality gates

| Gate | Required proof when implemented |
|---|---|
| Product clarity | Above-fold offer, obvious CTA, useful program/project explanation |
| Responsive design | Browser inspection at 375, 390, 768, 1024, and 1440px; no content loss/overflow |
| Accessibility | Keyboard/focus/labels/error checks plus automated scan; no claim of certification |
| Persistence | Create/read/edit/publish/delete across refresh and distinct sessions |
| Authorisation | Direct unauthenticated/non-editor API and database attempts are denied |
| Content integration | Publish/edit/unpublish changes homepage, blog list, and detail correctly |
| Consultation | Request persists, private inbox works, public reads fail, abuse controls exercised |
| Reproducibility | Fresh database migration/seed, documented env, tests, clean build |
| Evidence | Actual deployed measurements, inspected screenshots, truthful recorded walkthrough |

Performance targets, not achieved results: minimise client JavaScript; optimise LCP media; aim for LCP ≤2.5s, CLS ≤0.1, INP ≤200ms under documented representative conditions. A lab run cannot establish field Core Web Vitals or guarantee every device’s performance. Targets are not a reason to remove necessary behavior or weaken tests.

## Content dependencies

Before genuine production use: confirm mentor identities, commercial details, eligibility, project/portrait permissions, calendar ownership, inquiry retention/deletion practice, and who will handle real requests. These do not block the isolated submission; use honest omissions and synthetic content. Supabase credentials are not required for Phase 1 and must never be supplied in chat or committed.
