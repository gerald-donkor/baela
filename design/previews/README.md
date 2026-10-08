# Horizon previews

Captured from the final webpack production build on 2026-10-06 after the frontend-design quality review.

- `desktop-hero.png`: 1440 × 1000 first viewport.
- `desktop-dark.png` / `desktop-light.png`: complete landing page at 1440px.
- `mobile-dark.png` / `mobile-light.png`: complete landing page at 390px.
- `design-system-light.png`: complete component gallery at 1440px.
- `reviews-desktop.png` / `reviews-desktop-light.png`: the developer review wall in both themes.
- `reviews-mobile.png`: the stacked review layout at 390px.
- `reviews-tablet-light.png`: the two-column review layout at 768px.
- `demo-mobile-light.png` / `lesson-mobile-dark.png`: the readable mobile demo and lesson at 390px.
- `faq-desktop.png`: the FAQ section at 1440px.
- `navigation-desktop.png`: visitor, student, and admin header presentations in the gallery.
- `opengraph.png`: the generated Horizon social preview, using bundled Geist.
- `measurements.json`: overflow, loaded-portrait, runtime-error, and featured-story-height results for both themes at all six widths.

Validation: lint and TypeScript passed; all 69 Vitest tests passed; the webpack production build passed; all 42 Playwright checks across desktop Chromium, mobile Chromium, and Firefox passed. Checks include menu dismissal with Escape, outside interaction, focus departure, and resizing; all three account header layouts in both themes; persistent review announcements; 44px review controls; stable featured-story height at 320px; reduced motion; FAQ keyboard interaction; pointer cursors on enabled/disabled controls; and closed-enrollment behavior.

The landing was captured and visually reviewed at 320, 360, 390, 768, 1024, and 1440px in both themes, including the overview and lesson views. The gallery was checked at the same widths through its navigation regression and inspected in the final desktop render. No horizontal page overflow or runtime errors were observed. All local portraits loaded, and switching among featured reviews preserves the card height at each tested width. The social preview, SVG icon, and ICO favicon all returned successful responses with their expected image types.

The primary light-theme fill gives white action text approximately 6:1 contrast. Reviews remain visibly marked as fictional samples. The tests run with database and authentication unconfigured; live student sessions, payments, and private media remain outside these checks.

WebKit browser checks remain unverified because this host lacks the required `libicu74`, `libxml2`, and `libflite1` browser dependencies.

## Course UI previews

Captured from the webpack production build on 2026-10-06:

- `course-library-dark.png`: the six-course collection at 1440px.
- `course-overview-dark.png`: the Next.js course overview, curriculum, and progress.
- `course-lesson-dark.png`: the three-column lesson workspace at 1440px.
- `course-lesson-mobile.png`: the mobile lesson layout at 390px.
- `course-landing-preview.png`: the replacement lesson workspace preview in the landing page.

All content, profiles, and progress in these screens are fixtures. Playback and completion are static. Validation: lint, TypeScript, 69 unit tests, and the webpack build passed; 48 landing/platform regression cases and 15 course checks passed across desktop Chromium, mobile Chromium, and Firefox. The course checks cover all 72 lesson pages and five widths in both themes. See `design/course-ui.md` for routes and details.

## Studio previews — 2026-10-07

- `studio-library-{dark,light}-{1440,390}.png`: course library and responsive Studio navigation.
- `studio-curriculum-dark-1440.png` / `studio-curriculum-light-390.png`: curriculum and lesson authoring.
- `studio-publishing-dark-1440.png`: publishing checklist and product connection.

Captured from a temporary local development preview containing labeled test fixtures. The preview route was removed after verification; no sample courses were inserted into the database. Browser checks passed for course search/filter/sort, automatic and manually edited slugs, dialog focus/escape, unsaved draft warnings, disabled publication of unsaved changes, upload registration retry without a second upload, and empty states. Course library layouts were checked at 320/390/768/1024/1440px; editor layouts at 320/390/768/1440px, all in light/dark themes. No page overflow or JavaScript runtime errors were observed. This is UI verification with mocked uploads, not authenticated live-service acceptance.
