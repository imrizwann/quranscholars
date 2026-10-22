# Navigation and loading next implementation

Document ID: NAVIGATION-NEXT
Version: 1.0
Reviewed date: 2026-10-08
Status: Proposed verification and follow-up work

## Objective and implementation order

The scroll policy and shared loading states are implemented. Complete browser verification before claiming visual or assistive-technology verification. Extend restoration behavior only in response to observed failures; no backend work is proposed here.

## Work item NX 001 Browser and slow-network verification

- Status: Not verified.
- Depends on: An available browser and running frontend/API.
- Problem and user impact: Simulated observer tests cannot reproduce every layout, browser history or input timing behavior. A response after the five-second restoration deadline may leave a deep history position unrestored.
- Intended behavior: Confirm preserved search/filter position, results-only pagination, Back/Forward, reload restoration, new-tab fallbacks, anchor navigation and cancellation when users scroll during loading.
- Existing files: RouteScrollManager.jsx, scrollPolicy.js, RecordedCourses.jsx, RecordedCourseDetails.jsx, RecordedCourseCard.jsx and tests/navigation-experience.test.mjs.
- Proposed files: Browser tests under tests/navigation-browser after selecting an available runner; these files do not exist yet.
- Wiring: Test the existing routing and frontend loading markers. Change the restoration deadline or data-ready signaling only if the scenarios establish a problem. No API/controller/service/worker changes.
- Data migration: None. Retain the session key format unless a measured issue requires a version change.
- Acceptance: Test desktop/mobile, rapid typing, repeated filters, a cold-cache return from detail, short and long result pages, blocked storage, requests exceeding five seconds, manual scroll during loading, malformed hashes, and session Back/Forward. No unexpected page-top reset or repeated scroll fight.
- Rollback: Disable only the failing enhancement while retaining same-path query preservation. Preserve user edits and API integration.

## Work item NX 002 Accessibility and motion verification

- Status: Implemented semantics; manual verification pending.
- Depends on: Browser, keyboard and screen-reader access.
- Problem and user impact: Static markup checks cannot confirm actual focus movement, spoken announcements or reduced-motion rendering.
- Intended behavior: One clear loading announcement; visible keyboard focus; dropdowns and dialogs do not move the page; reduced-motion users see static indicators with readable status labels.
- Existing files: LoadingState.jsx, Spinner.jsx, CustomSelect.jsx, ServiceSideNavigation.jsx, RecordedCourseDetails.jsx and styles/globals.css.
- Proposed files: No application files planned; record browser evidence in the current guide.
- Wiring: Verify existing components and CSS; do not add decorative loading delays or additional live regions.
- Data migration: None.
- Acceptance: Open/close filters with keyboard, navigate off-screen options, close preview with Escape, cycle Tab/Shift+Tab, return focus to the preview trigger, and enable reduced motion at OS level. Test accessible status changes during both success and failure.
- Rollback: Keep the static labeled indicator if motion fails; preserve focus restoration and error recovery.

## Work item NX 003 Word visual verification

- Status: Not verified; exports generated.
- Depends on: A supported LibreOffice renderer and page-image inspection.
- Problem and user impact: Word layout cannot be confirmed from document structure alone.
- Intended behavior: Render both feature guides and inspect every page for clipping, page breaks, contents and footer readability.
- Existing files: docs/navigation-experience/*.docx and scripts/export-recorded-course-guides.py.
- Proposed files: No additional deliverables; page images are QA intermediates.
- Wiring: Document generation and rendering only; no application or backend changes.
- Data migration: None.
- Acceptance: All rendered pages readable with black headings, populated contents and page numbers.
- Rollback: Keep canonical Markdown and regenerate Word after correcting layout.

## Completion evidence

NX 000 Core navigation and loading implementation is complete in the uncommitted frontend working tree based on commit 806acd6c81bd928b265b67fe49207aae6062ee94. The 19-test frontend suite, scoped lint, production build and diff checks passed on 2026-10-08. Browser/deployment verification is not claimed. See the current guide and source snapshot.
