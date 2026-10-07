# Course UI direction

Extend the landing page's Horizon system: midnight `#050919`, ink `#0b1023`, raised navy `#10182d`, periwinkle `#a6bfff`, mist `#9aa7c2`, and white `#f2f4fc`. Use the existing semantic tokens so the light theme remains supported. Geist carries titles, body, and navigation; monospace is reserved for the sample code editor.

The library has a quiet navigation rail, a featured continuation, and six illustrated course covers. The workspace is left aligned: a 272px curriculum, a flexible lesson or overview, and a 240px progress rail. At tablet widths progress moves below the content; mobile curriculum becomes a native disclosure.

```
Library:   navigation | heading + continuation + 3 × 2 course collection
Workspace: curriculum | lesson player + reading content | progress + next lesson
```

The course artwork uses the six latest Codesistency video thumbnails, downloaded locally on 2026-10-07 at the user’s request. See `public/images/courses/sources.json` for sources. Covers retain their 16:9 proportions and use contain sizing so their embedded text stays visible. Everything around it stays restrained. Existing brand, typography, buttons, theme tokens, and radii are reused. The reference's dense code editor is adapted into a readable mock lesson player; the landing hero and other sections keep their existing layout.

All six courses, their sections, instructors, learners, lesson content, and progress are fixtures in `lib/sample-courses.ts`. Navigation and content tabs are UI only. Playback and completion controls are disabled; no progress, payment, or enrollment requests are made by the sample UI. Existing server-backed routes remain available for other course slugs.

## Routes and validation

- `/courses`: the six-course collection, with category filters and sample-data search.
- `/dashboard`: the sample student's learning library for anonymous visitors.
- `/courses/[courseSlug]`: an overview, course project, outcomes, curriculum, and fixed progress.
- `/learn/[courseSlug]/[lessonId]`: all 72 lessons, with overview, resources, transcript, and lesson navigation.

Verified on 2026-10-06: lint, TypeScript, 69 unit tests, and the webpack production build passed. All 48 existing landing/platform browser regressions passed across desktop Chromium, mobile Chromium, and Firefox. The final targeted course run passed all 15 checks across the same browsers. Course checks verify every lesson URL and its content, sample search/filter states, keyboard tabs, mobile curriculum navigation, static progress without API requests, and layout widths of 320, 390, 768, 1024, and 1440px in both themes.

Production screenshots are saved in `design/previews/course-*.png`. The default Turbopack build was interrupted after stalling in this sandbox; the project's documented webpack fallback completed successfully. WebKit was not run.
