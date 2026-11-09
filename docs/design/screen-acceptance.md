# Screen acceptance checklist

Implementation contract, not a report of passing application tests. Phase 1 has a static visual study only. Each row must be checked against the implemented app before submission.

## Every public screen

- [ ] Same public shell, wordmark, tone, typography, footer and independent-demo notice.
- [ ] Unique meaningful title/description, one h1, main landmark, skip link, logical reading order.
- [ ] Keyboard-operable navigation, current link state, menu expanded state, focus return/Escape.
- [ ] No dead links, invented claims, unlicensed imagery, or layout-dependent hidden content.
- [ ] No page-level horizontal overflow at 375, 390, 768, 1024 and 1440px; readable at enlarged text/zoom.
- [ ] Contrast, input outlines, touch targets, focus and reduced-motion behavior checked in browser.
- [ ] Loading, error, missing and empty data differ visibly where relevant.

| Screen | Main completion condition | Critical failure to test |
|---|---|---|
| Homepage | Offer + CTA clear; program understandable; latest posts are live | CTA below initial mobile viewport; query failure disguised as zero posts |
| Projects index | Clear provenance and useful browsing | Illustrations presented as actual student achievements |
| Project detail | Problem/approach/outcome distinction, source, meaningful preview | Unverified success figures or unauthorised portraits/screenshots |
| Journal | URL-based query/category/page, bounded results, useful empty state | Search/filter disappears after refresh; invalid page crashes |
| Article | Readable safe content, metadata, current canonical, related public posts | Draft leakage; unsafe HTML/links; stale public page after unpublish |
| Contact | Minimal adult request, privacy acknowledgement, pending/success | False booking/email confirmation; duplicate writes; public inquiry access |
| Privacy | Reflects real demo processing and retention before launch | Copied policy that promises an unimplemented deletion/inbox process |
| Login | Invited account login/logout, clear errors, expired-session handling | Client-only auth checks; user role assignment; credentials in public code |
| Admin overview | Real counts or useful empty state, navigable editor tasks | Fabricated activity graphs or unrelated customer data |
| Post list | Search/status filter, new/edit actions, understandable statuses | Unauthenticated/non-editor access to records |
| New/edit post | Save, reload, cover upload, validation, category, unsaved warning | Lost input on error; arbitrary file type; empty publish; slug collision |
| Protected preview | Real saved draft, clear preview banner, noindex/no-store | Shared URL exposes draft to non-editor |
| Publish/unpublish | Confirmation + accurate public update | Cached homepage/detail still shows unpublished content |
| Delete | Named confirmation, clear outcome, recoverable error | Unintended record deletion; orphaned public content |
| Inquiry inbox | Restricted list/detail using synthetic demo data | Contact details exposed publicly or in shareable evidence |

## Required workflow evidence

- [ ] Create draft → save → refresh → edit → preview → publish → verify public homepage/list/detail.
- [ ] Update title/slug/content → verify public caches/canonical/old-slug behavior.
- [ ] Unpublish → public detail disappears → republish → delete → missing page behaves correctly.
- [ ] Request consultation → stored once → private inbox → deny public reads.
- [ ] Attempt unauthenticated/non-editor writes and direct draft reads through API and database.
- [ ] Reproduce schema and synthetic content from a clean database.
- [ ] Inspect fresh desktop/mobile screenshots and deployed measurements; record real limitations.
