# Navigation and loading changelog

## 1.0 - 2026-10-08 - Uncommitted

- Replaced unconditional route resets with query preservation and per-entry scroll restoration.
- Preserved catalog query and return position from detail and related-course links.
- Kept the application shell mounted during lazy route loading.
- Added shared labeled SVG loaders, retained catalog content during refresh and respected reduced motion.
- Confined select and service-tab scrolling to their containers and restored preview-dialog focus.
- Verified 19 tests, scoped lint, build and diff checks. Browser and Word visual QA remain pending.
