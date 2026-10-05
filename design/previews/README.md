# Horizon previews

Captured from the production build on 2026-10-05.

- `desktop-hero.png`: 1440 × 1000 first viewport.
- `desktop-dark.png` / `desktop-light.png`: complete landing page at 1440px.
- `mobile-dark.png` / `mobile-light.png`: complete landing page at 390px.
- `design-system-light.png`: complete component gallery at 1440px.

Validation: lint and TypeScript passed; all 69 Vitest tests passed; the webpack production build passed; all 27 Playwright checks across desktop Chromium, mobile Chromium, and Firefox passed. Landing and gallery layouts were also checked at 320, 360, 390, 768, 1024, and 1440px with no horizontal overflow or browser errors. Both themes were visually inspected.

WebKit browser checks could not launch because this host lacks the required `libicu74`, `libxml2`, and `libflite1` browser dependencies. Its request-only security test passed; its eight browser tests remain unverified.
