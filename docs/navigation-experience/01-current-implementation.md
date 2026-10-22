# Navigation and loading experience implementation

Document ID: NAVIGATION-CURRENT
Version: 1.0
Reviewed date: 2026-10-08
Status: Implemented and unit tested; browser verification pending
Source identity: Frontend commit 806acd6c81bd928b265b67fe49207aae6062ee94 plus uncommitted changes

## Purpose and scope

This guide explains scroll and loading behavior for frontend maintainers. The former App effect scrolled to the top whenever the complete location object changed, including query-only changes. RouteScrollManager now distinguishes new pages, filter updates, history navigation and anchors. All writes remain under quranscholars. Existing user edits and the previous recorded-course integration are preserved. No backend, data model, worker or API contract changed.

## Architecture and wiring

src/main.jsx creates the existing browser data router with App as its root element. src/app/App.jsx mounts RouteScrollManager once outside a Suspense boundary surrounding Outlet. Navbar, Footer and DevelopmentWelcome remain mounted while a lazy route loads. AppLoader is now the Outlet fallback rather than a replacement for the whole app shell. Existing authentication sync and expiry behavior remain, with unused boot timing removed.

RouteScrollManager reads useLocation and useNavigationType, uses getScrollInstruction in components/navigation/scrollPolicy.js, and calls restoreScroll. A Map holds up to 50 history-entry positions. Capturing document clicks and window scroll events records positions before navigation. Positions persist on navigation and pagehide; storage failure falls back to the in-memory Map.

The router's public catalog remains /courses and detail remains /courses/:slug. Route aliases remain unchanged. Guards for protected and admin routes use AppLoader while their existing useMeQuery requests resolve. No route/controller/service/worker wiring was added; API details remain in the recorded-courses guide.

## Navigation contracts

New navigation to a different pathname starts at the top immediately. Query-only changes on the same pathname preserve the viewport. This applies to search, filters, sort parameters and tabs throughout the app. A first load with no saved entry preserves the browser's initial position.

Back/Forward uses the saved position for that history entry, including query-only history. A hash change scrolls to its decoded element ID. Saved history position takes precedence over an older catalog-return hint. The optional location state scroll:preserve permits explicit preservation when changing paths; no new UI currently requires it.

RecordedCourseCard stores courseCatalog:{url,key} in router state when opened from /courses. Related cards inherit that origin. Detail breadcrumbs and the missing-course Back to courses link retain the catalog query and request restoration with restoreScrollKey. Return URLs are limited to /courses or /courses?...; external URLs are not accepted. Browser Back remains the normal history operation. A new-tab detail has no source router state and falls back to /courses.

Pagination is an intentional exception to query preservation: clicking Previous or Next scrolls to the results area if it is above the viewport, never to the marketing hero. The results container receives focus with preventScroll. Filters and typing do not invoke this behavior.

## Execution lifecycle

The manager sets history.scrollRestoration to manual while mounted and restores the original setting when unmounted. getScrollInstruction chooses preservation, a position or an anchor. restoreScroll immediately resets new pages to the top, but waits before restoring a deeper position if content is too short or a data-route-loading/data-scroll-pending marker exists.

ResizeObserver and MutationObserver retry after content becomes available. Animation frames coalesce observer notifications. Restoration uses instant scrolling so it is not affected by the global smooth-scroll stylesheet. A five-second deadline bounds waiting: it attempts the target once, allowing the browser to clamp to the available height, and stops observing. Wheel, touch, pointer interaction or a scroll/navigation key cancels delayed restoration. Cleanup on route changes also stops timers, frames and observers. Slow content that arrives after the deadline may need manual scrolling (NX-001).

CustomSelect opens and restores focus with preventScroll. Arrow-key option navigation adjusts only the listbox scrollTop. ServiceSideNavigation centers its selected tab with horizontal list.scrollTo; it no longer calls scrollIntoView on an element whose ancestors include the whole page. Pagination and horizontal navigation respect prefers-reduced-motion.

## Loading and rendering contracts

Spinner is a reusable SVG ring with a rotating arc and softly pulsing center. LoadingState supplies a visible label and one polite, atomic status announcement; its decorative Spinner adds no duplicate announcement. It supports inline, content and page layouts. AppLoader wraps the page variant; InlineSpinner forwards its dimensions to Spinner. CSS disables spinner animation and smooth document scrolling when reduced motion is requested.

Loaders cover lazy routes, authentication guards, recorded-course details/player, catalog refreshes, homepage course retrieval, navigation course retrieval and related-course requests. Existing card skeletons remain for first loads and now respect reduced motion. Existing Vidstack buffering/error indicators remain responsible for actual media loading.

The catalog retains the last successful page through RTK Query data while new arguments load. It announces Updating courses, marks the results aria-busy, dims and makes old cards inert, and disables pagination until completion. This preserves layout without allowing navigation into a stale result. currentData still supplies category discovery and out-of-range correction. Once the request settles, its results or retryable error replace the old content. Loading counts no longer flash zero, and an in-flight empty result is not labeled as a completed empty search.

The course preview dialog now keeps keyboard focus inside the modal, closes on Escape and restores focus without scrolling to the trigger. Its close callback is stable during background related-course requests.

## Data and storage

Session storage key: quranscholar-scroll-v1. The JSON shape is an array of [historyKey,{url,x,y}] entries, capped at 50. url contains the pathname and query; x/y are pixel coordinates. This is per-tab navigation state, not authorization or learning progress. Data is not sent to the backend. Invalid or blocked storage is ignored. No new environment variables are required.

The only additional route-state contracts are courseCatalog:{url,key}, restoreScrollKey and optional scroll:preserve. No database migration, queue payload, retry policy, publication transition, storage bucket change or server startup change is involved. Run npm run dev using the existing frontend configuration.

## Failure handling and operations

Network errors retain the existing explicit retry UI; loaders do not fabricate results or introduce automatic retry loops. Navbar course-load errors now identify the failure and direct users to the catalog. Missing playback remains an unavailable state, not an endless spinner. Scroll observers are best-effort and are cancelled when the user intervenes.

Rollback should revert only this task's frontend source changes. No server rollback or migration is needed. Removing the session-storage key is optional; older positions carry no application permissions. Reverting unrelated user edits or the previous API integration is not part of rollback.

## Verification and known limitations

Verified on 2026-10-08: npm run test:frontend passed 19 tests. Ten navigation tests cover same-route preservation, new-page resets, history restoration, catalog-return precedence, anchors, delayed content, short layouts, cancellation and the restoration deadline. Nine existing contract/render tests also passed; their rendering coverage now checks the detail return URL and a single accessible loading announcement.

Verified: scoped ESLint on all changed JS/JSX files passed with --max-warnings 0. npm run build passed with the existing Vite warning for chunks above 500 kB. git diff --check passed. The rendering test is server-side React rendering with mocked API responses; the scroll tests simulate window/document observers. Neither substitutes for interactive browser verification.

Not verified: desktop/mobile browser interaction, screen-reader announcements, actual animation appearance, reload/back-forward cache behavior and visual layout. The tool inventory returned no browsers or native apps. Word files export successfully but render verification remains blocked because LibreOffice soffice.exe is unavailable. Playback and backend retrieval behavior are unchanged from the prior integration and were not re-tested against live services in this task.

## Source references and change history

See source-snapshot.json for reviewed hashes. Principal sources: src/main.jsx; src/app/App.jsx; components/navigation/RouteScrollManager.jsx and scrollPolicy.js; components/feedback/Spinner.jsx, LoadingState.jsx, AppLoader.jsx and InlineSpinner.jsx; components/ui/CustomSelect.jsx; components/navigation/ServiceSideNavigation.jsx; recorded-course pages/cards; Navbar; Home; authentication guards; src/styles/globals.css; tests/navigation-experience.test.mjs and tests/recorded-course-render.test.mjs. See CHANGELOG.md and the separate next implementation guide.
