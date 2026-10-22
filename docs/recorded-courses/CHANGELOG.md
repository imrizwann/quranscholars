# Recorded course frontend changelog

## 1.1 - 2026-10-08 - Uncommitted

- Preserve catalog scroll on query changes and retain return filters/position from course details.
- Keep existing course cards during background retrieval with inert, busy and updating states.
- Add shared loaders and improve preview keyboard focus behavior.
- Nineteen frontend checks pass; browser and Word visual QA remain pending.

## 1.0 - 2026-10-08 - Uncommitted

- Replaced mock public reads with RTK Query list/detail retrievals.
- Mapped populated category/instructor fields, nested stats, absent values and zero sale prices.
- Added backend search, category/level/language filters and pagination; retained actual newest-first ordering.
- Connected homepage/navigation and category-based suggestions to public retrievals.
- Reused the video player through an unavailable-source boundary; removed fake purchase access and testimonial claims from real course details.
- Added optional public thumbnail origin, nine passing checks and frontend-owned documentation.
- Preserved pre-existing user edits; no backend changes or deployment. Browser and Word visual QA remain unverified.
