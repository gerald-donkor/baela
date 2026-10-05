# Exact configuration, routes, limits and runtime details

This describes the current working tree, not a new specification. Source links and the manifest allow verification. Later edits must update the docs when behavior changes.

## Environment variables — names only

| Name                              | Ownership / effect                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| NEXT_PUBLIC_APP_URL               | Public canonical origin, origin checks, provider return URLs; defaults localhost:3000 in code |
| DATABASE_URL                      | Server-only Neon Postgres URL; separate environment databases                                 |
| NEON_AUTH_BASE_URL                | Managed Auth base URL; absent disables public sign-in UI/session lookup                       |
| NEON_AUTH_COOKIE_SECRET           | Server-only cookie secret; also contributes to hashed anonymous rate keys                     |
| ADMIN_AUTH_USER_ID                | Sole immutable instructor identity ID; never chosen by signup input                           |
| NEON_API_KEY                      | Server-only management key for deletion; project-scoped                                       |
| NEON_PROJECT_ID                   | Deletion management endpoint project                                                          |
| POLAR_ACCESS_TOKEN                | Server-only API credential                                                                    |
| POLAR_WEBHOOK_SECRET              | Server-only Standard Webhooks signature secret                                                |
| POLAR_SERVER                      | Exactly `production` chooses production API; other values choose sandbox; template `sandbox`  |
| IMAGEKIT_PRIVATE_KEY              | Server-only signing/metadata API credential                                                   |
| NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY   | Browser direct-upload public key                                                              |
| NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT | Allowed delivery endpoint and signing base                                                    |
| CRON_SECRET                       | Server-only bearer for scheduler; launch script asks32+ characters                            |
| NEXT_PUBLIC_SENTRY_DSN            | Error/performance reporting; unset disables initialization                                    |
| SENTRY_AUTH_TOKEN                 | Build-time source-map upload token; absent disables upload sourcemaps                         |
| SENTRY_ORG / SENTRY_PROJECT       | Sentry build integration identifiers                                                          |
| NEXT_PUBLIC_SUPPORT_EMAIL         | Public support mailto, separate from stored business support email                            |
| LEGAL_PAGES_APPROVED              | Production checkout blocked unless string`true`; template`false`                              |

Removed unused env placeholders: NEON_BRANCH_ID, POLAR_MONTHLY_PRODUCT_ID, POLAR_LIFETIME_PRODUCT_ID. Product IDs are persisted through admin offer mapping. `.env*` ignored except `.env.example`. Do not snapshot real env files. Public variables require rebuild when changed.

## Route surface

### Pages

| URL                                               | Behavior                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `/`                                               | Catalog/pricing/hero; empty state without data; catalog tag revalidate300s                          |
| `/courses/[courseSlug]`                           | Public published/archived sales page; drafts404; archived noindex/not individually sold             |
| `/learn/[courseSlug]/[lessonId]`                  | Published current lesson; anonymous preview or entitlement; locked CTA on403;404 on bad lesson/slug |
| `/auth/sign-in`, `/auth/sign-up`                  | Managed login/signup UI; Google/GitHub/email; closed message without Auth base                      |
| `/auth/forgot-password`, `/auth/reset-password`   | Managed recovery/reset token flow                                                                   |
| `/dashboard`                                      | Signed-in student learning; deleting user redirects account                                         |
| `/account`                                        | Profile, portal, refund requests, deletion controls; deleting state visible                         |
| `/checkout/success?checkout_id=…`                 | Polls own exact checkout's webhook-derived grant; never creates grants                              |
| `/admin`                                          | Courses/create form                                                                                 |
| `/admin/courses/[id]`                             | Course metadata/products/curriculum/editor/media                                                    |
| `/admin/preview/[id]`                             | Admin saved draft video/content preview                                                             |
| `/admin/users?page=…`                             | Read-only50 students/page and grant kinds                                                           |
| `/admin/refunds`                                  | Latest100 requests/respond/decline; money handled externally                                        |
| `/admin/settings`                                 | Business fields, monthly/lifetime mappings, legal policy editors                                    |
| `/admin/jobs`                                     | Up to100 incomplete jobs, failed retries                                                            |
| `/privacy`, `/terms`, `/refund-policy`            | Markdown policy from settings; placeholder until supplied                                           |
| `/support`                                        | Env-configured mailto or placeholder                                                                |
| `/robots.txt`, `/sitemap.xml`, `/opengraph-image` | Search metadata assets                                                                              |

Header: brand, courses, pricing, theme; signed-in My learning/Account, admin Studio link. Footer links support/policies. Root has skip-to-main; native form labels/status alerts used. No automated accessibility audit yet. Sitemap includes home and published courses, not archived/private routes. Robots disallows admin/account/dashboard/learn/auth/api/checkout; robots is not authorization.

### APIs and request contracts

All application mutation routes use same-origin checks, except externally signed webhook/Auth proxy. `endpoint()` returns JSON and sets private/no-store on successful app responses. Expected errors are HttpError status/message or Zod400; unexpected errors go to Sentry and generic500. Error paths do not uniformly apply no-store. Missing/malformed JSON handling is not independently tested.

| Endpoint              | Method / input                                                      | Boundary/result                                                                                                      |
| --------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/api/auth/[...path]` | GET/POST delegated request/context                                  | Neon handler; configured cookies/session; unavailable config handled by wrapper                                      |
| `/api/webhooks/polar` | POST raw signed payload                                             | Max1,000,000 characters after read; validate SDK before persistence; inbox+job transaction;202; invalid signature403 |
| `/api/cron`           | GET bearer                                                          | 401 if unauthorized; processes jobs/retention; node timing-safe compare; maxDuration60                               |
| `/api/checkout`       | POST `{offerId:UUID}`                                               | Active verified user; rate10/min; product/ownership/current-price checks; reservation/recovery; `{url}`              |
| `/api/account`        | GET `checkout_id`                                                   | Must own matching intent; ready only for matching order grant with current start/end and no revocation               |
| `/api/account`        | POST `{action:'portal'}`                                            | Polar customer-session URL by internal user external ID                                                              |
| `/api/account`        | POST `{action:'refund',orderId,reason}`                             | Own paid not-fully-refunded order; reason10–2000; unique pending request                                             |
| `/api/account`        | POST `{action:'delete',confirmation:'DELETE'}`                      | Nonadmin; auth-session creation≤10min; mark deleting/enqueue; `{pending:true}`                                       |
| `/api/media/sign`     | POST `{lessonId,assetId?,url?,hls?,draft?}`                         | UUID IDs; current published access or explicit admin draft; allowed lesson asset only; `{url,expiresIn,duration}`    |
| `/api/covers/[id]`    | GET                                                                 | Valid UUID, non-draft course, ready image;302 signed URL/no-store; otherwise404                                      |
| `/api/progress`       | POST `{lessonId}`                                                   | Active user/lesson access; creates own playback session token                                                        |
| `/api/progress`       | POST `{lessonId,sessionId,sequence,position?,intervals?,complete?}` | Owned session/lesson; sequence monotonic; stale returns saved/stale; result saved/completed                          |
| `/api/admin/uploads`  | POST `{action:'authorize'}`                                         | Admin-only ImageKit upload params300s +public key                                                                    |
| `/api/admin/uploads`  | POST `{action:'register',fileId,kind}`                              | Verify provider metadata/private/folder/extension/size; register asset                                               |
| `/api/admin/uploads`  | POST `{action:'verify',id:UUID}`                                    | Refresh duration and fetch HLS manifest;202 pending; ready only verified                                             |
| `/api/admin`          | POST discriminated commands below                                   | Admin guard +authoring advisory transaction lock; revalidate catalog after action                                    |

### Admin commands

- `course`: optional id; title1–180 trimmed; slug≤100 lowercase alphanumeric/hyphen; summary≤300; description≤20,000; optional nullable coverId. Existing verified image required for cover.
- `course-status`: id, published/archived only. Publish requires a published lesson and active mapped course offer. No return-to-draft command for live courses.
- `delete-course`: id; only draft, never-published, no purchase history. Removes unsold offer before deletion. FK cascades course→sections→lessons→revisions.
- `section`: optional id, courseId, title. `delete-section`: id; blocks any section containing published-revision lessons.
- `lesson`: optional id, sectionId, title, Markdown≤150,000, nullable videoId, preview boolean, up to30 attachment IDs. Creates new immutable revision; updates draft pointer only.
- `publish-lesson`: id; saved draft video required; all referenced assets exist/private/ready; video kind and duration>0; sets live pointer, clears retirement.
- `retire-lesson`: id; published rows get retired timestamp; never-published row deleted.
- `reorder`: sections/lessons, parentId, full ID array1–500. Reject duplicates/missing/foreign siblings, then set positions.
- `offer`: course/monthly/lifetime, nullable courseId, productId. Server fetch/validate active fixed USD product; monthly every1month; other kinds nonrecurring. Existing mapped product cannot be replaced with different ID.
- `refund-response`: request id, trimmed response1–2000, decline boolean; only pending records. Saving response alone does not refund or approve money transfer.
- `business`: seller name/instructor1–180, country2 characters, individual/business, email. API validates length only for country; UI uppercase pattern more restrictive.
- `policy`: privacy/terms/refund-policy, Markdown50–50,000. Publishes immediately as settings value.
- `retry-job`: failed unfinished job ID; clears failure/lease lock, resets attempts0/run-now. Cron executes it; action does not process synchronously.

## Timings, limits, semantics

| Setting                      | Current value                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------- |
| Price source                 | Live Polar product mapping; launch placeholders833/1667/8333 cents               |
| Currency                     | USD offers; order records keep provider currency                                 |
| Catalog cache                | 300s with `catalog` tag; admin/product jobs revalidate with `max`                |
| Auth session-data cache      | 60s; DB state consulted on getViewer                                             |
| Neon local Pool size         | max2; closes in finally per withDb                                               |
| Media URL/signature TTL      | ≤300s, minimum1s; capped by access period end                                    |
| Upload auth validity         | 300s relative lifetime in installed ImageKit helper                              |
| ImageKit readiness timeout   | 20s                                                                              |
| Provider/Neon delete timeout | 15s per request                                                                  |
| Rate windows                 | 60s default; checkout10; media600 per user or daily hashed IP                    |
| Video upload                 | 2,000,000,000 bytes, MP4 only                                                    |
| Image upload                 | 10,000,000 bytes; JPG/JPEG/PNG/WebP                                              |
| Attachment upload            | 50,000,000 bytes; PDF/ZIP/PPTX                                                   |
| Media folder                 | `/baela/{video                                                                   | image | attachment}`; server requires `/baela/` prefix |
| HLS ladder                   | `sr-360_480_720_1080`; source height not stored                                  |
| HLS buffer                   | 30s                                                                              |
| MP4 renewal                  | 240s                                                                             |
| Progress persistence         | Every15s, pause, visibility-hidden, effect cleanup, manual mark                  |
| Watch interval acceptance    | Consecutive playback time delta<5s; no seeking/paused; merged client/server      |
| Interval merge tolerance     | 0.25s gap; invalid/reversed ranges dropped and duration-clamped                  |
| Auto-complete                | ≥95% unique merged duration; manual incomplete suppresses future auto-completion |
| Progress input               | Position0–86,400s;≤500 interval pairs; nonnegative integer sequence              |
| Percentage                   | Rounded completed/current published count, max100; zero lessons yields0          |
| Checkout reservation         | 24h before provider outcome; use provider expires_at once recovered              |
| Success polling              | 3s; slow message after60s; continues polling even when ready/slow                |
| Deletion reauth              | Session created within10min; admin deletion prohibited                           |
| Worker batch                 | Default10 jobs;45s loop deadline; webhook after hook3; account after hook2       |
| Job lease                    | 120s with UUID lease ownership                                                   |
| Retry schedule               | `min(3600, 2**attempts * 15)` seconds; max10 failed attempts                     |
| Pending deletion defer       | 60s; does not consume attempt budget                                             |
| Retention cleanup            | 30days processed payloads/completed jobs/session tokens; expired rate buckets    |
| Sentry tracing               | 0.1 sample rate when DSN enabled                                                 |

Access evaluation first rejects unpublished, then preview, then valid lifetime/course/monthly (start≤now and end>now, unrevoked). Permanent sources preferred; longest matching monthly end chosen. Archive counts as non-draft for learning. A future all-access buyer can access archived courses under current logic. Completion is client-reported evidence; no proctoring/certificate-grade integrity guarantee.

## Source-level caveats found in handoff audit

1. **Confirmed browser-test selector mismatch:** `tests/e2e/public.spec.ts` looks for theme button name `/theme|mode/i`, but `components/theme-toggle.tsx` aria-label is `Toggle light and dark appearance`. That test will not locate the button. Fix the test to the actual accessible label when implementation resumes, then run it. No browser execution was attempted in this documentation audit.
2. **Uploader async callback is not awaited:** Uploader types onUpload as returning void and calls it synchronously. Course cover passes an async command callback; its rejection can escape uploader catch/status handling. Include in implementation review.
3. **Auth profile sync:** current getViewer inserts once/on-conflict-do-nothing, then reads stored name/email. This protects deletion tombstones but does not update active profile after provider name/email changes. No profile editing UI is present. Never fix by unconditionally overwriting deleted rows.
4. **First progress record:** creating a playback session alone does not insert progress; a course appears as started after first save or direct course grant. Short visits may not appear immediately.
5. **Course slug edits:** allowed without redirect history; old shared links can404. Decide whether to freeze after publication or maintain redirects if product needs it.
6. **Archived direct links:** sales page remains public with noindex even for nonowners; preview lessons remain public. It is removed from catalog and individual sale, not entirely hidden.
7. **DB refs/checks:** revision pointers, cover/preview IDs, JSON attachment IDs are not all FK-enforced; text enums are mostly TypeScript only. Sole admin plus command validation is current boundary.
8. **Global authoring lock:** serializes all instructor commands, including remote product fetch. Good simplicity at one instructor, but external delays hold transaction/connection. Do not generalize scalability claims.
9. **Unconfigured site is not a demo backend:** signin disabled; public pages empty. Direct authenticated mutations may return auth/config errors. No seed/fake user/preview database included.
10. **No automated legal policy authoring:** user supplies reviewed text; placeholder is intentional. Setting approval env does not by itself prove policy quality or compliance.
11. **No CSP/HSTS authored in app:** current headers are nosniff, strict-origin-when-cross-origin Referrer-Policy, SAMEORIGIN X-Frame-Options. Host-level security settings remain to verify.
12. **Dev-install advisories/allowScripts:** npm output reported4 moderate advisories and install scripts awaiting approval for esbuild variants/core-js/unrs-resolver. Build/tests succeeded; no audit diagnosis or install-script approval sweep was completed. Do not run force fixes indiscriminately.
