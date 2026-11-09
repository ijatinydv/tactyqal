# Chunk 02 — The Builder’s Studio design specification

Status: finalised working direction, 2026-11-09. Based on [Chunk 01](../research/brand-ux-audit.md) and the [product brief](../product/product-brief.md), not a generic SaaS reference. Finalised means implementation has a concrete contract; it does not imply user testing or that the application exists.

[Open visual boards](boards/index.html) · [Screen acceptance checklist](screen-acceptance.md) · [Desktop study](evidence/2026-11-09-home-desktop.png) · [Mobile study](evidence/2026-11-09-home-mobile.png)

## 1. Design thesis

A mentoring studio for people making their first real thing. Be optimistic without being childish, credible without looking corporate, and editorial without sacrificing obvious actions. Parent reassurance is carried by specific commitments and transparent claims, not university logos or an inflated proof strip.

**Visual signature:** warm paper, ink typography, forest-green interaction, thin rules, a project-first composition, and a numbered four-stage learning journey. The system should feel equally appropriate for a mentoring homepage, a readable business article, and a focused editorial workspace.

**Do not use:** gradient heroes, glowing orbs, glass panels, decorative AI stars, fake SaaS dashboards, oversized pill controls, generic bento mosaics, animated counters, unlicensed student imagery, fake awards, scroll hijacking, or autoplay galleries. AI may be a tool used by builders; it is not the visual identity.

## 2. Tokens and visual hierarchy

| Token | Value / role |
|---|---|
| `canvas` | `#F7F5EF`, warm ivory page |
| `surface` | `#FFFFFF`, forms and editorial workspace |
| `surface-muted` | `#E9EEE8`, project/planning background |
| `ink` | `#202620`, headings and body |
| `ink-muted` | `#596257`, secondary text |
| `brand` | `#245544`, primary actions and active links |
| `brand-hover` | `#1B4235`, hover/pressed primary action |
| `border` | `#DEDCD3`, nonessential separators only |
| `control-border` | `#778273`, essential input boundaries |
| `accent` | `#C39A50`, decorative rule/marker only; not small text on ivory |
| `danger` | `#A32B24`, validation/destructive text with explicit wording |
| `focus` | `#245544`, 2px ring plus 3px contrasting offset |
| `font-heading` | Newsreader, normal 400/500; fallback Georgia, serif |
| `font-body` | Manrope, 400/500/600/700; fallback system sans-serif |
| `radius-control` | 8px |
| `radius-panel` | 12px, never a giant pill |
| `spacing` | 4, 8, 12, 16, 24, 32, 48, 64, 80, 112px |
| `shadow` | Normally none; one subtle overlay shadow only where elevation matters |

Colour tokens have specific pairings. Do not use the light separator as the only input outline or use ochre as small text. Check real implementation contrast and disabled/error/focus combinations; passing one token pair does not prove accessibility.

Typography: desktop hero 64–76px / 1.04, mobile 42–46px / 1.06; section title 40–48px desktop and 32–36px mobile; body 17–18px / 1.65; UI 14–16px / 1.45; metadata at least 13px. Article body 19px / 1.8 desktop, 17–18px on mobile. Headlines use restrained negative tracking, body does not. Eyebrows are small sentence case or short uppercase labels, never whole paragraphs in capitals.

Use only necessary font weights. In the application bundle/self-host fonts with framework tooling, rather than relying on a blocking remote CSS import. The static phase-one board may request Google Fonts with fallbacks; it is not a performance reference.

## 3. Layout and responsive rules

- Public content max width 1200px, page gutters 24px on small screens and 48–64px on large screens. At 375px use at least 20px gutters.
- Header approximately 76px desktop / 64px mobile; a discreet independent-demo notice must not become a second oversized hero.
- At ≥1024px: hero text/project split about 55/45, three Journal cards, two substantial project stories, four journey columns.
- At 768–1023px: simplify header, keep two-column sections where legible, journal two columns, journey two-by-two.
- At <768px: one column, copy and CTA before project image, project stories stack, journey becomes an ordered vertical sequence. Do not put text into horizontally scrolling cards.
- Navigation collapses when labels no longer fit, not merely at an arbitrary device name. Primary mobile header shows wordmark and a labelled menu button; primary CTA remains available in the menu and in the hero.
- At 375 × 812 and 390 × 844, the homepage primary CTA must be visible before the illustrative project, without scrolling past a proof strip. Browser text enlargement must not clip content.
- Article text max 68–72 characters per line; no justified paragraphs. Images preserve dimensions, code/long links wrap or scroll within the article, not the whole page.
- Admin uses a 224px side navigation on wide screens, a compact top navigation on smaller screens, and a stacked editor/sidebar. Lists become labelled cards rather than unusable full-width tables on phones.
- Sticky controls must not cover focused inputs, action feedback, footer links, or the mobile keyboard. No mobile fixed bottom CTA in the initial release.

## 4. Public navigation and voice

Wordmark: a simple text treatment of **tactyqal** with a restrained “Labs” descriptor. Do not copy the blog’s script logo asset without permission or invent a new mascot.

Navigation: **Program** (`/#program`), **Projects** (`/projects`), **Journal** (`/blog`), **FAQ** (`/#faq`), then primary action **Request a consultation** (`/contact`). Journal is the user-facing label; `/blog` preserves a familiar content URL.

Tone: address the builder directly, use plain verbs, and explain the next step. Avoid “revolutionise”, “unlock your potential”, “impact millions”, guaranteed admissions, or unqualified “results guaranteed”. A real consultation-request flow justifies “request”; “book” is reserved for a working appointment integration with actual booking semantics.

Footer: short brand statement, program/projects/Journal/contact, privacy, editor login, and “Independent redesign prototype. Not an official Tactyqal service.” Do not imply synthetic requests reach the business.

## 5. Homepage content and section contract

### Hero

Eyebrow: **Personalised mentoring for young builders**

Headline: **An idea is a good start. Build what comes next.**

Supporting copy: **Turn your idea into a working app through eight weeks of one-to-one mentoring—from understanding the problem to sharing your first launch.**

Primary: **Request a free consultation** → `/contact`

Secondary: **Explore the projects** → `/projects`

Supporting facts: **Eight weeks · One-to-one guidance · Beginner-friendly**. These are format facts, not a fake proof strip.

Project treatment: an original, understated product preview on pale sage, with a title, one-sentence problem, and an “Idea → Prototype → Launch” annotation. Until permission arrives, show **Illustrative project — not a student outcome** next to the project, not hidden in the footer. No implied live user count or revenue.

### Projects — “Small beginnings. Real possibilities.”

Two considered project stories, each with a strong preview, problem, approach, and learning outcome. No carousel required. Real source-attributed stories may use short paraphrases from the existing site, but must distinguish reported claims from independently verified results. Design-board examples are original illustrations: **Neighbourhood Library** (sharing local books) and **Market Day** (testing demand for handmade products). They are not Tactyqal student achievements.

### Program — “A little structure. A lot of making.”

Four numbered stages; communicate proposed activity/deliverable, not guaranteed business success:

1. **Find the problem** / Weeks 01–02. Explore ideas, speak to potential users, and choose a focused problem. Deliverable: a clear problem statement.
2. **Make it tangible** / Weeks 03–04. Sketch the experience and test a simple prototype. Deliverable: a clickable prototype.
3. **Build the first version** / Weeks 05–06. Connect the core screens and data using appropriate no-code tools. Deliverable: a working first version.
4. **Share and learn** / Weeks 07–08. Prepare a launch, tell the story, and gather feedback. Deliverable: a launch plan and next steps.

These deliverables interpret the public curriculum; they are submission copy, not newly confirmed contractual promises.

### Mentoring / parent information — “Guidance, not a group lecture.”

Explain the published one-to-one format and beginner-friendly approach. State the site’s approximate 2–3 hour weekly commitment as indicative, subject to confirmation. Clarify that a portfolio project is not an admissions or revenue guarantee. Do not invent ongoing availability or call an unnamed mentor “world-class”. If mentor bios become available, use a real portrait, role, and concise relevant experience—otherwise omit the card.

Commercial copy: **Discuss the program, current fees, and whether it is a good fit.** No crossed-out price or scarcity badge until confirmed. Avoid a blank pricing card that looks unfinished.

### Journal — “Notes for the next step.”

Three latest published posts from the database, each with category, title, excerpt, publication date and calculated reading time. Link to `/blog`. If no posts exist, show a small honest empty state and keep the page coherent; do not use hardcoded published-looking content to disguise a failed query. A data error is not an empty result.

### FAQ

- **Do I need coding experience?** The current program is described as beginner-friendly and uses no-code tools. We will discuss the right approach for your idea.
- **What could I build?** Start with a focused problem: a simple service, tool, learning experience, or community product. Scope matters more than feature count.
- **How much time should I allow?** The current website describes about 2–3 hours weekly, including a one-hour mentoring session. Confirm the arrangement before joining.
- **Does this guarantee admissions or revenue?** No. A project can demonstrate initiative, but admissions, grants, publicity, and commercial results are not guaranteed.
- **How do I learn about fees and availability?** Request a conversation to confirm current details. The independent demo does not take payments or reserve a place.

Use accessible disclosure triggers, visible expanded state, and no hidden critical fee/refund terms.

### Final invitation

**Have an idea? Start with a conversation.**

**Talk through what you want to build, what support you need, and whether the program fits.**

Action: **Request a free consultation**. The demo notice stays explicit.

## 6. Screen-level designs

### Projects index and detail

Index introduces the difference between source-attributed and illustrative stories. Two-column rows on desktop, one column on mobile. Detail order: provenance label → project title/problem → accessible preview → approach → proposed/verified outcome as appropriate → source/rights note → consultation link. Do not add numeric success badges to compensate for missing proof.

### Journal listing

Header: **Ideas, tested in the real world.** Supporting line explains entrepreneurship and building resources. Show a labelled search input, category controls and selected state, then results count and cards. Search/category/page are reflected in the URL. Filter submission is usable without guessing that a small icon is the only action. Changing search/category resets page. Empty state offers clear filters; errors offer retry without losing the query. No search-count claim before data arrives.

### Article

Shared public header → breadcrumb → category/date/reading time → editorial title → excerpt → author (real attribution or explicit demo author) → optional cover → readable body → related published posts → restrained mentoring CTA. A table of contents appears only for articles long enough to benefit, with correct heading anchors. Draft preview is protected, noindexed, uncached, clearly labelled, and visually close to the published article. Copying a preview URL does not grant another user access.

### Contact request

Headline: **Let’s talk about what you want to build.** Explain this is a request, not a booked slot. Desktop has context beside the form; mobile context is concise and form is one column. Fields: adult contact name, email, relationship, optional message, privacy acknowledgement. Labels remain visible; required/optional is explicit. No marketing opt-in bundled into consent. Submit: **Send consultation request**. Pending: **Sending request…**. Success: **Request received. This demo has not scheduled an appointment or sent an email.** Include a reference only if generated and safe; never show other requests. Provide truthful retention/contact information for the deployed demo before accepting real data.

### Editor login

Focused single-column form, brand link home, invited-editor explanation, visible email/password labels, password reveal if accessible, generic invalid-credential feedback, loading and session-expired states. No public signup or hardcoded password in the interface/repository. Password recovery appears only if configured and tested.

### Dashboard and posts

Quiet white workspace using the same body font, forest actions, and thin rules. Navigation: Overview, Posts, Inquiries, View site. Overview uses actual counts or helpful empty states, not fabricated activity charts. Posts supports search/status, title/status/updated columns, and a clear “New article” action. Status uses a word, not colour alone. Deletion is not a tiny unlabeled trash icon.

### Post editor and preview

Main column: title, slug, excerpt, constrained rich-text toolbar/body. Secondary column: status, categories, public-cover upload and alt text, save/preview/publish actions. On mobile, actions and status stay discoverable without covering content. Explicit save initially; no fake “Autosaved” badge. Unsaved changes warning; persisted confirmation only after success. Save draft → **Draft saved**; publish → **Article published** with public-link action; failure preserves input. Invalid slug shows the issue next to the field. Delete dialog names the article and describes permanence. Unpublish explains loss of public visibility. Empty draft can be saved with minimal valid identity; publishing enforces stricter content rules defined in schemas.

### Inquiry inbox

Authorised editor only. List shows minimal request identity/date/status; detail reveals the adult-provided message. No student profiling, public detail route, fake email reply button, or dashboard exposing contact data in screenshots. Demo walkthrough uses synthetic records only.

## 7. Shared component/state contract

| Component | Required variants / states |
|---|---|
| Button / link | Primary, secondary, text, destructive; hover, focus, pending; distinguish navigation from action |
| Input / textarea / select | Label, help, required/optional, invalid and linked error, disabled/read-only |
| Menu | Closed/open, current destination, focus return, Escape, keyboard operation |
| Disclosure | Native button, aria-expanded/controls, visible focus, readable panel |
| Post/project card | Whole-card hierarchy without nested conflicting links; image alt or decorative choice |
| Alert / status | Success, error, warning, informational; text/icon, appropriate live announcement |
| Empty / error state | Distinguish no records, filtered no matches, network failure, forbidden, and not found |
| Modal | Named dialog, focus trap/return, safe default action, Escape policy, destructive confirmation |
| Upload | Idle, validation, uploading, failure/retry, complete, replace/remove, public-media disclosure |
| Pagination | Current page, previous/next, disabled boundaries, stable URLs |
| Loading | Stable geometry, visible progress, reduced-motion respect; no indefinite fake skeleton |

## 8. Accessibility and motion

Target WCAG 2.2 AA practices without claiming certification. At least 4.5:1 normal text contrast, 3:1 large text and essential UI boundaries; visible focus against adjacent surfaces. Aim for 44px interactive targets except inline prose links. Use landmarks, skip link, one meaningful h1, hierarchical headings, proper input autocomplete, and linked error summaries. Never convey status by colour only. Respect 200% text zoom, reflow, reduced motion and keyboard-only use. Validate with browser checks and automated tools during implementation; these are requirements, not achieved results.

Motion is optional: 120–180ms colour/opacity changes; no essential content hidden pending entrance animation. Reduced-motion removes movement and smooth scrolling. Never animate meaningful text or rearrange reading order visually.

## 9. Design evidence and exit criteria

The board covers homepage/journey/projects, Journal, article, editor and contact specimens at responsive widths. It is an original design artifact, not a running product or usability-test result. Screenshots are captured after opening the current board in Chromium and inspecting desktop and mobile layouts. Login, detail, inbox, and state variants are specified here and in the checklist; they do not each have a separate high-fidelity board.

Chunk 02 is complete when the tokens, copy, responsive rules, component states, route-level requirements and visual reference agree; internal board links work; and inspected board views have no horizontal overflow at the sampled widths. Application accessibility, behavior, backend and performance remain later gates.
