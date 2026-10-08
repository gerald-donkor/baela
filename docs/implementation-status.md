# Implementation checkpoint — 2026-10-02

## Trailer update — 2026-10-08

Courses now have a dedicated **Trailer** tab in Studio, with private MP4 upload or existing-video selection, automatic upload-to-draft saving, processing verification, draft playback, explicit publication, draft clearing, and published-trailer removal. Replacements keep the existing trailer live until publication. Unsaved selections and active uploads participate in the workspace's navigation warning; publishing is disabled during uploads or when the selected video differs from the saved draft.

The real course sales page prefers the published trailer and falls back to the first published free-preview lesson. Trailers do not create curriculum lessons, playback sessions, or learning progress, and do not satisfy the course's published-lesson requirement. Public signing resolves the video from the course and accepts no arbitrary asset ID. Draft-course trailers stay private; draft playback requires an active administrator. The existing same-origin, rate-limit, HLS path, source-height, and short-lived URL checks apply to trailer delivery. Stale publish/remove commands fail rather than changing a newer trailer.

Migration `0003_course_trailers.sql` adds nullable draft/published asset references with foreign keys. It was applied to the configured Neon database after a read-only check confirmed all three existing migration hashes; a follow-up read verified the new fields and migration hash. No existing course metadata, lessons, or uploaded assets were changed. The read-only MCP grant was not broadened.

Verification: `npm run check` passed (lint, generated routes, TypeScript, **115 tests across ten files**, including 16 trailer cases). The webpack production build and eight selected desktop/mobile production Playwright checks (protected pages, security boundaries, theme persistence, and shared controls) passed. A local browser fixture passed draft save, processing/publication guards, verification, private preview, replacement, clear/remove, failed-save retry without a second upload, dirty navigation, keyboard tabs, and both themes at 320/390/768/1440px. Trailer preview made zero progress requests. Screenshots were visually inspected; the fixture route was removed before the production build. Uploads and Server Actions were intercepted; no real videos or test courses were created. Actual ImageKit video processing/playback and expiry acceptance remain outstanding.

## Studio update — 2026-10-07

The admin dashboard now follows Horizon in light and dark themes. It includes persistent responsive navigation, real course/student counts, course search/status filters/sorting, draft creation with automatic editable slugs, details/curriculum/publishing tabs, private cover previews, an ImageKit media library, a publishing checklist, and loading/retry states. Existing server-side instructor guards and authoring commands remain authoritative. Unsaved lesson changes disable publishing and warn before switching the workspace.

ImageKit uploads now support the supplied server-side configuration names and `IMAGEKIT_FOLDER` (with legacy public-name compatibility). File registration checks the configured root and media-kind subfolder. Upload retries reuse an already transferred file after registration failure. The installed SDK's expiry argument is an absolute Unix timestamp; upload signatures now expire five minutes from issuance, covered by a real-SDK HMAC regression test.

The upload picker uses the shared button style and preserves the selected filename after completion. Resetting the hidden native input still allows choosing the same file again, without displaying the misleading “No file chosen” label. A mocked local browser check passed keyboard selection, same-file reselection, registration retry without duplicate transfer, and the 320px layout in both themes; it did not send files to ImageKit.

Verification: ESLint and TypeScript passed; 99 Vitest tests across nine files passed; the webpack production build passed; eight selected production Playwright checks passed across desktop/mobile Chromium (protected routes, security boundaries, theme persistence, and shared controls). Browser UI checks covered both themes, 320px through desktop, course filtering/sorting, dialog focus/escape, slugs, dirty lesson protection, empty states, and a mocked upload registration retry without transferring twice. [Studio screenshots](../design/previews/README.md) use labeled fixtures from a temporary route that was removed after verification. No fixture courses were inserted into the database.

The supplied ImageKit private key passed an authenticated read-only API check and the URL endpoint has a valid HTTPS format. No files were uploaded to or changed in the account by that check. The existing Neon database was inspected in read-only transactions: application tables are present, and its sole verified, active Auth account matches the application user record. That immutable identity is now configured as `ADMIN_AUTH_USER_ID` in the ignored local environment. Codex's hosted Neon MCP connection was installed with read-only OAuth and browser authorization completed. Authenticated Studio and live upload acceptance still need browser testing. No production deployment or database migration was performed.

The sections below preserve the earlier 2026-10-02 checkpoint and its historical verification counts.

The user supplied the original v1 plan during this continuation. It resolves the historical handoff ambiguities: offline viewing is v2, Google/GitHub/email sign-in and self-service deletion are in v1, cumulative full refunds revoke the affected source, and the old $100/month ceiling is withdrawn. Historical budget estimates are not current quotations. No paid service, deployment, or remote migration was performed.

## Implemented in this continuation

- Admin and account forms now call authenticated Server Actions backed by shared server-only services. The JSON routes use the same validation and authorization.
- One product validator is used when mapping offers, processing product events, and starting checkout. Changed billing intervals or ambiguous prices disable/block the offer without rewriting purchase history.
- New monthly grants require the original `order.paid` period snapshot. A delayed non-paid event cannot use a newer canonical subscription period. Existing grants and refunds remain independently reconciled.
- Deletion requires a confirmed Polar cancellation response, handles paginated subscriptions, defers pending checkouts without consuming retries, and uses the branch-scoped Neon management API. `NEON_BRANCH_ID` is required alongside the project ID. Unconfirmed Neon responses, including 404, remain pending rather than assuming identity removal.
- External job calls share a 45-second invocation deadline; retries/deferred jobs can be persisted before the 60-second route limit. Database latency and actual provider responses still require staging observation. Terminal attempts carry a Sentry `terminal=true` tag.
- Tiptap semantic Markdown round-trip tests cover headings, emphasis, links, lists, blockquotes, code, tables, and managed images. HTML/MDX is explicitly rejected outside code examples. Lesson images are private uploads referenced by stable asset IDs and authorized through the published revision. Unsaved editor image previews require administrator access.
- Migration `0002_perfect_newton_destine.sql` adds source video height and revision image references. Reverify existing videos to populate height. The HLS ladder is capped by source height; sources below 360p or without verified height use MP4. No upscaling is requested.
- Uploader callbacks are awaited. A dedicated cover command prevents stale course metadata from overwriting edits. Retired lessons cannot satisfy the course publication guard.
- Student ownership now names individual courses and batches its reads. Pagination is bounded. Starting a playback session records the started course; progress and account mutations are rate-limited.
- The mobile curriculum uses a focus-trapped drawer with locked/completed indicators. Previous/next links remain nonsequential. Public instructor/support details use Studio settings.
- Checkout polling stops on confirmation and offers manual retry after a bounded wait. Auth navigation retains the safe return destination. Player cleanup ignores late session/signing results.
- Explicit legal routes avoid the catch-all route returning HTTP 200 or generating internal fallback errors for unknown URLs. The theme selector, theme assertion, screenshots, legal/support checks, and Firefox/WebKit CI projects were added.

## Verification and limits

Final verification:

| Check                                                                      | Result                                                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                            | Passed: ESLint, generated routes, TypeScript, **69 tests across five files**                                  |
| `npm run build -- --webpack`                                               | Passed: compilation, types, page generation, build traces                                                     |
| `npm run test:e2e -- --project=desktop --project=mobile --project=firefox` | **18 passed** against the final production build; unknown URLs return 404 without the internal fallback error |
| Screenshot inspection                                                      | Desktop/mobile light/dark public layouts reviewed; no visible clipping or overflow                            |
| `npm run test:e2e -- --project=webkit`                                     | Browser launch blocked by host libraries: five browser cases fail before running; one API-only case passes    |
| `npm run verify:launch`                                                    | Executed; fails for missing service credentials, HTTPS origin, secrets, and legal approval as expected        |
| `git diff --check`                                                         | Passed                                                                                                        |

[Desktop dark screenshot](validation/desktop-dark.png) · [Mobile light screenshot](validation/mobile-light.png)

Embedded PostgreSQL tests apply all migrations and mock external services; they do not certify Neon connectivity. Anonymous browser tests exercise the unconfigured production build, not authenticated authoring, purchases, or real video streaming.

- Production dependency audit executed: **four moderate findings**, zero high/critical, in the Drizzle Kit → `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils` → old esbuild chain. Better Auth brings Drizzle Kit into the resolved graph as an optional peer, which explains why they appear even with `--omit=dev`; do not describe the audit as clean. The advisory concerns esbuild's development server. No forced downgrade or dependency override was applied. Track [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99).
- Turbopack still fails because its worker cannot bind a local port in this environment, including the approved attempt. The default build remains Turbopack; local verification uses webpack.
- Firefox and matching WebKit binaries were installed. Local WebKit browser launches fail because the host lacks compatible `libicu74`, `libxml2`, and `libflite1`. Its API-only case passes. CI installs browser OS dependencies on Ubuntu; that CI run has not occurred here. Firefox/Chromium runs do not substitute for Safari, Edge, or real-device media checks.
- The launch verifier runs and fails as expected for absent service configuration, policies, and production origin. No live-service success is claimed.

## Remaining release gates

1. Configure isolated Neon/Auth, Polar sandbox, ImageKit, and Sentry accounts. Apply the reviewed migrations to an isolated Neon database and repeat transactional integration checks there. Verify configured private pages are dynamically rendered and never shared-cached.
2. Test actual OAuth/email/recovery/linking and Server Action authoring, including draft preview, image upload, reorder, publish, and deletion. Confirm the management API's behavior after ambiguous deletion responses; a 404 requires operator verification and reconciliation rather than automatic local completion.
3. Exercise all Polar purchases, paid snapshots, refunds/taxes, cancellation, checkout ambiguity and deletion races with real sandbox events. Measure normal webhook acknowledgement under two seconds and monitor job age/terminal errors.
4. Observe actual private ImageKit HLS manifests/segments, redirects and signed URL expiry. Test unsigned originals/transformations/named transformations, attachments, low-resolution inputs, seeking/backgrounding, and network recovery. The strict signer stays closed to unknown paths.
5. Run current Chrome, Firefox, Edge, Safari, real iOS Safari and Android Chrome media acceptance, plus the planned 25-viewer concurrency exercise. Anonymous phone emulation is not a real device test.
6. Supply seller/country approval, actual course content, domain/instructor details, reviewed legal/refund/retention text, support mailbox, and measured service budget. Set provider usage/error alerts and complete backup/restore rehearsal before public launch.

## Deliberate implementation differences

The ImageKit React player package's peer range excluded the project's pinned React 19 version during initial implementation. The application uses a small HLS.js/native-MP4 wrapper with ImageKit storage/signing. That compatibility substitution is preserved; actual playback remains a release gate. Course/section metadata updates immediately, while lesson revisions remain drafts until explicitly published; the editor states that behavior. Tests currently use PGlite locally, with isolated Neon acceptance still required. Offline storage, service workers, and DRM remain absent as specified for v1.

## Reference

- [Current launch checklist](launch.md)
- [Operations and recovery](operations.md)
- [Neon branch-scoped deletion endpoint](https://api-docs.neon.tech/reference/deletebranchneonauthuser)
- [Tiptap Markdown support and limitations](https://tiptap.dev/docs/editor/markdown)
- [ImageKit adaptive streaming](https://imagekit.io/docs/adaptive-bitrate-streaming)

The original files in `handoff/` describe the earlier checkpoint. Their counts, hashes, caveats, and “not run” labels are historical, not current validation results.
