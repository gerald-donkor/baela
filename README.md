# Baela

A single-instructor course platform using Next.js 16.3.8, React 19.2.8, TypeScript, shadcn-style Radix UI components, Drizzle, Neon Postgres/Auth, ImageKit, Polar, and Sentry.

## Local setup

Use Node 22.12+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Without credentials the public site displays its real empty state, launch prices, policy placeholders, and closed enrollment. It does not fabricate courses or purchases.

1. Create separate development and production Neon projects/branches. Set the pooled `DATABASE_URL`, enable managed Neon Auth, and copy its base URL. Generate a cookie secret of at least 32 random characters. Configure Google, GitHub, verified email/password, recovery email, and exact allowed app origins. Create your instructor account, then set its immutable ID as `ADMIN_AUTH_USER_ID`.
2. Run `npm run db:migrate`. Drizzle owns application tables; Neon Auth owns identities and sessions. Do not migrate Neon's internal auth tables.
3. Configure Polar sandbox credentials and a signed webhook. Create fixed USD products: **833 cents/course**, **1667 cents/month**, **8333 cents/lifetime**. Link product IDs through Studio → Settings and each course editor. Production requires separate credentials/products and seller approval.
4. Configure ImageKit private uploads, URL signing, and adaptive streaming on a suitable plan. Set its URL endpoint/public key and server-only private key.
5. Set Sentry, support address, `NEXT_PUBLIC_APP_URL`, and a random `CRON_SECRET`. Account deletion also needs a project-scoped Neon management API key and project ID, and `NEON_BRANCH_ID` for the same Auth branch.
6. Visit `/admin`, create sections/lessons, upload media, verify processing, save drafts, publish lesson revisions, connect the course product, and publish the course.

See the [current implementation checkpoint](docs/implementation-status.md) for continuation changes, checks, and remaining release gates.

The [Horizon design system](docs/design-system.md) defines the shared visual language. Theme tokens live in `design/tokens.css`, reusable primitives in `components/ui/`, and a browsable gallery at `/design-system`.

Read [launch configuration](docs/launch.md) before taking payments and [operations](docs/operations.md) for incident recovery.

## Neon authentication

Set `NEON_AUTH_BASE_URL` from **Neon → Branch → Auth → Configuration** and generate `NEON_AUTH_COOKIE_SECRET` with `openssl rand -base64 32`. Keep both server-only and use the same Neon branch as `DATABASE_URL`. Google and GitHub credentials belong in the Neon dashboard; no provider client secrets are needed in this app.

The custom forms at `/auth/sign-in` and `/auth/sign-up` use `authClient.signIn.social()` through `/api/auth/[...path]`. `proxy.ts` completes the OAuth session exchange on the return page and protects `/account`, `/admin`, and `/checkout/success`. The public catalog and demo dashboard stay accessible. Server-side identity and permission checks still protect account operations, admin actions, and paid course access.

In each provider's console, register the callback URL shown by Neon: `{NEON_AUTH_BASE_URL}/callback/google` or `{NEON_AUTH_BASE_URL}/callback/github`. Add your deployed app origin under **Auth → Configuration → Domains**. Localhost ports are allowed automatically. See Neon's [OAuth guide](https://neon.com/docs/auth/guides/setup-oauth) and [trusted-domain guide](https://neon.com/docs/auth/guides/configure-domains).

Run `npm run dev` and try each provider from `/auth/sign-in?next=/account`. A successful sign-in should return to the account page, show the signed-in navigation, and persist after a refresh. Test sign-out there as well. For Safari, run `npm run dev -- --experimental-https` and use `https://localhost:3000`.

`npm run check` covers callback session exchange and safe redirects. Run the mocked provider UI checks with `BAELA_E2E_AUTH=1 npm run test:e2e -- tests/e2e/auth.spec.ts` after building. Real provider consent and email delivery require manual testing against your Neon branch.

## Neon MCP for local development

Codex can connect to Neon's hosted MCP server with OAuth:

```sh
codex mcp add neon --url 'https://mcp.neon.tech/mcp?readonly=true'
codex mcp login neon --scopes read
```

Complete authorization in the browser, then reload Codex to expose the server's tools in the current session. The connection is stored in `~/.codex/config.toml`; OAuth credentials stay outside the repository. Read-only access supports inspecting identities and the application schema without changing database records. See [Neon's MCP setup](https://neon.com/docs/ai/connect-mcp-clients-to-neon) and [Codex MCP configuration](https://developers.openai.com/codex/mcp).

## Commands

```sh
npm run check          # ESLint, generated route types, TypeScript, Vitest
npm run build          # Production build
npm run test:e2e       # Desktop/mobile tests against a built app
npm run db:generate   # Generate schema migrations
npm run db:migrate    # Apply committed migrations
npm run verify:launch # Check production environment and database setup
```

Install browsers once with `npx playwright install chromium firefox webkit` (on a supported Linux host, install their OS dependencies too). To run only locally available engines, use `npm run test:e2e -- --project=desktop --project=mobile --project=firefox`. In environments prohibiting Turbopack's local worker port, use `npm run build -- --webpack`; Next.js and the application architecture remain the same.

## Implemented v1

- Responsive catalog/pricing, sales pages, preview lessons, visible locked curriculum, light/dark preference, metadata, sitemap, and Open Graph image.
- Managed authentication, student dashboard, continue watching, resume position, 95% watched-interval completion, manual completion/undo, Markdown, and attachments.
- Verified Polar webhooks, durable jobs, duplicate protection, paid-period expiry, cumulative full-refund revocation, lifetime upgrade cancellation, and customer portal.
- Browser uploads, private signed media, HLS.js adaptive playback with MP4 fallback, course covers, video readiness checks, saved draft/live revisions, reordering, archival protection, student ownership, refund requests, policies/business settings, and failed-job retries.
- Account deletion requiring recent sign-in, renewal cancellation, pending checkout checks, retries, and tombstones preventing late webhooks from restoring access.

## Architecture

Server components read through the server-only Drizzle layer. Admin/account forms use Server Actions backed by shared services. Mutations validate input/origin and authorize on the server. Admin pages independently check the instructor ID. Client-supplied prices and user IDs are never trusted.

Access is the union of preview status, permanent course purchases, paid subscription periods, and lifetime purchases. Each order creates a distinct entitlement; revoking one leaves independent grants intact. Subscription status and checkout redirects never create paid access.

Polar signatures use SDK API version `2026-04`. Events/jobs commit together before acknowledgment. Workers fetch canonical state, preserve paid-period snapshots, reject older updates, and retry failures. Durable checkout intents recover ambiguous responses by metadata instead of blindly repeating a POST.

ImageKit objects stay private. Lesson-authorized URLs expire within five minutes or sooner at access expiry. HLS manifests/segments are signed on demand. Signed URLs are temporary bearer credentials, not DRM; they cannot prevent all copying or screen recording.

Neon supplies Postgres and Auth; Next.js runs the application backend and workers. Public catalog caching uses tags; private responses and signed URLs are not shared-cacheable. No AI backend is included in v1.

## Deferred and unverified

The YouTube-like offline library is **not implemented in v1**. Future browser storage requires download manifests, entitlement revalidation, expiry/eviction, and browser testing. Avoiding a paid DRM vendor does not eliminate hosting costs or provide DRM-grade protection. Current downloads are lesson attachments only.

Other deferred features: Polar Benefits, bundles/discounts, Q&A, certificates, captions/search, AI tutoring, waitlists, marketing email, and completion/drop-off analytics. Stable lesson IDs and immutable revisions provide extension points.

Automated integration tests use embedded PostgreSQL with mocked provider responses. Real auth, checkout/refunds, signed HLS and Neon identity deletion still need the live-service acceptance checks. Seller eligibility, reviewed policies, domain, service budgets, and course content remain launch dependencies.

## Creator Studio

The admin dashboard at `/admin` follows the Horizon palette in both themes. It includes a searchable course library, course creation, a tabbed details/trailer/curriculum/publishing workspace, a media library, student access records, refunds, jobs, and settings. Course counts come from the database; retired lessons are excluded.

To add a course trailer, open the course → **Trailer**. Upload an MP4 (automatically saved as a trailer draft), or select an existing video and **Save trailer draft**. **Verify processing**, **Preview draft**, then **Publish trailer**. Uploading a replacement keeps the current trailer live until you publish the replacement. **Clear draft** leaves the published trailer alone; **Remove published trailer** restores the first free-preview lesson on the sales page. Draft-course trailers remain private until the course is published. Trailers are optional and do not count toward curriculum or learning progress. Apply migration `0003_course_trailers.sql` before running this code against another database.

Set `ADMIN_AUTH_USER_ID` to your instructor account's **Neon Auth user ID**, found in Neon → Auth → Users. Signing in with another account cannot grant Studio access. The server checks this identity for every private page, authoring command, and upload authorization.

For uploads, set these values in `.env.local` and your deployment environment:

```dotenv
IMAGEKIT_PRIVATE_KEY=your-server-only-private-key
IMAGEKIT_PUBLIC_KEY=your-public-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-imagekit-id
IMAGEKIT_FOLDER=baela
```

The earlier `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` and `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` names remain supported. `IMAGEKIT_FOLDER` selects the upload root (for example, `dev`); files are organized under its video/image/attachment subfolders. Changing this root does not alter paths of already registered assets.

Find the keys in [ImageKit developer settings](https://imagekit.io/dashboard/developer), and the URL endpoint in your ImageKit dashboard. Keep the private key out of chat and source control. Restart the app after local changes, and rebuild/redeploy for deployment changes. Studio → Settings shows which values are missing without exposing keys. “Credentials configured” means values are present; it does not verify the account or its streaming capabilities.

Uploads go directly from the browser to ImageKit as private files using server-issued signatures. Failed registration can retry without uploading the same file again. Verify video processing before publishing a saved lesson draft. Actual uploads and private streaming still need live-service acceptance with your account.
