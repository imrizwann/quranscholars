# Recorded course frontend next implementation

Document ID: RECORDED-FRONTEND-NEXT
Version: 1.1
Reviewed date: 2026-10-08
Status: Proposed items; not implemented unless marked complete

## Objective and implementation order

The public read integration is complete within the reviewed API contract. Remaining work depends on backend contracts. This guide is a plan only and does not authorize or claim backend changes.

## Work item RF 001 Server sorting

- Status: Partial. Newest-first server order is implemented; selectable sorting is proposed.
- Depends on: Public API support for sort.
- Problem and user impact: Existing public validation rejects popular/rating/price sorts, so the frontend control only displays Newest.
- Intended behavior: A sort change resets page 1 and affects the complete filtered server result, with stable tie-breaking.
- Existing files: Backend validation/recorded-course/course-query.validation.js and services/recorded-course/recorded-course-public.service.js; frontend services/recordedCourseContract.js and pages/recorded-courses/RecordedCourses.jsx.
- Proposed files: None required.
- Wiring: Extend the public query schema and service order, then enable only supported frontend options. No new worker.
- Data migration: None anticipated; review appropriate indexes before expanding order choices.
- Acceptance: Compare first and subsequent pages for each sort; no duplicates, correct totals, invalid values rejected. Frontend never sorts a partial page locally.
- Rollback: Disable additional frontend options before removing backend support.

## Work item RF 002 Complete filter options

- Status: Partial. Backend category filtering works; category chips currently reflect observed pages.
- Depends on: A public category/facet contract independent of the current page.
- Problem and user impact: An unseen category cannot be chosen from chips until encountered, although its slug works in the URL.
- Intended behavior: Stable category options covering the public catalog, including when selected filters yield zero results.
- Existing files: Backend public routes/controller/service and Category model; frontend recordedCoursesRepository.js and RecordedCourses.jsx.
- Proposed files: A category/facet endpoint or metadata extension, exact route to be agreed before implementation.
- Wiring: API returns category names/slugs; a cached frontend query supplies chip options. No worker or mutation.
- Data migration: None anticipated.
- Acceptance: Categories absent from page 1 remain selectable; unknown slugs and empty results retain recoverable UI.
- Rollback: Restore observed-category chips and preserve deep links.

## Work item RF 003 Authenticated learning and playback

- Status: Deferred. Player component reuse and missing-source states are implemented; media delivery and purchases are not.
- Depends on: Authorized curriculum, enrollment, payment, progress and playback contracts.
- Problem and user impact: Public details have no lesson list or playback source. Local demo enrollment must not grant purchased access.
- Intended behavior: Server-owned enrollment and progress, authorized lessons and expiring playback URLs; preview access follows backend permissions.
- Existing files: RecordedCoursePlayer.jsx, RecordedCourseDetails.jsx, MyLearning.jsx, CourseVideo.jsx, recordedCourseAdapter.js, recordedCoursesRepository.js and learningStorage.js.
- Proposed files: Authenticated learner API modules after route contracts are specified; exact names are not yet agreed.
- Wiring: New authenticated retrievals replace public detail usage in the player and legacy local progress. CourseVideo continues to accept only a resolved source. Backend authorization and signed media issuance are prerequisites, not frontend security controls.
- Data migration: Ignore demo enrollment keys. Do not migrate local demo records into paid access without server validation.
- Acceptance: Anonymous/unenrolled access is rejected, expired URLs refresh safely, previews respect permissions, missing source never buffers indefinitely, progress persists across devices, purchases require confirmed backend success.
- Rollback: Disable enrollment/playback entry points; preserve genuine server entitlements and progress. Never reinstate local enrollment as authorization.

## Work item RF 004 Public visibility and media data

- Status: Proposed backend follow-up outside the completed frontend scope.
- Depends on: Confirming intended publication policy and public asset delivery.
- Problem and user impact: Public services select Draft/unpublished records. Some records omit instructor names and lesson totals, and thumbnails contain storage keys.
- Intended behavior: Public eligibility is deliberate and tested; responses include the intended metadata and usable image URLs or a documented public image origin.
- Existing files: Backend recorded-course-public.service.js, recorded-course.model.js, thumbnail-upload.service.js and user model population; frontend recordedCourseAdapter.js and .env.example.
- Proposed files: None specified.
- Wiring: Backend service projections/population and visibility filters are reviewed before rollout. Thumbnail delivery must not expose private bucket credentials. Configure VITE_COURSE_MEDIA_BASE_URL only for an approved public origin.
- Data migration: Audit legacy records before backfilling missing counts. Do not publish draft courses as part of a frontend deployment.
- Acceptance: Published/draft visibility tests, missing-reference tests, accurate counters and valid thumbnail loads.
- Rollback: Revert policy changes independently of frontend fallback handling; retain private media restrictions.

## Work item RF 005 Visual and deployment verification

- Status: Not verified.
- Depends on: An available browser, configured media origin and DOCX renderer.
- Problem and user impact: Automated component rendering does not exercise interactive controls or visual layout.
- Intended behavior: Verify desktop/mobile filtering, debounce, page reset, browser Back/Forward, rapid requests, retry, 404 and preview dialog focus. Render both Word editions and inspect every page.
- Existing files: All recorded-course pages/components, tests/recorded-course-render.test.mjs and these guides.
- Proposed files: Browser test cases when a supported runner is selected.
- Wiring: Verification only; no backend mutation.
- Data migration: None.
- Acceptance: No stale results after rapid filter changes; URL/history preserved; no overflow; no broken images; no clipped Word text; actual media playback only after RF 003.
- Rollback: Keep the current unavailable states if integration checks fail; do not advertise unverified playback.

## Navigation follow-up

Scroll restoration, query preservation, retained catalog refresh content and shared accessible loaders are implemented. Nineteen frontend tests pass. Interactive verification remains tracked in ../navigation-experience/02-next-implementation-guide.md and RF 005. No new backend contracts or sort options were added.

## Completion evidence

RF 000 Public retrieval is implemented in the uncommitted frontend working tree based on commit 806acd6c81bd928b265b67fe49207aae6062ee94. Nine automated tests, scoped lint, production build and the named read-only live API checks passed on 2026-10-08. See the current guide for precise limitations and source-snapshot.json for reviewed identities. No deployment was performed.
