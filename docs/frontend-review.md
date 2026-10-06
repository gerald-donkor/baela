# Horizon frontend review

## Design plan

Continue the accepted reference rather than start a new identity. Baela is a course platform: the landing page should let a visitor understand the learning experience, try a lesson, and find a course or access plan.

- Palette: midnight `#050919`, panel navy `#0b1023`, reading white `#f2f4fc`, horizon blue `#a6bfff`, supporting slate `#9aa7c2`, daylight `#f5f7fc`. Use the existing semantic tokens in both themes.
- Type: bundled Geist Sans remains the single family. Its compact display proportions suit the horizon; normal tracking and sentence case make navigation and supporting labels easier to scan. Keep the large hero and give the functional demo readable text.
- Layout: centered hero and preview; quiet course and plan sections; a staggered review wall; left-aligned FAQ. The header uses normal flow so extra account links have real space.

```text
Brand        Courses / How it works / Reviews / Pricing        Account actions
                         illuminated horizon
                         heading and actions
                         interactive lesson preview
                learning steps / real course collection
              featured story | sample reviews | sample reviews
                         three access options
               questions intro | expandable answers
                         final course action
```

On a narrow screen, the header becomes a dismissible disclosure, the preview becomes a readable single column, and stories, plans, and questions stack.

## Review against the brief

The blue horizon is the memorable element already approved by the user. Keep it and the hero composition. The quieter sections should not compete with it: remove hover glows from passive review cards, reduce decorative labels, and preserve meaningful step numbering only for the learning sequence. The fictional review disclosure remains clearly visible. Keep course data, access checks, and checkout states intact.

The initial production review at 320, 390, 768, 1024, and 1440px found no page overflow or runtime errors in either theme. Escape did not dismiss the mobile navigation. Source review also found a remounted review live region, a nested figure caption, 24–34px review controls, and branding assets from the previous palette. These are the focus of the quality pass.

## Final critique

The horizon and centered hero remain the visual anchor. Sentence-case labels and direct learning-step copy keep the rest of the page quieter. The demo is now usable as a reading interface, with 13–14px functional text and a shorter breadcrumb on mobile. The sample-review disclosure is 12px, portraits remain local, and passive cards have no hover glow.

The header uses normal flow and its visitor, student, and administrator variants are available in the gallery. Mobile disclosure dismisses on Escape, outside interaction, focus leaving, destination selection, and switching to a desktop viewport. Review controls have 44px targets, a persistent announcement region, and stable placement across all three featured stories, including at 320px.

The light-theme primary action previously faded toward a fill with approximately 4:1 contrast against white text. Its semantic solid blue now gives approximately 6:1. The editable SVG star, multi-size ICO, and bundled-font Open Graph image complete the same identity outside the page.

## Verification

Final screenshots and check results are recorded in `design/previews/README.md` after the production review. Public browser coverage uses unconfigured database and authentication; it does not verify live payments or student sessions.
