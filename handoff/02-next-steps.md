# Resume checklist, validation and open issues

## Immediate next actions

1. Read `AGENTS.md` and the relevant installed Next docs. Inspect current files rather than assuming examples here are still exact.
2. Fix the confirmed theme-button selector mismatch documented in04, then **run the existing Playwright suite** against the successful production build. No browser test has run yet. Its config starts `npm run start -- --port 3100`, sets blank DB/auth env, and tests desktop Chrome + Pixel7. A local listener/browser launch may require approved execution. Do not bypass the approval system.
3. Visually inspect desktop/mobile screenshots and fix real layout/accessibility/browser errors. Screenshots have not been taken yet.
4. Review the risk list below and complete justified fixes with meaningful regression tests.
5. Re-run affected checks and a final production build after code changes. Default Turbopack failed on a local-port sandbox restriction; approved webpack build succeeded.
6. Update README/launch docs honestly, then report implemented scope versus credentials/launch blockers. No deployment or remote account creation is authorized merely by this handoff.

Do not present the initial implementation as finished just because it compiles. Conversely, do not restart from scratch or repeat the interview.

## Latest verified results

`npm run check` completed with exit0 on2026-10-02 at approximately16:43UTC:

- ESLint: zero reported errors/warnings on this final run.
- `next typegen && tsc --noEmit`: passed.
- Vitest: **2 files, 29 tests passed**, approximately3.46s.

Approved `npm run build -- --webpack` completed exit0:

- Compiled in21.7s.
- TypeScript finished5.8s.
  -24 static-generation entries completed and route/build traces finalized.
- Public home/admin/account/dashboard appeared static in this **unconfigured build**, because `getViewer` returns null when auth/database env is absent. With credentials, verify request-scoped auth causes dynamic rendering and no private content is cached. Do not silently dismiss this as verified safe in a configured build.

Default `npm run build` attempted twice and failed at Sentry-instrumentation loader processing because Turbopack worker could not bind a local port (`Operation not permitted`). An early non-escalated webpack attempt also returned a TypeScript `--showConfig` output parse error; the approved webpack build later succeeded with current code.

The package script remains `next build` (Turbopack), not webpack. CI uses that default on an unrestricted runner. README documents the local webpack fallback. Decide only with evidence whether to change the default.

## Tests already present

`tests/domain.test.ts`:

- Preview/ownership/expiry, permanent-priority grant selection, independent refunds, future periods.
- Cumulative full-refund semantics.
- Watched interval merging, seeking/completion, changing lesson counts.
- Media path/origin/transformation allowlist and attack rejection.

`tests/integration.test.ts`:

- PGlite applies **all Drizzle migrations**, tests real SQL and transactions with mocked Polar/Sentry/Next-cache/auth.
- Duplicate event/grant protection; no refunded grant resurrection.
- Partial then cumulative full refund; unpaid order no access.
- Delayed paid-order snapshot retains correct period.
- Lifetime-before-subscription delivery cancels renewal.
- Provider failure queues retry.
- Published revision isolation and paid-body denial.
- Unowned paid-media denial and unrelated-asset denial.
- Progress stale-sequence rejection/manual undo; other-user session denial.
- Ambiguous checkout response recovery with one remote POST.

`tests/e2e/public.spec.ts` (not run):

- Public catalog/prices ($8.33/$16.67/$83.33), hash navigation, no JS errors/overflow.
- Theme persistence.
- Anonymous redirects for dashboard/account/admin routes.
- Cron/unsigned webhook/cross-origin mutation/malformed-cover rejection.
  -404 handling.

Playwright browser caches exist under `/home/dgk/.cache/ms-playwright` (Chromium1234/1243 +headless, Firefox1538). `/usr/bin/chromium` also exists. Check compatibility before reinstalling. Browser execution permissions are separate from package installation.

Vitest warns about ESM syntax in `.ts` config loaded as CommonJS under a future Vite native loader. Tests pass. Optionally rename `vitest.config.ts` to `.mts`; no need to change package module type just to silence a future warning.

## Issues/reviews to prioritize

### Service integration correctness (not validated live)

- **ImageKit actual HLS resource paths:** strict allowlist expects source-path descendants ending m3u8/ts/m4s/mp4 and specified `tr` query values. Real manifest paths have not been observed. Verify legitimate generated child URLs, redirects, query propagation, signer behavior and segment expiry using a private uploaded video. Do not loosen the signer into an arbitrary URL oracle.
- **Video ladder/source resolution:** hardcoded `sr-360_480_720_1080` used for verification and playback. No persisted source height or ladder capping exists. Verify behavior with lower-resolution input; consider deriving an allowed ladder from verified metadata.
- **Neon deletion management endpoint:** implemented `DELETE https://console.neon.tech/api/v2/projects/{project}/auth/users/{authId}` with scoped API key, based on earlier official-doc research. Validate against the actual managed Auth version/project and branch before launch.
- **Auth provider configuration:** Google/email explicitly requested; GitHub came from carried context. Verify email verification enforcement, social account linking, recovery and allowed origins. Managed package is beta and transitive peers warn. Do not claim auth flows were browser-tested.
- **Polar paid period fallback:** worker prefers webhook snapshot but falls back to canonical order's embedded subscription period. Review whether a delayed non-paid-order event processed first could grant the wrong period if provider embeds current subscription state. Prefer fail-closed reconciliation over granting a newer period without evidence. Existing test covers a valid old snapshot.
- **Product change semantics:** product webhook refreshes amount/active but does not revalidate recurring interval in the same way admin mapping does. Checkout checks amount/archive but not recurrence. Consider rejecting/disable a mapped product whose billing interval changes. Preserve purchase history and product IDs.
- **Provider price/refund semantics:** verify net/refunded totals represent the same basis (tax/discount considerations). No real refunded order fixture has been used.

### Local correctness / UX gaps

- **Offline downloads:** explicitly not built. Confirm carried v2 deferral matches user expectations; user specifically requested YouTube-like downloads. Do not call attachment downloads a substitute.
- **Account deletion decision conflict:** visible early choice was support-request deletion; carried context says self-service later. See01-state.md. Implementation is self-service. Address if user corrects scope.
- **Student ownership view:** currently displays grant kind (course/monthly/lifetime) and expired/revoked labels but not the individual course title. The requirement is “what each one owns”; join course titles for a usable admin view. Page uses per-user grant queries (50 rows); batch if warranted. Page number accepts a general Number and should be clamped/floored/finite.
- **Instructor/business profile:** settings stored, but public brand/instructor/support rendering mostly uses hardcoded Baela/env support. Verify agreed purpose and surface needed values. Seller country currently two-letter input, not a country selector.
- **Course cover upload:** current callback posts all saved course metadata along with coverId; stale props/unsaved form text can be confusing. Dedicated cover command or explicit save behavior could avoid unintended metadata replacement.
- **Course metadata vs lesson drafts:** lesson content has proper revision isolation; course title/summary/description and section titles/order update live immediately. If approved plan expected full-course drafts, this is not implemented.
- **Published course visibility:** publish guard looks for any publishedRevisionId and does not exclude retired lessons. A course with only retired lessons could pass; add a meaningful guard/test if fixing.
- **Lesson/editor UX:** no inline Markdown image workflow; raw HTML ignored, fenced code accepted. Tiptap supports basic formatting/table but no dedicated link/image toolbar. Media-library selector and uploader present. Examine draft save/publish/selection state for stale props.
- **Course preview selection:** sales page chooses first preview lesson. Schema's previewLessonId exists but is unused. No separate trailer uploader/selector.
- **Learner sidebar:** titles/links exist, but visual locked/completed indicators in learner sidebar are less complete than sales curriculum. Consider desired UX and access state.
- **Progress/player races:** tests cover server sequence ordering, but browser playback not tested. HLS async loader signing/abort, useEffect cleanup/in-flight session response, URL refresh and network reconnect deserve manual/browser tests. Native MP4 periodically replaces src (restores currentTime/play state), which may cause a brief interruption.
- **Attachment download:** uses `window.location.assign(signedUrl)` to avoid async popup blocking; depending on MIME/provider disposition it may navigate away instead of saving. Configure download disposition or a safe download UX if needed.
- **Checkout status polling:** exact order match fixed; UI polls every3s and continues even after “still pending” message. Consider bounded backoff/manual retry, preserving webhook-only grants.
- **Dashboard:** purchased/started courses shown with saved progress; all-access catalog separate. Expired access can leave “Continue watching” linking to paywall, intentionally preserving progress but review wording. Fresh all-access user sees included courses section, not falsely completed courses.

### Reliability / security reviews

- **Add deletion tests:** current29 tests do not cover renewal cancellation before identity removal, provider errors, pagination, local ambiguous checkout reservation, deleted-user late events, or deletion races. Important enough for integration tests.
- **Pending checkout deletion:** reservation with null URL defers deletion up to24h. Remote checkouts filter open/confirmed; query only first100, but presence of any active checkout defers. Test race where checkout succeeds immediately before auth deletion; late-event cancellation should recover it.
- **Jobs runtime:** worker batch deadline45s checked before each job, individual jobs may take multiple15s external calls; route maxDuration60s. A long job could exceed runtime. Leases allow recovery, but use explicit budgets or smaller job phases if necessary.
- **Lease completion:** currently marks done by matching lease, not an explicit lease-expiry check.120s lease > intended invocation; ensure no concurrent duplicate side effect can cause harm.
- **Cron timingSafeEqual:** compares JS string lengths before Buffer lengths; Unicode authorization strings can produce a byte-length mismatch/throw instead of401. Low impact but easy robustness fix with byte buffers.
- **Telemetry:** request/user error fields and HTTP span attributes scrubbed, browser fetch/xhr breadcrumbs dropped. Server breadcrumbs/error messages/other attribute names can still contain URLs. Inspect real events for secrets/signed URLs; do not assume perfect PII removal from static code alone.
- **Rate limiting:** media user/anonymous and checkout are DB-limited. Anonymous key hashes provider-overwritten IP with secret/date; outside Vercel shares local bucket. Auth rate limiting relies on managed provider. Progress and account refund requests lack broader app throttles (pending-refund uniqueness exists). Add proportionate abuse controls without unnecessary services.
- **Raw body limits:** webhook checks length after reading body. Other routes rely on Zod field sizes after JSON parse. Evaluate hosting request limits rather than assuming application-level streaming bounds.
- **Indexes/constraints:** schema uses text unions at TypeScript layer, few DB check constraints, no job claim index or orders user index. Launch volume small, but assess query paths and add meaningful constraints/index migrations if justified.
- **Retention:** cron cleanup is implemented and documented; full jurisdiction-specific transaction retention is not. Do not automatically destroy historical media/orders.
- **No health/live readiness endpoint:** launch script checks DB/env only. Service readiness must be confirmed using acceptance checklist, not fake health green.

## Tool permission issue

An attempted approved-network `npm audit --omit=dev --json` was rejected **before execution** with:

> Automatic approval review failed: You've hit your usage limit. … The action was not executed because automatic approval review could not be completed. This is a review failure, not a determination that the action is unsafe. Do not bypass the approval check; resolve the error or ask the user for guidance.

The user was told about this. Do not retry via an unapproved network path or interpret it as a security rejection. Last install output reported4 moderate advisories, but their actual sources were not inspected; **do not claim they are dev-only** without audit evidence. Production audit remains open. No `npm audit fix --force` was run.

## Finishing communication

Keep progress updates concise and roughly once a minute during work. User dislikes repeated approval/clarification requests when authorization already exists. Do not ask to reapprove routine implementation. Explain any actual approval blocker and its source separately.

A truthful final implementation report should name scope, `npm run check`29 tests (or updated total), successful build mode, browser test results when actually run, remaining live-service setup, and offline-library status. Link local setup/launch docs. Do not say “production-ready” or “all features complete” while the issues above remain.
