# Baela design system — Horizon

Horizon takes its visual direction from [`design/landing-page-ref.png`](../design/landing-page-ref.png): midnight navy, a cool blue illuminated horizon, centered editorial typography, fine borders, and quiet panels. The landing page is the first implementation; the same semantic tokens style course pages, lessons, the dashboard, authentication, and Studio.

## Source of truth

- [`design/tokens.css`](../design/tokens.css) defines the palette, radii, surface hierarchy, shadows, and content width. `app/globals.css` imports it and maps semantic colors to Tailwind utilities.
- [`/design-system`](../app/design-system/page.tsx) is a browsable component gallery with both themes, typography, palette, controls, course cards, and progress.
- `components/ui/` contains reusable primitives. Extend these before adding page-specific duplicates.
- `app/page.module.css` owns the landing-page horizon and composition; `components/landing/learning-demo.module.css` owns the lesson workspace preview frame; `components/courses/course-ui.module.css` owns the course UI. Keep these effects scoped.

## Color and surfaces

| Role / Tailwind utility | Dark (default) | Light     | Use                                  |
| ----------------------- | -------------- | --------- | ------------------------------------ |
| `background`            | `#050919`      | `#f5f7fc` | Page canvas                          |
| `foreground`            | `#f2f4fc`      | `#17213a` | Headings, primary text               |
| `card`                  | `#0b1023`      | `#ffffff` | Course cards, pricing, panels        |
| `surface-raised`        | `#10182d`      | `#ffffff` | Featured content, inner panels       |
| `primary`               | `#a6bfff`      | `#365bc5` | Actions, progress, active navigation |
| `primary-foreground`    | `#0b173a`      | `#ffffff` | Text on primary actions              |
| `secondary`             | `#141d37`      | `#e9eefb` | Selected states, subtle emphasis     |
| `muted-foreground`      | `#9aa7c2`      | `#596780` | Supporting copy and metadata         |
| `border`                | `#222c45`      | `#dce2ef` | Dividers and panel outlines          |
| `success`               | `#7bd9b5`      | `#23846b` | Completed/positive states            |
| `destructive`           | `#ff96a9`      | `#bc354f` | Errors and destructive actions       |

Use semantic colors (`text-primary`, `bg-card`, `border-border`) rather than navy or blue literals in application components. Decorative art may use scoped fixed colors. Always pair primary fills with `text-primary-foreground`. Completed and locked states need text or icons as well as color.

New visitors see dark mode. The header toggle allows light mode; `next-themes` persists the user's choice. Both themes share the same layout and components.

## Typography and spacing

- **Font:** bundled Geist Sans through `geist/font/sans`; no external font request.
- **Hero:** fluid 38–76px, 1.09 line height, −0.062em tracking. Use once per landing page.
- **Page titles:** `text-4xl font-medium tracking-tight`.
- **Section titles:** `text-3xl sm:text-4xl font-medium tracking-[-.045em]` through `SectionHeading`.
- **Card titles:** 18–20px, medium/semibold, tight tracking.
- **Body:** 14–16px with 1.7–1.85 line height. Use `text-muted-foreground` for secondary copy.
- **Metadata:** 12px. Course pages use 12–13px body copy and compact 10–12px navigation. The landing preview uses a denser illustrative scale; complete lessons are available through its workspace links.
- **Eyebrow:** `.eyebrow` uses 12px, sentence case, medium weight, and primary color. Keep these labels short and useful; step numbers belong to the learning sequence.
- **Spacing:** Tailwind's 4px grid. Use 16–24px gaps, 24–32px card padding, 64–96px section spacing.
- **Container:** `.shell` caps content at `--page-width: 1120px`; gutters are 24px, falling to 16px on small screens.
- **Radii:** `rounded-control` = 10px; `rounded-card` = 16px; `rounded-panel` = 24px. Pills are for badges and circular indicators.

## Components

| Component                 | API / guidance                                                                                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Brand`                   | Shared star mark and Baela wordmark. Wrap in a home link with `aria-label="Baela home"`.                                                                                                                         |
| `Button`                  | `variant`: default, secondary, outline, ghost, destructive. `size`: default, sm, lg, icon. Use `asChild` for links. Icon controls have a 44px target; primary actions use the semantic fill and inset highlight. |
| `SiteHeaderContent`       | Shared header presentation with `user` (name/email or null) and `admin` props. `SiteHeader` supplies the real session; the gallery renders all three account variants for responsive inspection.                 |
| `AccountMenu`             | Signed-in initial avatar, account name/email link, and sign-out action. Uses Radix DropdownMenu for keyboard navigation, Escape, outside dismissal, and viewport collision handling.                             |
| `Card` / `CardContent`    | Theme-aware surface and fine outline. `CardContent` provides 24px padding.                                                                                                                                       |
| `Badge`                   | `variant`: default, muted, success. A compact status pill; use explicit readable text.                                                                                                                           |
| `SectionHeading`          | Required `eyebrow` and `title`; optional `description`, `centered`, `className`, `id`.                                                                                                                           |
| `LearningProgress`        | `value` (0–100), optional `label` and `className`. Clamps invalid values and supplies an accessible native progress bar with percentage.                                                                         |
| `CourseCard`              | Real course title, summary, optional cover/price/progress. Supports an explicit `href`. Shares tokens with the dashboard.                                                                                        |
| `.field` / `.field-label` | Theme-aware inputs, selects, textareas, and label spacing with visible focus.                                                                                                                                    |
| `LessonCurriculum`        | Existing desktop sidebar and mobile dialog inherit the palette; selected, completed, and locked states remain explicit.                                                                                          |
| `TestimonialCard`         | `review`: name, role, local image, quote, subject. Quiet theme-aware review surface with portrait and star row. `ReviewAuthor` and `ReviewStars` can be composed into a featured story.                          |
| `Faq`                     | `items`: question / ReactNode answer pairs; optional `className`. Native `details` and `summary` provide keyboard-accessible disclosure without client JavaScript.                                               |

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LearningProgress } from "@/components/ui/learning-progress";
import { SectionHeading } from "@/components/ui/section-heading";

<section className="shell py-16">
  <SectionHeading
    eyebrow="Your learning space"
    title="Keep your curiosity moving."
    description="Pick up where you left off."
  />
  <Card>
    <CardContent>
      <Badge>In progress</Badge>
      <h3 className="mt-4 text-xl font-medium tracking-tight">
        {course.title}
      </h3>
      <LearningProgress value={percentage} className="mt-6" />
    </CardContent>
  </Card>
</section>;
```

## Course and lesson layouts

Course catalogs use 1/2/3 columns at mobile/tablet/desktop, with 20–24px gaps. Place readable course metadata below the art. Sales pages can use a wide content column and narrower enrollment card; lesson pages retain the wide reading/player area and a 290px desktop curriculum. Collapse sidebars into the existing accessible dialog on mobile.

Use restrained surfaces in learning screens. Reserve the large horizon, broad glows, and centered hero for marketing and occasional onboarding. Keep the lesson player and long-form reading content visually calm. Avoid glows on every panel.

Authentication uses a two-column composition: an illuminated globe with the landing hero’s geography, atmospheric lighting, and connection trails, beside a quiet account form. `components/auth/auth.module.css` scopes the layout; the shared form retains the existing authentication requests, provider buttons, redirects, and recovery flows. The password visibility button has a labeled 44px target. Mobile collapses to the form, and reduced-motion or unavailable-WebGL sessions use the locally generated `public/images/auth/globe.svg` still. Three.js is loaded only when the visual is visible and motion is allowed.

## Interaction and accessibility

Use real links for navigation and buttons for state changes. Keep focus rings visible, icon-only controls labeled, inputs associated with labels, and progress labeled. Use a single H1 and ordered heading levels. The mobile navigation exposes `aria-expanded` and a unique disclosure ID. Escape closes it and returns focus to the trigger; outside interaction, moving focus away, choosing a destination, and resizing to desktop dismiss it. It uses a disclosure rather than a modal focus trap. The skip link targets the main content. Honor `prefers-reduced-motion`. No demo animation auto-plays.

Buttons, links, selects, checkbox/radio inputs, and expandable summaries use a pointer cursor. The shared `Button` declares it explicitly, including when rendered through `asChild`. Disabled buttons keep native disabled behavior and opacity; they do not use `pointer-events: none`, which would pass hovering through to the default page cursor.

The landing preview is labeled **Sample workspace** and uses the same three-column course layout as the full course pages. Six fixture courses, 18 sections, 72 lessons, instructor profiles, and fixed student progress live in `lib/sample-courses.ts`. `/courses` shows the collection, `/courses/[courseSlug]` shows an overview, and `/learn/[courseSlug]/[lessonId]` shows a lesson. Anonymous `/dashboard` visitors can explore the sample learning library. Playback and completion are static; category filters, search, lesson navigation, disclosures, and content tabs only operate on the sample UI. These screens do not create catalog entries, entitlements, purchases, or saved progress. Other course slugs and authenticated dashboards keep their existing server-backed behavior. Unconfigured enrollment continues to show the closed state.

## Reviews and FAQ patterns

`DeveloperReviews` adds a staggered three-column wall and a larger featured quote. Tablet rows use at most two columns; mobile stories stack. The layout was inspired by [21st.dev’s Testimonials with Marquee](https://21st.dev/@serafimcloud/components/testimonials-with-marquee) and its [testimonial section guide](https://mcp.21st.dev/blog/react-testimonial-section-components), implemented locally using existing components and CSS. It adds no animation-library dependency. Featured stories advance only through user actions; labeled arrows and selection buttons have 44px touch targets and work with the keyboard. A persistent polite status region announces the author and quote, while the visible figure caption stays a direct child of the figure. Story transitions respect reduced-motion settings. Passive review cards do not animate or glow on hover.

Review data lives in `components/landing/reviews-data.ts`. Names, developer roles, quotes, and star ratings are illustrative, visibly labeled **Sample reviews · fictional profiles**. Portraits are locally served stock photos; see `public/images/community/README.md`. Replace the data with consented, verified student feedback before presenting the section as actual endorsements. Do not attach structured-data ratings or claim learner counts to the sample content.

`LearningFaq` uses the reusable `Faq` with six product questions. Keep answers aligned with implemented access, account, preview, and enrollment behavior. On mobile, the intro and disclosures stack; regular application FAQ text uses readable 13–14px type.

The Open Graph image uses bundled Geist, the midnight palette, and the horizon. `app/icon.svg` is the editable star-mark source; `app/favicon.ico` contains 16px, 32px, and 48px versions of the same mark. Both are served through Next.js metadata file conventions.

## Extending the system

1. Reuse primitives and semantic tokens first.
2. Put new reusable UI in `components/ui/`, domain components alongside existing course/lesson components, and page-specific decoration in CSS Modules.
3. Add any new semantic token to both themes and document its purpose here.
4. Check narrow mobile widths, both themes, keyboard focus, empty/locked/error states, and reduced motion.
5. Read the installed Next.js guides in `node_modules/next/dist/docs/` before changing routing, rendering, or framework APIs.

## Creator Studio

`components/admin/studio.module.css` extends Horizon with a framed workspace, persistent desktop navigation, wrapped mobile navigation, a course library, and quiet authoring panels. It uses the existing semantic palette, radii, Geist typography, Button, Badge, and managed private-image component. The introductory course panel carries the one restrained blue horizon effect.

`StudioDashboard` presents database-backed counts and course inventory; `StudioCourseLibrary` handles local search, status filters, and sorting. `NewCourseDialog` uses Radix for focus trapping, Escape dismissal, and returning focus. The course editor uses keyboard-operable details/trailer/curriculum/publishing tabs, draft-change warnings, and an explicit publishing checklist. The media library exposes image/video/resource uploads and video readiness verification. Destructive buttons pair their fill with theme-aware primary foreground text to preserve dark-theme contrast.

See [Studio design notes](../design/studio-ui.md) and [preview evidence](../design/previews/README.md). Preview course names are test fixtures; they are absent from the production catalog and Studio data.

The Trailer tab uses the same authoring panels, private uploader, verification control, and video player. Draft and published trailers are separate; upload completion does not publish a video. A quiet status panel identifies the live video, while preview/publish/clear actions stay with the saved draft. Tabs and actions wrap at narrow widths.
