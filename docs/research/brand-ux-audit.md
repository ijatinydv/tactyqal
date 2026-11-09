# Chunk 01 — Brand, content, and UX audit

Completed 2026-11-09 against public pages. Findings describe this observation date, not historical behavior or a complete understanding of internal operations. No analytics, source code, conversion data, private customer information, mentor interviews, or commercial terms were supplied.

## Method and sources

| ID | Source / method | What it supports |
|---|---|---|
| S1 | [Homepage](https://tactyqal.com/), text extraction and live Chromium | Program, audience language, curriculum, projects, offers, FAQ, CTA behavior |
| S2 | [Blog index](https://tactyqal.com/blog/), text extraction and live Chromium | Founder-oriented positioning, topics, navigation, public content structure |
| S3 | [About](https://tactyqal.com/blog/about-us/), text extraction and live Chromium | Broader startup mission and team description |
| B1 | Homepage at 1440 × 1000, screenshot and DOM inspection | Desktop hierarchy, navigation, page metadata |
| B2 | Homepage at 390 × 844, screenshot and DOM inspection | Mobile hero, menu click, CTA position |
| B3 | Blog at 1440 × 1000 and 390 × 844 | Distinct visual identity; mobile menu expanded state |
| B4 | Primary CTA click → `/#contact`; inspect embedded scheduler | Real consultation destination; no booking submitted |
| B5 | Click first FAQ and inspect trigger/answer markup | Pointer expansion works; trigger lacks native button semantics |

Public research captures, not our product:

- [Homepage desktop](evidence/2026-11-09-home-desktop.png)
- [Homepage mobile](evidence/2026-11-09-home-mobile.png)
- [Blog desktop](evidence/2026-11-09-blog-desktop.png)
- [Consultation destination](evidence/2026-11-09-consultation-desktop.png)

All captures use public pages without authentication. Their presence is research attribution, not a reusable asset licence. The large full-page captures and DOM scratch output remain ignored local artifacts, not submission assets. No forms were submitted, appointments booked, or accounts created.

## Business understanding

**Observed offer:** an eight-week, one-to-one mentoring program for teens that moves an idea through research, design, no-code full-stack development, and launch. The page presents approximately one live mentoring hour and about 2–3 total hours per week. It also promotes pitch preparation, Product Hunt launch, marketing, and ongoing support. These are stated offerings, not independently audited service commitments. [S1]

**Audience:** homepage language explicitly addresses parents (“Your Kid”, “Your Teen”) and beginner participants. The participant wants autonomy and a tangible project; the purchaser/influencer needs evidence, clear commitments, and trust. Those motivations are design hypotheses inferred from the offer, not user-interview findings. No numeric eligibility age range is established. [S1]

**Broader brand:** the blog headline is “Tactyqal – AI Coach for startup founders & CEOs.” About says “We help startups from ideation to fundraising” and describes former VCs, market researchers, entrepreneurs, and growth marketers. No named mentor roster is established on the inspected pages. [S2, S3]

**Conversion:** the homepage’s primary button navigates to `#contact`, where a Google Calendar appointment schedule offers a 15-minute call. The scheduling card rendered during inspection; we did not select a slot or prove booking completion. The visible calendar owner is not evidence of mentor qualifications. Earlier text-only research could not identify this destination; this browser audit resolves that gap. [B4]

**Commercial model, inferred:** paid mentoring is the main homepage offer; free resources and consultation are likely acquisition channels. The blog may serve discovery and education. Revenue mix, funnel attribution, conversion rates, and retention are unknown; do not present these hypotheses as company disclosures.

## Brand and content inventory

| Content | Observed | Submission treatment |
|---|---|---|
| Program duration / format | Eight weeks, 1:1, beginner/no-code positioning | Retain with attribution; confirm before a real business launch |
| Curriculum | Weeks 1–2 research; 3–4 design; 5–6 development; 7–8 launch | Make deliverables concrete; do not imply guaranteed app-store approval |
| Price | ₹25,000 struck through; ₹16,000 offer | Omit live price from initial redesign until confirmed current |
| Scarcity | “Only 15 spots available for the month” | Omit without dated availability evidence |
| Guarantee | “Results guaranteed or money back” | Omit until the precise terms are supplied |
| Admissions/revenue claims | University admissions, grants, media and revenue claims | No guaranteed admissions, income, or grants in redesigned copy |
| Student counts | 100+ mentored; 50+ successful | Different measures, not necessarily a contradiction; definitions and dates are missing. Omit unsupported proof strips |
| Testimonials | Six named quotations | Do not invent, rewrite as verified, or reuse portraits without permission |
| Mentors | General expertise language, no qualified roster | Do not manufacture people/credentials; retain an explicit content dependency |
| Projects | KrishiDrishti, Elenor Vegan Handbags, One Last Chapter, Paws of Promise, AudioNova, Converza | Source descriptions may be attributed; no unverified revenue claims or republished student media |
| Resources | Business ideas, problem solving, business models, team-building and pitching | Keep broad entrepreneurship coverage; add useful navigation rather than rewriting history |
| Free tools | Idea generator, assessments, pitch tools | Existing external tools are out of build scope; include only verified links, not imitation tools |
| Contact | Public email, phone, business-hours and response-time claims | Treat real contacts as reference, not the destination for synthetic demo submissions |

## Prioritised UX findings

“Priority” describes redesign importance, not a measured severity score.

| Finding / evidence | Priority | Decision / acceptance condition |
|---|---|---|
| Homepage mentoring identity and blog founder/AI-coach identity differ; visual systems also differ substantially [S1–3, B1, B3] | High | One public shell and typography system; distinguish the program offer from the wider Journal |
| At 390 × 844, primary hero CTA starts around y=906px, below the first viewport; long title, benefits and claims precede it [B2] | High | Shorter headline/support, CTA before proof/project imagery; verify at 390 × 844 and 375 × 812 |
| Desktop homepage has nine navigation items; Blog points to its homepage section rather than directly to the blog [B1] | Medium | Four useful public destinations plus one primary CTA; Journal links directly to `/blog` |
| Homepage DOM returned an empty document title, no meta description, zero h1, and zero main landmarks in the inspected page [B1] | High | One clear h1, main/skip navigation, meaningful title and description on each public page |
| First FAQ question is a `.faq-q` div with no button role or tabindex; clicking reveals its answer [B5] | High | Native button trigger, expanded state, panel association, keyboard operation |
| Mobile menu opens by pointer; trigger is a focusable div without button role or aria-expanded [B2] | High | Native button, expanded state, focus handling, Escape/close, and keyboard tests |
| Consultation CTA does lead to an embedded scheduling card [B4] | Preserve | Do not call the current flow broken. For the independent demo use a genuine request flow; integrate business calendar only when authorised |
| Projects rely on image galleries with generic “Screenshot 1” alt text [B1 DOM] | Medium | One meaningful project preview, descriptive alternatives, readable story; no carousel dependency |
| Blog cards display topics and dates and have public pagination [B3] | Preserve/improve | Keep discoverability; add URL-based search/filtering and clear paging in the new backend |
| Homepage includes many simultaneous outcome promises and repeated CTAs [B1] | Medium | One offer and one primary action; distinguish verified facts from optional potential outcomes |

Positive checks: neither homepage at 390/1440 nor sampled blog at 390 had document-level horizontal overflow. Homepage project/blog images sampled in the DOM loaded. Mobile menus responded to pointer input. These checks are narrow; they do not establish complete responsiveness or accessibility.

## Recommended brand synthesis

**Working promise:** personalised guidance from an idea to something real.

**Primary offer:** a structured mentoring journey for young builders, not guaranteed fame, college admission, revenue, or mastery in eight weeks.

**Tone:** encouraging, specific, calm, and candid. Address the builder directly, then answer practical parent questions. Explain what participants do, not just what they might win.

**Information sequence:** understand the offer → see a project → understand the process → resolve practical doubts → request a conversation. Resources remain useful to wider founders under the same brand.

## Asset and claim ledger

| Item | Evidence / rights state | Safe fallback |
|---|---|---|
| Brand name | Public identity [S1–3]; submission is unaffiliated | Plain typographic wordmark; independent-redesign disclosure |
| Original script logo | Visible on blog; reusable source licence not supplied | Do not copy the logo asset into production files |
| Student screenshots/portraits | Publicly visible; permission not supplied | Original, visibly illustrative project diagrams; no invented student attribution |
| Project descriptions | Source-attributed site claims [S1] | Short paraphrase with source link and provenance flag |
| Articles | Public titles/content do not imply republication rights | Original synthetic demo articles and a synthetic import fixture |
| Pricing/refund/availability | Seen on site, currency uncertain | Explain the program and invite a consultation; no fabricated price |
| Mentor biographies | Not supplied | Omit mentor cards pending verified biographies and permission |
| Calendar integration | Public embed observed; ownership/access not authorised | Store demo consultation requests in isolated Supabase; label no booking confirmed |

## Open questions and non-blocking defaults

1. Current pricing, refund terms, age eligibility, mentor roster, asset permission, and calendar ownership need confirmation before a real-brand launch. Proceed with omission/attribution/illustration defaults above.
2. No internal analytics or user interviews: all funnel improvement claims remain hypotheses until measured.
3. No existing CodeIgniter/WordPress source code: propose coexistence and an import proof of concept, not a completed replacement or production migration.
4. No performance benchmark or formal WCAG audit was run on the existing site. Do not invent Lighthouse scores or promise a percentage conversion lift.

## Chunk 01 exit

Source-backed audit, two audience journeys, content inventory, ranked recommendations, and explicit asset/claim limitations are complete. The accompanying [product brief](../product/product-brief.md) fixes scope and business outcomes. Proceed to Chunk 02 using these decisions, not an unrelated template.
