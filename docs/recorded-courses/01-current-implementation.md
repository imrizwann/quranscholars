# Recorded course frontend implementation

Document ID: RECORDED-FRONTEND-CURRENT
Version: 1.1
Reviewed date: 2026-10-08
Status: Implemented public retrieval; partial learning and playback integration
Source identity: Frontend commit 806acd6c81bd928b265b67fe49207aae6062ee94 with uncommitted changes

## Purpose and scope

This guide explains the public recorded-course integration for frontend maintainers. Catalog, details, homepage course cards and navigation links read the backend instead of the mock repository. Search, category, level, language and pagination execute on the server. Sorting is fixed to the backend newest-first order. The visual design is retained, with unavailable states and a language filter added where needed.

Only files under quranscholars were changed. The working tree already contained edits to the adapter, Navbar, course details, Profile, Login, Register and fileUploadApis. Unrelated edits were preserved. Source hashes identify the reviewed files; they are not deployment evidence.

## Architecture and wiring

Frontend src/main.jsx mounts /courses to RecordedCourses and /courses/:slug to RecordedCourseDetails. /recorded-courses and /courses/self-paced aliases redirect to those routes. Protected routes /learn/:courseSlug/:lessonId and /learn/:courseSlug/lesson/:lessonId mount RecordedCoursePlayer. /dashboard/learning mounts MyLearning; /my-learning redirects there through ProtectedRoute.

RecordedCourses, Home and Navbar call useGetRecordedCoursesQuery in src/features/recorded-courses/services/recordedCoursesRepository.js. The repository injects two endpoints into the existing courseApi. src/app/store.js already registers that API reducer and middleware. Existing /api/courses calls used by admissions remain untouched.

List query wiring: hook -> buildRecordedCourseQuery -> fetchBaseQuery -> GET /api/public/recorded-courses -> normalizeRecordedCourseList -> adaptRecordedCourse -> RecordedCourseCard. Detail wiring: useGetRecordedCourseBySlugQuery -> encoded slug request -> data.course -> adaptRecordedCourse -> RecordedCourseDetails. Related courses use the same list endpoint with the course category slug and limit 4; the detail page excludes itself and shows up to 3 suggestions.

Backend references are relative to the parent workspace and were not edited. quranscholars-apis/app.js mounts routes/recorded-course/recorded-course-public.routes.js at /api/public/recorded-courses. Global middleware order before the mount is cookieParser, compression, helmet, global rate limiter, CORS, JSON and URL-encoded body parsers. The list route then runs validateQuery(publicCourseListQuerySchema), getPublicRecordedCourses and getPublicRecordedCoursesService. The slug route runs getPublicRecordedCourseBySlug and getPublicRecordedCourseBySlugService. Errors reach errorMiddleware after the mounts.

Both services use the RecordedCourse model and populate Category name/slug and instructor name/avatar. Category filters first resolve a Category by slug. The service escapes the search term and searches title, shortDescription and tags. Public retrieval does not use queues, workers, upload services or playback signing. No new route, controller, service or worker was added.

## API contracts

GET /api/public/recorded-courses is public and read-only. Supported query parameters are page (integer at least 1), limit (1 to 50), search (trimmed 1 to 100 characters), category (slug), level (Beginner, Intermediate, Advanced) and language (string up to 50 characters). Catalog requests use limit 8; homepage uses 3; Navbar and related suggestions use 4. Blank and All filters are omitted.

The strict public schema rejects sort, featured, price and rating parameters. The service sorts createdAt descending, then _id descending. The existing Sort control is disabled with Newest selected. There is no client sort of a server page, and no claim that popular, rating or price sorts work.

Sanitized list response shape:

```json
{"success":true,"data":{
  "courses":[{"_id":"course-id","slug":"example-course",
    "title":"Example course",
    "category":{"_id":"category-id","name":"Quran","slug":"quran"},
    "instructor":{"_id":"teacher-id","name":"Example instructor"},
    "price":{"original":299.5,"sale":0,"currency":"INR"}}],
  "pagination":{"page":1,"limit":8,"skip":0,
    "totalCourses":33,"totalPages":5},
  "filters":{"search":null,"category":null,"level":null,"language":null}
}}
```

GET /api/public/recorded-courses/:slug returns {success:true,data:{course}}. The frontend URL-encodes the slug. The backend normalizes it and returns 404 when absent. Details additionally select description, outcomes, requirements, audience, tags, totalDuration, stats.totalSections, stats.totalLessons, featured and updatedAt. Stored records may omit some of these fields despite the projection. Neither public response includes curriculum sections, lesson media or a playable trailer.

The backend currently selects published:false and status:Draft for both public retrievals. This is the reviewed behavior, not a frontend publication policy or a claim of production readiness. Correcting publication rules is outside this frontend-only task (RF-004).

## Execution lifecycle

The URL stores search, subject (category slug; category is also accepted), level, language and page. Search updates the URL immediately and debounces the API request by 300 ms. Filter changes clear the page and unsupported sort parameter in one URL update. Pagination sends a new page request without slicing local results. The backend totalCourses and totalPages control counts and navigation. Same-route query updates preserve scroll. Pagination moves only to the results region when needed. Cards carry catalog URL/history metadata so detail breadcrumbs preserve filters and restore the source position; see ../navigation-experience/01-current-implementation.md. A page beyond the current last page is replaced with the last valid page, or 1 for empty results.

RTK Query caches each argument combination for 60 seconds after its last subscriber. Catalog refreshes retain the previous successful page, dim its cards and make them inert while a labeled loader and aria-busy indicate the update. The previous page is not presented as a completed result for the new filters. Detail retrieval still uses currentData to prevent the previous slug from rendering as the selected course. Initial skeletons, empty states and retryable errors replace mock fallbacks. Detail 404 and transport/server failures have separate messages. Related-course requests are skipped until details arrive.

Category chips accumulate category names/slugs seen in retrieved pages during that mounted catalog session. A category from a deep link remains selectable even if the page is empty. There is no category directory endpoint: the chip set is not a complete backend taxonomy (RF-002). Language suggestions are English, Arabic, Hindi and Urdu; a different language supplied through a URL remains supported.

## Data and storage

The adapter preserves the existing view-model structure while mapping populated MongoDB references. category is a display name and categorySlug is the filter key. Missing instructor name is rendered as Instructor not listed. Missing list duration and lesson totals remain null and show unavailable labels instead of fabricated zeros. Details read counters from stats, independently of absent sections. The live sample also omitted stats.totalLessons; this displays Lesson count not listed.

Price uses sale when present, including a zero sale price, otherwise original. Currency formatting retains currency fractional precision. Duration is measured in seconds and rounded to whole minutes with correct hour carry. No DTO value grants enrollment or playback access.

Thumbnail strings can be HTTP(S) URLs or R2 object keys. An object key becomes a browser URL only when VITE_COURSE_MEDIA_BASE_URL is explicitly configured to a public media origin. Otherwise the existing image placeholder is used. VITE_API_URL configures the API origin, defaulting to http://localhost:3000. Both settings are public frontend build configuration; never place bucket secrets in them. Restart Vite or rebuild after changing them.

Public reads write no application data or local enrollment state. The old learningStorage.js and unused mock data remain in the repository for future reconciliation. MyLearning no longer treats mock/public courses as purchases, and the detail purchase button now says Enrollment coming soon. Other live-class demo behavior is unchanged.

## Playback boundaries

CourseVideo reuses components/video-player/VideoPlayer.jsx when passed an HTTP(S) playback URL. Without a source it renders a poster and an unavailable message without opening a player that would buffer indefinitely. The preview dialog and lesson page both use this boundary. Preview keyboard focus is trapped while open and returns to its trigger without moving the page. The current backend exposes no source, so actual media playback is not verified.

The adapter has an explicitly future-facing seam for trailerPlaybackUrl, trailerVideo.playbackUrl and lesson playbackUrl/videoUrl. These are frontend compatibility fields, not currently implemented API contracts. R2 sourceKey, hls.masterKey and processing status objects are never passed as media URLs. Authenticated curriculum, access checks, progress persistence and URL expiry remain deferred (RF-003). The protected player retains legacy local progress code only for a future lesson DTO; it is unreachable with current lesson-free public responses.

## Failure handling and operations

Fetches use the existing credentials:include configuration and backend CORS policy. Start the frontend with npm run dev and point VITE_API_URL at the running backend. There is no automatic application retry loop; catalog and detail errors expose Try again. Invalid envelopes fail transformation rather than displaying mock data. Missing categories produce the backend empty result. A missing or inaccessible thumbnail should be resolved through the media-origin configuration, not by exposing private object-storage credentials.

No data migration, queue retry, job timeout, worker startup or publication action is introduced. Rolling back this frontend integration requires reverting only this task's frontend changes while preserving pre-existing user edits; no database rollback is needed.

## Verification and known limitations

Verified on 2026-10-08: npm run test:recorded-courses passed all 9 tests; npm run test:frontend passed 19 total tests including the navigation policy and delayed-restoration cases. Eight contract tests cover query allowlisting, limits, populated DTOs, zero sale prices, omitted stats, media keys, server pagination and malformed envelopes. The rendering test bundles the actual React pages, seeds RTK Query through mocked fetch, and checks catalog totals, filters, detail missing fields, 404, server error, video-unavailable output, catalog-return URLs and accessible loader markup. It is not an interactive browser test.

Verified: npm run build passed. Vite still reports chunks exceeding its 500 kB warning threshold. Scoped ESLint passed for the changed frontend JavaScript and JSX files. Repository-wide lint was not claimed.

Verified through read-only Node fetches against http://localhost:3000: 33 courses, 5 pages at limit 8, distinct first/second pages; combined category/level/language matches; title search; zero-result search; slug detail matching its list ID; missing-slug 404; unsupported sort=popular returning 400. An initial live assertion expected a lesson counter on every detail; the observed partial stats object corrected that assumption. The adapter and detail rendering preserve this absence.

Not verified: browser interactions, responsiveness and screenshots, because the session exposed no browser. Playback, purchase, authenticated library, progress persistence and deployment remain unverified or deferred. Word editions are generated but visual QA is blocked by the missing LibreOffice renderer in the provided Windows runtime; do not treat the exports as visually verified.

## Source references and change history

See source-snapshot.json for SHA-256 identities. Primary frontend sources are src/main.jsx, src/app/store.js, src/services/api/courses/courses.api.js, the recorded-courses feature model/services/components, the three recorded-course pages, Home, Navbar, MyLearning and tests/recorded-course-*.test.mjs. Backend route/controller/service/validation/model paths appear in the wiring section and snapshot. See CHANGELOG.md and the separate next implementation guide for remaining work.
