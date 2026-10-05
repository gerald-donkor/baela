# Baela — Product and Implementation Plan

**Updated:** 2026-10-05  
**Status:** Core v1 implemented and locally validated; external-service acceptance and production launch gates remain open.

This is the maintained plan for Baela. It consolidates the agreed product requirements, the implementation already completed, and the remaining release work. It is not a verbatim copy of a missing historical plan.

Read this file alongside [current implementation evidence](docs/implementation-status.md), [setup instructions](README.md), [launch acceptance](docs/launch.md), and [operations](docs/operations.md). The [handoff](handoff/README.md) preserves an earlier checkpoint; its older test counts, unresolved choices, and source hashes do not describe the latest implementation.

## 1. Product objective and scope

Build a course platform owned and operated by one creator. The creator is the only instructor and administrator; everyone else is a student. Students discover courses, preview lessons, sign up, purchase access, and learn at their own pace across devices.

The primary flows are:

1. Visitor → catalog → course sales page → free preview → signup/sign-in → checkout.
2. Verified Polar webhook → entitlement → student dashboard → lesson playback and progress.
3. Returning student → continue watching → resume video → complete lessons.
4. Instructor → draft course/sections/lessons → upload and verify media → preview → publish.
5. Student → Polar billing portal, refund request, or account deletion.

### Confirmed scope decisions

The newer implementation checkpoint records that the user supplied the original plan and resolved the earlier handoff ambiguities:

- Google, GitHub, and email/password sign-in are in v1.
- Account deletion is self-service with recent authentication and confirmed renewal cancellation.
- Cumulative full refunds revoke the affected purchase source; partial refunds retain access.
- YouTube-like offline viewing is v2, not a v1 attachment-download feature.
- The former $100/month ceiling is withdrawn. Actual service costs still need confirmation.

Do not reopen these as unanswered interview questions solely because historical handoff files predate those resolutions.

### V1 exclusions

No gamification, forum, native mobile app, live streaming, multiple instructors, multiple languages, custom invoices, custom payment-method UI, AI tutor, or offline video library. Future features are listed in section 12.

## 2. Technology and service ownership

Preserve the selected stack. Do not substitute providers or frameworks without an explicit decision.

| Layer              | Technology                                   | Responsibility                                                                                    |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Application        | Next.js App Router + TypeScript              | Server-rendered pages, application backend, Server Actions, HTTP routes, job handlers             |
| UI                 | shadcn-style Radix components + Tailwind CSS | Responsive accessible controls, light/dark theme                                                  |
| Data access        | Drizzle ORM                                  | Typed queries, transactions, schema and migrations                                                |
| Database           | Neon Postgres                                | Application data, entitlements, progress, event inbox and job queue                               |
| Identity           | Managed Neon Auth                            | Google/GitHub/email authentication, sessions, verification and password recovery                  |
| Media              | ImageKit                                     | Private browser uploads, images/video delivery, signed URLs and adaptive streaming                |
| Commerce           | Polar                                        | Checkout, products/prices, subscriptions, receipts, refunds, customer billing portal and webhooks |
| Monitoring         | Sentry                                       | Errors, sampled performance telemetry and operational alerts                                      |
| Validation         | Zod                                          | Server-side request and provider-payload validation                                               |
| Editor/player      | Tiptap Markdown; HLS.js/native MP4           | Authoring and protected lesson playback                                                           |
| Quality            | Vitest, PGlite, Playwright                   | Domain/SQL tests, browser checks and regression protection                                        |
| Hosting/scheduling | Vercel configuration                         | Next deployment and minute-by-minute cron on an appropriate commercial plan                       |

Current pinned core versions include Next.js 16.3.8 and React 19.2.8. `package.json` and `package-lock.json` are authoritative. Before writing Next.js code, follow `AGENTS.md` and read the relevant installed documentation in `node_modules/next/dist/docs/`.

Neon provides Postgres and managed Auth; Next.js executes application business logic. No separate Neon AI backend is required for v1.

The ImageKit React player package did not support the pinned React peer range when attempted. The implementation retains ImageKit and uses HLS.js/native MP4 for playback. This compatibility choice must be validated with real private media before launch.

## 3. Pricing and entitlement rules

Launch prices are the original amounts divided by three, rounded to USD cents:

| Purchase          |                        Launch price | Access                                             |
| ----------------- | ----------------------------------: | -------------------------------------------------- |
| Individual course | $8.33 once; configurable per course | Permanent access to that course, including updates |
| Monthly           |                        $16.67/month | All courses during paid entitlement periods        |
| Lifetime          |                         $83.33 once | Every current and future course                    |

Polar owns actual product prices. Store product mappings and synchronized prices in Postgres; never trust a browser-supplied amount. Keep product IDs stable to preserve purchase history. Validate a single supported fixed USD price and the expected billing interval when connecting, updating, or checking out an offer.

### Access invariants

- A student may watch a published lesson if it is a preview, or they have a valid lifetime, monthly, or matching course grant.
- Course/lifetime purchases are permanent unless their source is revoked. Monthly grants have explicit paid start/end timestamps.
- Access is the union of independent sources. Revoking one source must not remove another valid purchase.
- Canceling monthly renewal retains access to the end of the paid period. No unpaid-renewal grace period is added by the app.
- Cumulative full refunds revoke the affected order grant. Partial refunds retain it.
- Lifetime purchase cancels monthly renewal without automatic proration or credit. Refunding lifetime does not restart monthly billing.
- All-access students do not see individual purchase buttons; the server independently prevents redundant purchases.
- Preview access includes the lesson video, written content, managed images and attachments.
- Multiple devices are allowed without a strict simultaneous-stream cap.
- Archived courses are removed from individual sale/catalog discovery while remaining accessible through valid grants, including all-access.

### Payment authority and reliability

- Verified Polar webhooks grant/revoke access; checkout redirects never do.
- A subscription status alone cannot create a paid grant.
- New monthly grants require the original `order.paid` period snapshot. Never infer an older payment's entitlement from a later canonical subscription period.
- Persist the webhook inbox and job atomically before acknowledging delivery. Deduplicate event IDs and source orders.
- Fetch canonical provider state for reconciliation, reject stale updates, and preserve monotonic refund totals.
- Reserve a checkout intent before remote creation. Recover ambiguous responses by `baela_intent_id` metadata instead of blindly repeating a POST.
- The success page checks the student's exact checkout and waits for its webhook-derived entitlement.
- Billing management stays in Polar's customer portal. Baela records refund requests/responses; money refunds are issued in Polar.

## 4. Pages, learning experience and design

### Public pages

- `/`: responsive landing page, published course collection, three pricing options.
- `/courses/[courseSlug]`: description, preview, price, full curriculum and entitlement-aware calls to action.
- Auth signup/sign-in/recovery/reset pages with safe return destinations.
- `/privacy`, `/terms`, `/refund-policy`, `/support`.
- Metadata, canonical course URLs, sitemap, robots rules and Open Graph image.

Do not invent course inventory or testimonials. An unconfigured or empty platform shows honest empty states and closed enrollment. Real policy text and support details must be supplied before launch.

### Student pages

- `/dashboard`: purchased/started courses, continue watching, progress, and available all-access courses.
- `/learn/[courseSlug]/[lessonId]`: video, Markdown, managed images, resources, curriculum and previous/next navigation.
- `/account`: profile, Polar portal, refund requests/status, self-service deletion.
- `/checkout/success`: bounded pending confirmation and manual retry.

Save playback position and watched intervals across devices. Automatically mark complete at 95% unique watched duration, and allow manual completion/undo. Seeking alone is not watching. An explicit undo suppresses automatic recompletion. Course percentage uses the current published lesson count; adding lessons can reduce it.

Desktop uses a curriculum sidebar; mobile uses a focus-trapped drawer with locked/completed indicators. Lesson order is not enforced. Preserve progress when access expires and direct the student to regain access.

### Design and interaction requirements

- Clean, understated Baela branding with light/dark preference saved across visits.
- Responsive desktop/tablet/phone layout; keyboard-accessible navigation and forms.
- Clear loading, empty, locked, pending, validation-error and retry states.
- No horizontal overflow in supported layouts.
- Safe Markdown rendering, no arbitrary raw HTML/MDX execution.
- Error messages must be useful without exposing secrets or internal provider responses.

## 5. Instructor workflow

Studio is available only to the immutable configured instructor identity, checked on the server for every private page and mutation.

- Create/edit courses, sections and lessons.
- Save immutable lesson drafts, privately preview them, and publish explicitly.
- Course/section metadata and order update immediately; the editor must state this distinction from lesson draft publication.
- Author through visual Tiptap, Markdown source, and rendered preview. Preserve semantic round trips for headings, emphasis, links, lists, quotes, code, tables and managed images.
- Upload private videos/images/resources directly from the browser to ImageKit, with progress and recoverable errors.
- Verify source metadata and streaming readiness before publishing videos; do not let retired lessons satisfy publication requirements.
- Reorder sections/lessons with pointer and keyboard support.
- Archive previously published/sold courses and retire published lessons. Permanently delete only eligible unsold, never-published drafts.
- Show students and the specific courses/access sources they own, with bounded pagination.
- Review/respond to refund requests; issue money refunds externally in Polar.
- Configure public instructor/support and business details, legal text, and offer mappings.
- Inspect failed jobs, fix their cause, and retry through Studio.

## 6. Data model, state and boundaries

The 18 application tables are defined in `lib/db/schema.ts`:

| Area          | Tables and purpose                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Identity      | `app_users`: immutable external identity mapping, profile, active/deleting/deleted state                                    |
| Content       | `courses`, `sections`, `lessons`, `lesson_revisions`: ordered curriculum, stable lesson IDs, immutable drafts/live pointers |
| Media         | `assets`: ImageKit IDs/paths, kind, size, duration, source height, readiness/privacy                                        |
| Commerce      | `offers`, `orders`, `subscriptions`, `entitlements`: provider mappings, history and independent grants                      |
| Learning      | `lesson_progress`, `playback_sessions`: resume/watched/completion state, ownership and sequence protection                  |
| Support       | `refund_requests`: purchase-bound requests, status and instructor responses                                                 |
| Operations    | `webhook_events`, `jobs`, `checkout_intents`, `rate_limits`: durable processing, retries and abuse control                  |
| Configuration | `settings`: business/public profile and policy content                                                                      |

Use Drizzle transactions and appropriate locks for authoring order, purchases, deletion state and progress updates. Client input cannot choose identity, permissions or price. Playback writes must match the student's lesson/session and reject stale sequence numbers.

Server components read through server-only services. Admin/account forms use authenticated Server Actions backed by shared validation/authorization; HTTP endpoints reuse those services where needed. Public catalog data uses tagged caching. Private content, entitlements, provider credentials and signed URLs must never enter a shared public cache.

Use local client state for editing/player interactions and URL state for routing/return destinations/pagination. No realtime service is required for v1; payment status uses bounded polling.

Current migrations:

1. `0000_illegal_betty_ross.sql`: base schema.
2. `0001_crazy_krista_starr.sql`: exact checkout/order association.
3. `0002_perfect_newton_destine.sql`: source video height and managed revision-image references.

Apply reviewed migrations to isolated Neon before production. Reverify existing video assets after migration 0002 to populate height. Application migrations must not alter managed Auth's internal tables.

## 7. Media protection and delivery

- Keep paid source objects private. Registration verifies provider metadata, private status, folder and allowed file constraints.
- Sign only media that belongs to the authorized published revision, or an explicitly authorized instructor draft/editor preview.
- Use short-lived URLs, normally at most five minutes and capped by the student's access expiry.
- Authorize/sign HLS manifests and segments; restrict origin, source path, query parameters and transformations.
- Cap HLS resolutions by verified source height. Below 360p or without verified height, use signed MP4 rather than upscaling.
- Renew playback URLs and preserve position while handling backgrounding, expiry, seeking and network recovery.
- Store managed inline images by stable asset ID, not permanent public URL.
- Current upload caps: 2 GB MP4 video, 10 MB JPEG/PNG/WebP images, 50 MB PDF/ZIP/PPTX resources, subject to provider limits.

Signed URLs are temporary bearer credentials, not DRM. They do not prevent screen recording or all copying. Offline storage/service workers/DRM are absent in v1.

## 8. Account lifecycle, security and operations

### Account deletion

1. Require recent sign-in and explicit confirmation; protect the sole admin from self-deletion.
2. Mark the student deleting and prevent new learning/purchase mutations.
3. Find all remote subscriptions, including paginated or locally delayed ones, and confirm renewal cancellation.
4. Defer while local ambiguous checkout intents or remote pending checkouts can still settle.
5. Delete the managed identity through the correct project/branch-scoped Neon API.
6. Only after confirmed deletion, remove learning data, pseudonymize retained records and revoke grants.
7. Retain restricted tombstones so late webhooks cannot recreate access; late subscriptions trigger cancellation.

Failures remain pending/retryable. An ambiguous response or Neon 404 is not proof of confirmed deletion; require operator reconciliation. Deletion does not automatically refund purchases.

### Background processing

Persist webhook, cancellation and deletion jobs with unique keys, leases, attempt counts and retry schedules. External work shares a 45-second invocation budget within 60-second handlers. Retry failures with backoff, distinguish harmless pending-checkout deferral, and flag terminal failures in Sentry/Studio. Observe real database latency and provider behavior in staging.

Schedule cron every minute using an authenticated secret and a hosting plan supporting commercial use and the required frequency. Keep provider keys server-only and isolate environments.

### Security/privacy and observability

- Server-side authorization and ownership checks at every boundary.
- Signed webhook verification before persistence/processing.
- Input validation, origin protection and rate limiting appropriate to mutations/media.
- Safe Markdown and managed asset references; no execution of authored content.
- Scrub sensitive request/user/URL data from telemetry; inspect real Sentry events before launch.
- Alert on delivery failures, terminal jobs, scheduler failure, aged pending jobs and provider usage.
- Strip old processed webhook payloads and expire temporary operational records according to the documented cleanup policy.
- Establish jurisdiction-appropriate transaction/tombstone retention and access restrictions before public launch.
- Enable backups/PITR and rehearse restore/reconciliation without destroying purchase history or archived media.

## 9. Delivery phases and current progress

A checked implementation task means code exists; it does not imply that its external service has passed acceptance.

### Phase 1 — Foundation and data layer

- [x] Configure Next.js/TypeScript/UI foundation, formatting and repository documentation.
- [x] Implement Drizzle→Neon application schema and migrations.
- [x] Add service configuration templates and server-only boundaries.
- [x] Establish test/build commands and CI workflow.
- [ ] Apply migrations to isolated Neon and validate transactional behavior against the real service.

### Phase 2 — Identity and access

- [x] Implement managed auth UI/proxy, immutable admin role, page/action/API guards.
- [x] Implement independently revocable entitlements and lesson ownership checks.
- [x] Implement recent-auth self-service deletion with durable reconciliation.
- [ ] Validate actual OAuth/email verification/recovery/linking/session expiry and branch-scoped deletion.
- [ ] Verify configured private pages render dynamically without shared-cache leaks.

### Phase 3 — Commerce and jobs

- [x] Implement product mapping/validation and entitlement-aware checkout.
- [x] Implement signed webhook inbox, original paid snapshots, durable jobs and refunds/cancel/upgrade rules.
- [x] Implement checkout ambiguity recovery and exact-checkout confirmation.
- [x] Implement billing portal, refund request workflow and job operations screen.
- [ ] Exercise all rules with real Polar sandbox events, including taxes, partial/full refunds and deletion races.
- [ ] Measure normal webhook acknowledgment under two seconds and validate scheduler/job alerting.

### Phase 4 — Content and instructor tools

- [x] Implement course/section/lesson editing, ordering, drafts/live publication and archival protections.
- [x] Implement visual/Markdown/preview editor with managed images and semantic tests.
- [x] Implement browser media uploads/readiness checks and safe cover changes.
- [x] Implement student ownership, public profile, legal/business settings and refund administration.
- [ ] Complete authenticated browser acceptance for real uploads, preview, reorder, publish, retirement and errors.

### Phase 5 — Learning and public experience

- [x] Implement catalog/pricing/sales, protected player and lesson content/resources.
- [x] Implement progress/resume, dashboard, bounded checkout polling and account flows.
- [x] Implement responsive curriculum navigation and light/dark theme.
- [x] Implement SEO/metadata, explicit legal/support routes and real 404 behavior.
- [ ] Validate actual private ImageKit HLS paths, transformations, expiry and long playback.
- [ ] Test current Chrome, Firefox, Edge, Safari and real iOS/Android devices, including slow networks.

### Phase 6 — Quality and release readiness

- [x] Run local lint/types/domain/SQL/Markdown/auth/job tests.
- [x] Build production application with webpack in this environment.
- [x] Run desktop/mobile Chromium and Firefox public browser checks; inspect screenshots.
- [x] Run dependency audit and record unresolved findings.
- [x] Run launch verifier and document expected missing-configuration failures.
- [ ] Complete WebKit/Safari acceptance on a host with compatible libraries.
- [ ] Observe CI with installed browser OS dependencies and default build on its actual runner.
- [ ] Run the planned 25-viewer concurrency exercise and establish measured performance/cost thresholds.
- [ ] Complete live-service, policy, backup, monitoring and operational acceptance before public launch.

## 10. Validation evidence and release acceptance

The latest recorded execution evidence is in [the continuation checkpoint](docs/implementation-status.md). These checks were not rerun merely to create this plan.

| Check                                            | Latest recorded result                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `npm run check`                                  | Passed: lint, generated routes, TypeScript, **69 tests across five files**                                |
| `npm run build -- --webpack`                     | Passed: compilation, types, generation and traces                                                         |
| Desktop/mobile/Firefox Playwright                | **18 passed** against the production build                                                                |
| Public screenshots                               | Desktop/mobile light/dark inspected; saved examples in `docs/validation/`                                 |
| Local WebKit                                     | Five browser cases blocked before execution by missing host libraries; one API-only case passed           |
| `npm run verify:launch`                          | Executed and failed for absent credentials/origin/secrets/legal approval, as expected                     |
| Dependency audit                                 | Four moderate findings in the Drizzle Kit/esbuild loader chain; zero high/critical in that recorded audit |
| Default Turbopack build                          | Local worker-port restriction remains; webpack used for local verification                                |
| Remote deploy/migrations/live service acceptance | Not completed                                                                                             |

PGlite and mocked-provider tests do not certify Neon connectivity or actual payment/video/auth behavior. Anonymous browser checks do not certify authenticated authoring or purchasing. Emulated mobile Chromium is not an iOS/Android device test.

### Definition of done for public v1

- [ ] Isolated development/staging/production services are configured with correct origins and scoped credentials.
- [ ] All three purchase types work end to end; access follows only verified payment events.
- [ ] Duplicates, delayed events, full/partial refunds, cancellation, renewal failures, upgrades and overlapping grants pass sandbox acceptance.
- [ ] Anonymous previews work; unauthorized bodies/assets/admin data remain inaccessible.
- [ ] Live authoring, private images/resources, draft/live isolation and media publication pass acceptance.
- [ ] Long playback, URL expiry, resume, completion/undo and current published percentages work across required browsers/devices.
- [ ] Deletion confirms renewal cancellation and identity removal, handles ambiguous failures, and survives late events safely.
- [ ] Error reporting, scheduler/queue alerts, support procedures and backup restore have been exercised.
- [ ] Reviewed policies, seller approval, actual content, domain and support contact are present; production legal gate enabled afterward.
- [ ] Performance and service spending have been measured against expected usage.
- [ ] Final required tests/build/browser/launch checks are recorded with remaining risks explicitly accepted or resolved.

## 11. Remaining inputs, assumptions and risks

### Inputs still needed for release

Actual teaching subject/audience, course content, instructor details, seller country and business status, Polar approval, domain/support mailbox, reviewed legal/refund/retention text, service credentials and production budget.

Do not infer seller country from machine timezone or invent course content from the developer stack.

### Planning assumptions to validate

Initial planning used roughly three courses, 10–15 hours of video, 100–300 students in the first three months, 25 simultaneous viewers and a provisional 6–8 week delivery target. These are sizing assumptions, not measured demand or a new deadline commitment. Historical vendor prices are not current quotations; confirm actual plans, processing and bandwidth before spending.

### Open release risks

1. Private HLS manifest/segment formats and transformations have not been observed against the configured ImageKit account. Keep signing closed to unknown paths until verified.
2. OAuth/email and branch-scoped deletion behavior still require the actual Neon environment, particularly ambiguous deletion/404 recovery.
3. Polar paid-event snapshots, tax/refund amounts, delayed deliveries and account-deletion races still need live sandbox fixtures.
4. The recorded audit has unresolved moderate transitive esbuild development-server advisories; track remediation without forced incompatible downgrades or unjustified overrides.
5. WebKit host dependencies and real Safari/Edge/device media acceptance remain incomplete.
6. Serverless runtime/database latency, webhook latency, concurrent video delivery and provider costs need staging measurement.
7. Legal text, eligibility, retention, provider limits, alerts and backup recovery cannot be established by code alone.

Use [operations](docs/operations.md) for failed jobs, ambiguous checkouts, deletion reconciliation and rollback. Do not manually invent entitlements or mark unresolved jobs complete.

## 12. V2 roadmap and extension points

These items are planned future work, not current completion claims:

| Feature                       | Intended approach / boundary                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| YouTube-like offline library  | Browser-managed downloads, manifests, entitlement refresh, expiry/eviction and storage handling; no paid DRM dependency assumed; not DRM-equivalent or cost-free hosting |
| Discord/private GitHub access | Polar Benefits tied to stable products and customer identity                                                                                                             |
| Discounts/course bundles      | Polar-native features with explicit entitlement/product rules                                                                                                            |
| Lesson Q&A                    | Stable lesson/student IDs; instructor replies visibly identified                                                                                                         |
| Completion certificates       | Shareable records based on defined completion/version rules                                                                                                              |
| Transcripts/captions/search   | Versioned lesson transcript/caption data and accessible search                                                                                                           |
| AI tutor                      | Transcript-grounded responses, authorization, usage limits and a separately chosen AI integration                                                                        |
| Welcome/announcement email    | Explicit email provider, consent/unsubscribe and durable delivery; Polar remains receipts provider                                                                       |
| Coming-soon/waitlists         | Separate public course state and opt-in collection                                                                                                                       |
| Learning analytics            | Completion/drop-off events with privacy boundaries; revenue remains Polar dashboard                                                                                      |

Stable lesson IDs, immutable revisions, provider mappings and per-order grants support these additions. Do not prebuild unrelated services or treat extension points as completed features.

## 13. How to maintain this plan

- Update the date, task status and evidence links after a meaningful change or validation run.
- Keep implementation completion separate from live-service acceptance.
- When decisions change, update this plan and current implementation status; preserve the historical handoff as history.
- Record exact test outcomes and environment limitations, including failures. Do not carry forward old “not run” statements after verified results exist.
- Preserve the chosen stack and read version-matched documentation before implementation edits.
- Keep secrets out of this file and the handoff; document variable names and responsibilities only.
- Next work should start with isolated service configuration and the remaining release gates in sections 9–11, not rebuilding the already completed application.
