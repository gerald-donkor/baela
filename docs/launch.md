# Launch configuration

## Environments and hosting

Isolate Neon branches/projects, Polar sandbox/production products and secrets, ImageKit assets, and Sentry environments. Never expose real student data to preview deployments. Set the exact HTTPS app origin in `NEXT_PUBLIC_APP_URL`, Neon allowed origins, OAuth callbacks, and Polar return settings. Rebuild after changing public environment variables.

Use a hosting plan permitted for commercial use and capable of the minute-by-minute cron in `vercel.json`. Once-daily cron is insufficient. Apply migrations as a controlled release step, not every build. Enable backups/PITR and rehearse restoration.

## Neon

Configure verified email/password, Google and GitHub. Test verification, account linking, recovery, sign-out, and session expiry on your deployed domain. Keep `NEON_AUTH_COOKIE_SECRET` stable across deployments. Instructor authorization uses an immutable auth ID, never an email or client-editable role.

The deletion worker uses Neon's management API. Scope `NEON_API_KEY` to the project; set `NEON_PROJECT_ID` and `NEON_BRANCH_ID` to the branch serving `NEON_AUTH_BASE_URL`, and test with a disposable student. Errors leave deletion pending; renewal stops before identity removal. Restricted transaction/tombstone records remain.

## Polar

Complete onboarding for your actual seller country and individual/business status. Baela's business profile does not approve eligibility or establish a legal entity.

Use fixed USD products with one active price each. Monthly recurs every one month; course/lifetime are nonrecurring. Trials/discount entry are disabled. Change prices in Polar, keeping product IDs stable. Product webhooks refresh local pricing; reconnect in Studio if needed.

Endpoint: `/api/webhooks/polar`. Configure signing secret and **API version `2026-04`**. Select available `order.created`, `order.paid`, `order.updated`, `order.refunded`, `subscription.created`, `subscription.updated`, `subscription.active`, `subscription.canceled`, `subscription.revoked`, `subscription.uncanceled`, `product.created`, and `product.updated` events. Grant the token read access to products/orders/checkouts/subscriptions and write access to checkouts/customer sessions/subscriptions. Baela does not issue money refunds through the API.

No app grace period: the last paid grant expires at its period end. Scheduled cancellation retains that period. Cumulative full refunds revoke the affected order; partial refunds retain it. Actual refunds happen in Polar. Lifetime upgrades cancel monthly renewal without proration/credit; lifetime refunds do not restart monthly billing.

## ImageKit

Use private uploads. Verify unsigned originals fail, signed URLs work, and HLS manifests/segments are also protected. Restrict transformations/origins where supported. Uploaded videos are MP4; click the processing check before publishing. Test representative 1080p, lower-resolution, and long lessons. Verification stores source height; HLS rungs are capped at that height. Videos below 360p use signed MP4. After migration 0002, reverify existing videos to populate height.

HLS.js signs each resource; browsers without MediaSource receive refreshed signed MP4. Test seeking, quality changes, backgrounding, slow networks, expiration, and resume in Chrome, Firefox, desktop Safari, and iOS Safari. Verify real generated manifest paths against `lib/domain/media.ts`; unknown paths fail closed.

Limits: 2 GB video, 10 MB images, 50 MB PDF/ZIP/PPTX attachments, subject to your plan. Readiness checks require HLS and duration metadata. Confirm current processing, storage, and bandwidth pricing against the actual catalog; video hosting is not cost-free.

## Policies and monitoring

Publish reviewed privacy, terms, and refund text in Studio. Set `LEGAL_PAGES_APPROVED=true` afterward; production checkout stays closed otherwise. Configure a real support mailbox. Establish appropriate transaction retention, deletion handling, and acceptable-use policies for your seller location.

Configure Sentry and optional source-map upload. Send a controlled test error and verify it arrives. Set alerts for cron failures, Polar delivery failures, and terminal jobs. Inspect telemetry for sensitive data before launch; replay/marketing analytics are not enabled by default.

## Acceptance checklist

See [current implementation evidence and remaining gates](implementation-status.md).

Run `npm run check`, `npm run build`, `npm run test:e2e`, and `npm run verify:launch`, then use disposable sandbox students:

- Preview video/text/attachments work anonymously; paid bodies and unrelated assets remain private.
- Unverified students cannot purchase; students cannot mutate admin content or other students' records.
- All three purchases activate only after webhooks. Forged success URLs grant nothing; duplicate submissions reuse checkout.
- Cancellation, expiry, failed renewal, partial/full refunds, independent grants, and lifetime upgrades follow the rules above.
- Delayed, duplicate, invalid, and out-of-order webhooks behave correctly; failed jobs recover through Studio.
- Long playback crosses URL expiry, resumes across devices, and preserves progress. Seeking alone does not count as watching.
- Drafts stay private; publication is explicit; new lessons change completion percentage; sold courses archive safely.
- Deletion stops renewal, handles pending checkouts, removes the Neon identity, and stays deleted after replayed webhooks.
- Refund requests show correct status; support has a documented response process.
- The deployed site works with keyboard navigation at phone/tablet/desktop widths and in both themes.

Do not call the system production-validated until external-service checks pass.

## Primary references

- [Neon Auth](https://neon.com/docs/auth/overview)
- [Polar checkout API](https://polar.sh/docs/api-reference/2026-04/checkouts/list-checkout-sessions)
- [Polar webhooks](https://polar.sh/docs/integrate/webhooks/endpoints)
- [ImageKit security](https://imagekit.io/docs/media-delivery-basic-security)
- [ImageKit streaming](https://imagekit.io/docs/adaptive-bitrate-streaming)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

Next.js-specific implementation guidance comes from the docs bundled with the installed package, as required by AGENTS.md.
