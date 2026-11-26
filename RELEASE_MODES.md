# MVP and full course catalogue

`main` is the shared release source. Both course presentations are maintained in
the same codebase; neither requires a separate landing-page design branch.

| Build setting | Course presentation |
| --- | --- |
| `VITE_CATALOGUE_LAYOUT=featured` (default) | MVP: focused homepage course card and a compact catalogue for up to three published courses. |
| `VITE_CATALOGUE_LAYOUT=full` | Full catalogue: existing homepage course presentation, search, category/level/language filters, newest ordering and pagination. |

The MVP still honors search/filter deep links and uses the full catalogue when
there are more than three courses. It never silently hides published courses.
The API currently supplies newest ordering; do not advertise additional sorting
options until they are supported by the API.

## Home page hero layout

With the featured catalogue, `VITE_HOME_HERO_LAYOUT` chooses the home page hero.
The full catalogue always uses `current`.

| Build setting | Hero |
| --- | --- |
| `VITE_HOME_HERO_LAYOUT=current` (default) | Headline on the left, featured course card on the right. |
| `VITE_HOME_HERO_LAYOUT=video` | Centred headline above a large stage that plays the course trailer, with a course info bar. |
| `VITE_HOME_HERO_LAYOUT=path` | The featured course drawn as a learning path through its sections, with an enroll card. |
| `VITE_HOME_HERO_LAYOUT=editorial` | Full-bleed course image with a large overlaid headline and a course bar. Needs a clean course image. |

Blank or unknown values use `current`; release builds reject unknown values. To
try another layout locally, change the value in `.env` and restart `npm run dev`.

Set the flag before building, then rebuild to change modes. Authentication,
checkout, enrollment, progress, reviews, instructor tools and backend security
remain shared. This is a presentation flag, not an authorization control or a
switch to enable unfinished live-class features.

The established homepage is retained. The experimental landing-page designs are
not part of the release. Standard Razorpay checkout remains on `main`; custom
checkout development stays on `feature/razorpay-custom-checkout` until its account
requirements and real payment verification are complete.

Local frontend previews use port **3001** with strict port binding. Stop the old
frontend before switching worktrees; Vite must not silently move to another port.

Verify both modes with `node --test tests/course-presentation.test.mjs`, then run
the frontend suite and production build before release. Build configuration and
hosting requirements are documented in `DEPLOYMENT.md`.
