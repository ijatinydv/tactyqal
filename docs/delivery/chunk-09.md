# Chunk 09 — Homepage and project storytelling

## Delivered

- Reworked the public homepage around the current eight-week program outline, with two original illustrative project concepts, parent/guardian practical information, five expanded FAQs, a contact-page CTA, and the existing database-backed latest-posts component.
- Added two authored project studies: Neighbourhood Library and Market Day. Each explains a hypothetical problem, a possible first approach, and learning prompts without claiming a completed product or learner outcome.
- Added a projects index and typed `/projects/[slug]` detail routes with dynamic metadata and `notFound()` behavior for unknown slugs.
- Created original vector artwork for both concepts and marked it as illustrative. Curriculum claims are attributed to the current product brief; fees, availability, eligibility, session arrangements, and outcomes are not asserted.

## Boundaries

The contact destination currently provides consultation information only; it does not accept requests, book appointments, or send email. This chunk does not establish confirmed commercial terms, mentors, student histories, or safeguarding arrangements.

## Verification

Lint, strict TypeScript, production build, and browser checks pass for the integrated implementation. Tests inspect mobile/tablet/desktop reflow, the mobile hero CTA, project index/detail navigation, unknown-project 404, FAQ keyboard operation and the live Journal destination. Original SVG artwork and desktop/mobile composition are inspected in the current running app, not inferred from the Phase 1 board.

Project index/detail wrappers use sections inside the shared public main landmark. Sitemap entries include both project stories. Existing component tests use Next Link to preserve native navigation semantics as the route tree grows. The primary hero keeps the approved offer and consultation wording; illustrations are visibly labelled as concepts, not actual learner achievements.

The consultation destination is delivered in the following separate commit. No current fee, admissions promise, invented mentor, revenue figure, or scarcity claim is introduced here.
