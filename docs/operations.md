# Operations

## Jobs and webhooks

`/api/cron` requires `Authorization: Bearer <CRON_SECRET>`. Vercel supplies it when configured. The route/webhook handler run short batches. External calls share the worker deadline; time-budget deferrals do not consume failure attempts. Rows have leases, attempts, next-run timestamps, and terminal-failure status. Retries back off to one hour and stop after ten failures. Pending checkouts defer deletion without consuming its failure budget.

Inspect Studio → Jobs, fix the underlying service/configuration issue, then **Retry job**. Never manually insert entitlements or mark failures complete. Event IDs and source orders are unique. Replaying a completed event is a no-op; retry the stored failed job for an existing event.

For missing access, check endpoint reachability, environment-specific signing secret, API version `2026-04`, product mapping, and jobs. Redeliver missing events from Polar after recovery. A browser success URL is never evidence of payment.

## Checkout ambiguity

A durable intent is reserved before remote creation. After a lost response, retries search Polar for its `baela_intent_id` metadata. Missing matches stay pending rather than repeat a potentially duplicate POST. Reservations expire after 24 hours. Before manually removing a reservation, inspect provider sessions and payments. Do not ask a student to pay again until the first attempt is understood.

## Deletion and refunds

Deletion immediately denies app access, cancels renewal, waits for open/confirmed checkouts, removes the Neon identity, clears progress, and pseudonymizes the profile. It never automatically refunds. Errors stay pending in Jobs. A Neon 404 is not accepted as proof of deletion: verify the configured project/branch and identity with the provider before reconciling an ambiguous prior deletion. Never mark local deletion complete solely from an HTTP error. Open checkouts can delay identity removal until expiry. Neon deletion uses the branch-scoped API and requires `NEON_BRANCH_ID`. Late subscription events enqueue cancellation and cannot restore access.

Review requests in Baela and refund money in Polar. Webhooks reconcile status. Purchases remain independent; a lifetime refund does not revive monthly billing.

## Retention and backups

Raw webhook payloads contain customer data: restrict database access. Cron strips processed payloads after 30 days, retaining IDs for deduplication; removes completed jobs after 30 days; clears expired rate-limit buckets and playback sessions older than 30 days. Transaction history, grant sources, and identity tombstones remain for reconciliation. Establish a documented production retention period and any jurisdiction-specific expiry process before launch. Do not delete source orders independently of their grants.

Retired/archived content retains ImageKit media to protect historical purchases. Review orphan uploads manually; destructive media cleanup is disabled. Restore backups into a separate branch, verify migrations/payment state, and reconcile provider events before switching production.

## Deployment

CI runs lint, types, embedded-Postgres integration tests, build, and anonymous browser checks. Live-service tests need sandbox accounts. Apply additive migrations before dependent code. Code rollback must remain compatible with deployed schema; do not use destructive database rollbacks on live purchases.

Monitor Sentry, provider dashboards, scheduler health, pending-job age, and failures. Signed media URLs and checkout links are bearer credentials: keep them out of logs, support tickets, and analytics.

Sentry job events include `jobType`, `jobId`, and `terminal=true` on the final attempt. Configure an alert on terminal jobs and an external monitor for scheduler failures and pending-job age; code configuration alone does not create provider-dashboard alerts.
