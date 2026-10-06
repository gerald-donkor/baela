# Horizon previews

Captured from the production build on 2026-10-05.

- `desktop-hero.png`: 1440 × 1000 first viewport.
- `desktop-dark.png` / `desktop-light.png`: complete landing page at 1440px.
- `mobile-dark.png` / `mobile-light.png`: complete landing page at 390px.
- `design-system-light.png`: complete component gallery at 1440px.
- `reviews-desktop.png` / `reviews-desktop-light.png`: the developer review wall in both themes.
- `reviews-mobile.png`: the stacked review layout at 390px.
- `faq-desktop.png`: the FAQ section at 1440px.

Validation: lint and TypeScript passed; all 69 Vitest tests passed; the webpack production build passed; all 33 Playwright checks across desktop Chromium, mobile Chromium, and Firefox passed. Checks include review selection, FAQ keyboard interaction, pointer cursors on enabled/disabled controls, and closed-enrollment behavior. Landing and gallery layouts were also checked at 320, 360, 390, 768, 1024, and 1440px with no horizontal overflow or browser errors. Both themes were visually inspected.

WebKit browser checks remain unverified because this host lacks the required `libicu74`, `libxml2`, and `libflite1` browser dependencies.
