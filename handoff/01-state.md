# Product decisions and implementation state

## Product and authorization

Baela is a creator's own course platform. One instructor/admin; everyone else is a student. The user explicitly selected Next.js + TypeScript + shadcn UI, Drizzle talking to Neon Postgres, Neon Auth, ImageKit media, Polar commerce/webhooks/customer portal, and Sentry. Do not replace these technologies silently.

The user first requested an interview, then approved an implementation plan and said to implement it. The original detailed plan is not present as a standalone document in the starting repository. Some decisions below were preserved in the prior session's compacted working context; distinguish those from the visible initial request if the user corrects a detail. Do not reopen the whole interview.

### Prices and access

User reduced the original $25 / $50 / $250 to one third. Implemented cent-rounded launch prices:

| Product  |                    USD price | Access                                    |
| -------- | ---------------------------: | ----------------------------------------- |
| Course   | $8.33, configurable in Polar | Permanent course access including updates |
| Monthly  |                 $16.67/month | All courses during paid periods           |
| Lifetime |                  $83.33 once | All current/future courses                |

Access is allowed when the lesson is preview OR student has lifetime OR current paid monthly period OR that course purchase. Admin is server-authorized separately. All-access students should not see individual buy buttons. Canceled subscriptions retain paid access to period end. Lifetime purchase cancels monthly renewal without proration or credit. Refunding lifetime does not restart monthly billing.

Current implementation treats a **cumulative full refund** as revocation of the affected order; partial refunds retain its grant. Independent grants survive. This detail came from the carried working context; the initial user wording was simply “a refund removes access.” If challenged, clarify this distinction instead of concealing it.

Polar webhooks are the source of truth. Success redirects and subscription status alone cannot grant paid access. Authenticated, verified students check out. No trial or discount entry in v1.

### Student/admin scope

- Course → Sections → Lessons. Videos, Markdown, downloadable PDF/ZIP/PPTX resources, per-lesson free preview.
- Landing catalog/pricing, course sales pages with full locked curriculum, lesson player/sidebar, dashboard, continue watching, progress/resume.
- 95% actual watched intervals can mark complete; manual complete/undo supported. Newly published lessons affect percentage. Multiple devices allowed without simultaneous-stream caps.
- Studio creates/edits courses, sections, lessons; reorders via drag and keyboard; direct browser uploads; saved draft revisions separate from live revisions; read-only students/ownership; refunds; settings; jobs.
- Published/sold courses archive rather than destructive deletion. Never-published unsold drafts may be deleted. Retired published lessons preserve history.
- Polar customer portal owns billing management. Refund request/status UI exists in Baela; actual refund is done manually in Polar.
- Current auth UI includes Google, GitHub, and verified email/password recovery. **Visible user explicitly requested Google + email/password; GitHub comes from carried working context.** It requires separate provider setup. Do not pretend it was independently verified with the user in this turn.
- Current account deletion is **self-service**, requiring recent sign-in and confirmed renewal cancellation, with durable pending state. **Visible earlier user selected the simpler recommended support-request deletion option, while the carried working context states a later self-service decision.** This discrepancy should be acknowledged if necessary; implementation reflects the carried later decision, not a new choice made in this turn.
- Responsive light/dark UI, saved theme preference, public SEO, protected content noindex.

### Deferred / uncertain scope

The user explicitly wants a YouTube-like download experience without a paid DRM dependency. The carried plan defers the offline library to v2. **It is not implemented.** Current download buttons are attachments only. README and launch docs say this explicitly. If the approved plan cannot be recovered and the user expected offline downloads now, this is an unresolved scope issue, not a completed feature.

Future: Polar Discord/GitHub Benefits, bundles/discounts, Q&A, certificates, captions/transcript search, AI lesson tutor, announcement/welcome email, waitlists, completion/drop-off analytics. Excluded: gamification, built-in forum, native app, live streaming, multiple instructors/languages, custom invoices.

Carried assumptions: initial 3 courses/10–15 hours; 100–300 students/25 concurrent; 6–8 weeks provisional. Seller country/type, actual subject/audience, domain, policy text and service onboarding remain unspecified. The app does not invent any of these. Budget/pricing estimates from earlier planning were provisional; do not repeat stale service prices as verified facts.

## Packages and runtime

Exact versions are in package.json/lockfile. Key versions: Next16.3.8, React19.2.8, Drizzle0.45.3, Neon serverless1.2.0, Neon Auth0.5.0-beta, Polar SDK1.0.2, ImageKit node7.12.1/next2.1.6, Sentry11.2.0, HLS.js1.7.3, Tiptap3.31.4, Vitest4.1.11, Playwright1.63.0.

- `@imagekit/video-player` was not installed because its React peer range excluded React19. HLS.js is the player wrapper; ImageKit remains storage/streaming. This was communicated during implementation.
- Geist font is installed locally (`geist/font/sans`) to avoid build-time Google Fonts access.
- Sentry11's config wrapper import is `@sentry/nextjs/config`. `beforeSendSpan` uses StreamedSpanJSON `name`/`attributes`, not older `description`/`data`/`op` fields.
- Polar SDK versioned validation: `import { webhooks } from '@polar-sh/sdk/2026-04'`, **await** `validateEvent`.
- Next route params are promises. Neon auth catch-all handlers receive request plus `{params: Promise<{path: string[]}>}`.
- Neon package install emits transitive better-auth UI peer warnings. Installation succeeds and typechecks; live auth remains untested. No forced peer overrides added.

## Schema / migrations

`lib/db/schema.ts` defines 18 tables. `lib/db/index.ts` is server-only, creates request-scoped Neon Pool + Drizzle using the ws driver, and closes the pool after the callback.

| Table             | Purpose                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------- |
| app_users         | Internal UUID, unique auth ID, profile, active/deleting/deleted, Polar customer ID        |
| courses           | Slug/title/summary/description, cover ID, draft/published/archived, ever-published flag   |
| sections          | Course, title, position                                                                   |
| lessons           | Section, stable ID, position, draft/live revision pointers, retired timestamp             |
| assets            | ImageKit identity/path/kind/size/duration, ready/private flags                            |
| lesson_revisions  | Immutable title/Markdown/video/preview/attachment IDs                                     |
| offers            | Product mapping, course/monthly/lifetime, current USD amount, active flag                 |
| orders            | Provider ID, user/offer/checkout/subscription IDs, paid/refund totals, provider timestamp |
| subscriptions     | Provider state and period timestamps; cancellation/revocation                             |
| entitlements      | Per-source-order grants, starts/ends/revoked, optional course                             |
| lesson_progress   | User/lesson unique, watched intervals, resume, completed/manual undo                      |
| playback_sessions | User/lesson scoped sequencing token                                                       |
| refund_requests   | User/order/reason/response/status; one pending per order                                  |
| webhook_events    | Unique verified inbox ID, payload, processed timestamp                                    |
| jobs              | Unique key, type/payload, lease, retries, next run, done/failed/error                     |
| settings          | Business and policy JSON                                                                  |
| checkout_intents  | User/offer unique, reservation, provider checkout URL/ID, expiry                          |
| rate_limits       | Window counters                                                                           |

Committed-to-working-tree migration files (not git commits): `drizzle/0000_illegal_betty_ross.sql` creates schema; `0001_crazy_krista_starr.sql` adds orders.checkout_id. Both applied successfully in PGlite tests. **Not applied to remote Neon.**

## Important code map

### Domain and backend

- `lib/domain/access.ts`: union entitlement evaluation, expiry, full-refund rule.
- `lib/domain/progress.ts`: merged watched intervals and completion percentage.
- `lib/domain/media.ts`: strict ImageKit URL/path/transformation allowlist.
- `lib/auth/server.ts`: managed auth, DB identity mapping, immutable admin ID, user/admin API guards and page guard. Deleted identities are not recreated/overwritten.
- `lib/server/catalog.ts`: tagged public catalog cache, private entitlement reads, published-only lesson access, dashboard.
- `lib/server/polar.ts`: server fetch client, 15s timeout, `Polar-Version: 2026-04`, Zod provider schemas. A leftover optional idempotency header is used for state-setting cancellations but checkout does **not** assume Polar POST idempotency.
- `lib/server/imagekit.ts`: server-only signing via SDK helper.
- `lib/server/jobs.ts`: durable webhook processing, canonical provider fetches, advisory locks, per-order grants, cancellation jobs, deletion worker, leased retries.
- `lib/http.ts`: same-origin mutation checks, expected HTTP/Zod errors, generic unexpected errors sent to Sentry.

### Routes

- `/api/auth/[...path]`: Neon Auth proxy.
- `/api/webhooks/polar`: raw-body signature validation, inbox+job transaction, after-response worker.
- `/api/cron`: timing-safe bearer check, worker, data retention cleanup.
- `/api/media/sign`: lesson membership/access check, short TTL bound to access expiry, admin draft access, user/anonymous rate limit.
- `/api/covers/[id]`: public non-draft course-cover lookup followed by short signed redirect; never signs arbitrary assets.
- `/api/progress`: owned playback session and monotonic sequence checks; merges watched intervals; manual undo persists.
- `/api/checkout`: verified user, active offer/ownership/live price checks, durable reservation, provider create/recovery. Production checkout requires `LEGAL_PAGES_APPROVED=true`.
- `/api/account`: exact-checkout grant polling, portal, own-order refund requests, recent-auth deletion.
- `/api/admin`: validated commands, server admin checks, authoring lock, draft/publish/archive/reorder/products/settings/refunds/job retries.
- `/api/admin/uploads`: browser upload signature, provider metadata verification/registration, HLS readiness check.

### Commerce behavior worth preserving

- Inbox and job persist atomically before returning202. Duplicate event IDs and source order IDs are unique.
- Worker fetches canonical orders/subscriptions/products. Older provider versions are ignored; refund totals do not decrease.
- Monthly grant period uses event snapshot rather than a newer subscription renewal. Existing grants are never extended by a subscription status update.
- Full refund revokes only its order's grant. Lifetime queues period-end cancellation of known monthly subscriptions; a later subscription webhook also detects existing lifetime.
- Checkout reservation is stored **before** remote creation. Ambiguous responses recover by metadata `baela_intent_id`. Missing remote result stays pending up to24h rather than issuing another create. Success polling matches `orders.checkoutId` exactly.
- Deletion marks user deleting immediately, cancels remote subscriptions (paginated), waits for local in-flight intents and remote open/confirmed checkouts, deletes Neon identity, clears progress/sessions, scrubs profile/refund text, revokes grants. Deleted-user late events cannot restore access and queue subscription cancellation.
- Jobs claim with row lock/skip-locked +120s lease, retry up to10 with exponential delay capped1h. Deletion awaiting checkout is deferred without increasing failure count. Each handler runs bounded batches, but see runtime-budget review in next steps.

### UI and styling

- Root/header/footer/providers, sage-green understated light/dark design, Tailwind4 CSS, shadcn-pattern Button/Card with Radix.
- Landing uses CSS artwork and real empty state, no fake courses/testimonials.
- Auth forms, course sales/curriculum, learner player/sidebar/downloads, dashboard, account/refunds/deletion, checkout pending page.
- Admin editor: Tiptap visual/Markdown/preview, dnd-kit ordering, XHR upload progress, video-ready check, draft/live revisions, preview route; business, legal policies, users, refunds, jobs pages.
- Course covers now display through `/api/covers/{courseId}`. Markdown images are currently intentionally suppressed (`img:()=>null`); no inline-image workflow.
- Metadata/robots/sitemap/OG image, loading/error/not-found pages exist.

## Ops and docs

- `.env.example` contains names only. Deprecated unused monthly/lifetime product-ID env variables and NEON_BRANCH_ID were removed; products map through Studio.
- `vercel.json` schedules `/api/cron` every minute. Hosting plan must permit commercial use and this schedule.
- `scripts/verify-launch.ts`: checks required env, HTTPS/secrets, production Polar, policies, business profile, offers, published course, failed jobs. Does not certify external integrations.
- `.github/workflows/check.yml`: npm ci, check, build, Chromium install, browser tests, failure artifacts. Not exercised on CI yet.
- `README.md`, `docs/launch.md`, `docs/operations.md` document setup, limitations, acceptance and recovery.
- Cron retention: processed webhook payloads stripped after30days while retaining IDs; completed jobs/session tokens older30days removed; expired rate windows removed. Orders/grants/tombstones still retained; jurisdiction-specific retention is an unresolved launch requirement.
