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
