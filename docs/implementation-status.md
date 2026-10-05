# Implementation checkpoint — 2026-10-02

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
