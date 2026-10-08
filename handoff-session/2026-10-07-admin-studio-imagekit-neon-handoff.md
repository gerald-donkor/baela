# Baela — Admin Studio, ImageKit & Neon MCP

Detailed handoff for the session of **2026-10-07**, prepared across midnight on **2026-10-08**. Workspace: `/home/dgk/Projects/next/baela`.

## Resume here

The user asked for an admin dashboard that matches the existing landing page and design system, with admin-only course creation and ImageKit uploads. That dashboard is implemented in the current working tree. The supplied ImageKit configuration works, the existing instructor identity is configured locally, and Neon MCP has been installed and authenticated with read-only OAuth. The user has opened the real course editor and uploaded a cover image successfully.

Two upload-control issues reported through screenshots were fixed: the misleading native “No file chosen” label after successful upload, and a replacement-upload button that wrapped in the narrow cover panel. The latest button reads **Choose another**, fits the available width, and stays on one line.

The last product question was whether there is a place to add a trailer. **There is no dedicated trailer field yet.** The current workaround is a published free-preview lesson placed before other preview lessons. The user has not requested implementation of a separate trailer feature; their next message requested this handoff. Do not describe a dedicated trailer as implemented or assume it is authorized work.

Start with this document, then read [AGENTS.md](../AGENTS.md), [PLAN.md](../PLAN.md), [the implementation checkpoint](../docs/implementation-status.md), and [the shared design system](../docs/design-system.md). Inspect current source and git status before editing. Continue the existing implementation rather than rebuilding it.

## Repository and working-tree state

Observed while preparing this handoff:

- Branch: **`main`**.
- HEAD: **`16d3d24671047fcc1aaf01289d01bdd3a0ee182a`**, `Merge pull request #5 from gerald-donkor/feat/interactive-geographic-globes`.
- Dashboard/configuration/UI changes from this session are **uncommitted**, including new files. Preserve them.
- No commit, push, PR, merge, deployment, database migration, or remote schema mutation was performed in this session.
- `.env.local` is ignored by git. The user supplied ImageKit values there; the agent added the existing instructor's immutable Auth ID. Preserve all values and do not print or commit credentials.
- The older [handoff README](README.md) contains a 2026-10-06 frontend-review checkpoint below its new latest-session pointer. Its branch, clean-tree claim, outstanding objective, and test counts are historical. This document is the entry point for this session.
- Files under [handoff/](../handoff/README.md) describe a still older backend checkpoint. Use them for historical context, not current completion claims.

The tracked diff before this handoff contained 23 changed files, about 1,183 insertions and 420 deletions; `git diff --stat` excludes the new, untracked Studio files. The source map below lists both types. The handoff itself adds another new file and updates `handoff-session/README.md`.

## User requests and outcomes

| Request or report                                                                | Work and result                                                                                                                                                                                  |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Inspect the codebase and plan; build an admin dashboard matching the application | Read project context and the existing backend; built the Horizon Studio UI around existing guarded services and real database data.                                                              |
| Only administrators can create courses                                           | Preserved the server's immutable instructor-ID checks for pages, commands, and uploads. No client-editable admin role or first-user promotion was introduced.                                    |
| Use ImageKit; user supplied config in `.env.local`                               | Added support for their server-side variable names and `IMAGEKIT_FOLDER=dev`, fixed upload signature expiry, and checked account access without uploading files.                                 |
| How to verify the page / “at /what?”                                             | Studio is at **`http://localhost:3000/admin`**. Sign in with the existing instructor account. Initially the admin ID was missing; that is now resolved locally.                                  |
| Set up Neon MCP and configure it ourselves, using official docs                  | Installed the hosted server in global Codex config, completed user-approved read-only OAuth, inspected the existing database read-only, and configured the instructor ID locally.                |
| Is there a thumbnail upload section?                                             | It is labeled **Course cover**, under a course's **Course details** tab. JPEG/PNG/WebP, up to 10 MB. Upload completion saves the cover automatically.                                            |
| Uploaded image still said “No file chosen”                                       | The upload had succeeded; the browser's input had been cleared to permit same-file reselection. Replaced the visible native control with a styled button and kept the selected filename visible. |
| “Choose another image” did not fit the upload box                                | Shortened the label to **Choose another**, made the button fill the available inner width, and applied single-line text and 12px sizing. Verified inside the actual narrow Studio panel.         |
| Is there a place to add a trailer?                                               | Explained the free-preview lesson workflow. No dedicated trailer implementation was made.                                                                                                        |
| Detailed handoff in `handoff-session`, with an identifiable name                 | This document; the folder README points here.                                                                                                                                                    |

## Dashboard and authoring implementation

Studio follows the existing **Horizon** palette, semantic tokens, Geist typography, radii, and shared controls in both themes. The design direction was already accepted through the landing page; no independent dashboard palette was introduced. See [Studio design notes](../design/studio-ui.md) for the visual plan and [design tokens](../design/tokens.css) for exact values.

The implemented workspace includes:

- Responsive persistent navigation: Courses, Media library, Students, Refund requests, Background jobs, Settings, and View your site. On small screens navigation wraps into a horizontal presentation.
- A course dashboard with real total/published/draft/student counts, a next-step guide, and an ImageKit configuration indicator.
- Course search, status filtering, sorting, curriculum counts, and real empty states.
- A New course dialog with automatic title-to-slug generation. Manual slug edits stop later title changes from replacing the chosen slug. New courses start as private drafts.
- A course editor with **Course details**, **Curriculum**, and **Publishing** tabs. Details include title, URL, short/full descriptions, private cover preview, upload, and removal.
- Existing section/lesson authoring, reordering, visual/Markdown/rendered preview editing, private video and attachment uploads, saved drafts, draft preview, explicit publication, and retirement.
- Unsaved lesson changes disable saved-draft publication and warn when switching workspace views. Uploaded media does not publish a lesson automatically.
- A publishing checklist and Polar product connection. Publishing still requires the existing backend checks; at least one non-retired published lesson and an active course offer are necessary. The cover checklist item is optional for publication.
- A reusable media library with upload types, name search, media filters, private image previews, file details, and video readiness verification.
- Restyled student, refund, job, and settings pages; loading and retry/error states for Studio.

`getStudioOverview()` groups section and lesson aggregates independently before joining courses, avoiding multiplied counts. Retired lessons are excluded; active student counts exclude the configured administrator. Its integration regression uses embedded PostgreSQL.

Course/section metadata changes save immediately; lesson content remains in immutable draft revisions until explicitly published. Preserve that distinction in future UI changes. Detailed backend contracts remain in [PLAN.md](../PLAN.md), [operations](../docs/operations.md), and the existing services rather than being reproduced here.

### Route map

| Route                       | Purpose                                                              |
| --------------------------- | -------------------------------------------------------------------- |
| `/admin`                    | Course dashboard/library and draft creation                          |
| `/admin/courses/[id]`       | Course editor; ID is the database course UUID                        |
| `/admin/media`              | ImageKit media library and uploads                                   |
| `/admin/users`              | Students and access records                                          |
| `/admin/refunds`            | Refund request review                                                |
| `/admin/jobs`               | Failed background jobs and retry                                     |
| `/admin/settings`           | Provider setup indicators, public/business details, offers, policies |
| `/admin/preview/[id]`       | Authorized lesson draft preview                                      |
| `/auth/sign-in?next=/admin` | Sign in and return to Studio                                         |
| `/courses/[courseSlug]`     | Public course sales page; published preview playback                 |
| `/design-system`            | Existing shared component gallery                                    |

The user's screenshots show a real course called **Claude Code Tutorial**, slug **`claude-code-tutorial`**, at `/admin/courses/22790ddf-5ff2-4476-ba28-2278ec8b899e`. They show its short description, a saved cover, and an Image uploaded confirmation. An earlier screenshot showed one section and zero lessons/published lessons; that is screenshot evidence, not a fresh database count at handoff time. Preserve this real course and its uploaded assets.

## Authorization and local configuration

The plan defines a single creator/instructor. In [lib/auth/server.ts](../lib/auth/server.ts), `getViewer()` compares the authenticated Neon user ID to `ADMIN_AUTH_USER_ID`. It does not derive administrator access from the user's email or the Neon `role` string. The existing Auth row had a normal user role; that was not changed.

`requireAdminPage()` redirects anonymous visitors to sign-in and hides private pages from non-admin/inactive users. `requireAdmin()` protects services/API operations. [proxy.ts](../proxy.ts) also handles authentication routing. Preserve server checks even if navigation hides controls.

A read-only database inspection found exactly one verified, unbanned Auth account and a matching active `public.app_users` mapping. That account's immutable ID was set as `ADMIN_AUTH_USER_ID` in `.env.local`. Personal account details and the ID are intentionally omitted from this handoff; read the local value only if necessary, without printing it.

Local configuration presence was checked while preparing this document:

| Configuration                                                                 | Current local state                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`               | Present; database/Auth hosts correspond to the same endpoint        |
| `ADMIN_AUTH_USER_ID`                                                          | Present; configured for the existing verified instructor            |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`        | Present                                                             |
| `IMAGEKIT_FOLDER`                                                             | Present; `dev`, normalized to `/dev`                                |
| `IMAGEKIT_ID`                                                                 | Present, user-supplied; not required by the current app integration |
| Legacy `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`, `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | Absent locally; still supported as fallbacks                        |
| `NEON_API_KEY`, `NEON_PROJECT_ID`, `NEON_BRANCH_ID`                           | Absent                                                              |
| `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`                                  | Absent                                                              |
| `CRON_SECRET`, `NEXT_PUBLIC_SENTRY_DSN`                                       | Absent                                                              |

MCP OAuth is independent of the application management credentials. It does **not** satisfy the deletion worker's missing `NEON_API_KEY`/project/branch configuration. Do not copy MCP tokens into the application's environment.

The Studio addition in `PLAN.md` still says admin identity configuration remains required. That sentence is now stale for this local workspace; the updated implementation checkpoint and this handoff reflect the completed local configuration. Deployment environments still require their own configuration.

## ImageKit details and upload fixes

The app uses `@imagekit/nodejs` **7.12.1** and `@imagekit/next` **2.1.6**. Configuration is centralized in [lib/server/imagekit.ts](../lib/server/imagekit.ts):

- `imagekitPublicKey()` prefers `IMAGEKIT_PUBLIC_KEY`, with the earlier public-name fallback.
- `imagekitUrlEndpoint()` does the same for `IMAGEKIT_URL_ENDPOINT`.
- `imagekitUploadFolder()` normalizes leading/trailing slashes, defaults to `/baela`, and validates folder segments. Current local uploads use `/dev/image`, `/dev/video`, and `/dev/attachment`.
- `isImageKitConfigured()` reports required values being present. The UI label **Credentials configured** does not claim streaming acceptance.
- `signedAsset()` signs private paths against the configured endpoint. Already registered paths are preserved if the upload root changes.

The important signature fix: the installed SDK's `getAuthenticationParameters()` second argument behaves as an **absolute Unix expiry timestamp**, despite misleading duration wording in its comment. Authorization now passes `Math.floor(Date.now() / 1000) + 300`; passing `300` would produce an already-expired timestamp. [tests/admin-uploads.test.ts](../tests/admin-uploads.test.ts) includes a real-SDK HMAC regression for this contract.

The guarded [upload API](../app/api/admin/uploads/route.ts) checks same-origin requests and administrator access. Its actions authorize a short-lived direct browser upload, register the provider's file metadata, verify video processing, and supply authorized image preview URLs. Registration requires a private object within the configured root and the correct media-kind subfolder; it checks size and extension. The browser never receives the private key.

The uploader sends files directly to ImageKit with private-file and unique-name options. It shows transfer progress and awaits both registration and the consumer callback. A pending attempt stores `fileId` and, after registration, the asset. Retry after registration or callback failure reuses the transferred file instead of uploading it again. Cover saving uses the existing dedicated `course-cover` command, avoiding stale metadata overwrites.

Current accepted formats/limits from [lib/config.ts](../lib/config.ts):

| Type                 | Files           | Maximum             |
| -------------------- | --------------- | ------------------- |
| Course/lesson images | JPEG, PNG, WebP | 10,000,000 bytes    |
| Video                | MP4             | 2,000,000,000 bytes |
| Attachments          | PDF, ZIP, PPTX  | 50,000,000 bytes    |

Video upload is followed by **Verify processing**; readiness checks source metadata and the appropriate signed delivery resource. Real HLS/MP4 playback and expiry acceptance remain outstanding.

### Latest picker presentation

[components/admin/uploader.tsx](../components/admin/uploader.tsx) now keeps the native file input hidden and activates it through an accessible shared `Button` and `inputRef`. The input value is still reset after selection so choosing the same file again fires a change event. A separate filename display persists after completion within the mounted uploader.

The button starts as **Choose image**, **Choose video**, or **Choose resource** and becomes **Choose another** once a file is selected. `.uploadButton` in [studio.module.css](../components/admin/studio.module.css) uses full available width, `min-width: 0`, `white-space: nowrap`, and 12px text; the shared small button retains its 36px height. This fixed the screenshot's wrapped text without changing the global button sizing. The prompt's article was corrected to “an image.”

Filename state is local UI state. A full reload does not populate that selection from the existing saved cover, but the real cover preview remains. The hidden input cannot display the misleading native empty-file label.

## Neon MCP setup and verification

The user explicitly requested setup using [Neon's official overview](https://neon.com/docs/ai/neon-mcp-server) and [documentation index](https://neon.com/docs/llms.txt). The [CLI MCP guide](https://neon.com/docs/cli/mcp), [client connection guide](https://neon.com/docs/ai/connect-mcp-clients-to-neon), and [official Codex MCP docs](https://developers.openai.com/codex/mcp) were checked.

`npx neon@latest mcp --help` was attempted with npm cache under `/tmp/baela-neon-npm-cache`; the npm registry request timed out. No Neon dependency was added to `package.json`. The supported Codex command was used to configure the same official hosted server instead:

```sh
codex mcp add neon --url 'https://mcp.neon.tech/mcp?readonly=true'
codex mcp login neon --scopes read
```

Actual CLI used in this session:

```text
/home/dgk/.codex/packages/app-server-daemon/releases/0.161.0-x86_64-unknown-linux-musl/bin/codex
```

The ordinary `/home/dgk/.local/bin/codex` wrapper tried to use mise and attempted a package install in a read-only location under sandbox restrictions. Use the installed binary if that wrapper still fails; do not infer this path will remain valid after Codex updates.

Configuration is stored **outside this repository**, in `/home/dgk/.codex/config.toml`:

```toml
[mcp_servers.neon]
url = "https://mcp.neon.tech/mcp?readonly=true"
```

Existing `node_repl`, `clerk`, and `figma` configurations were preserved. No project-level `.codex/config.toml` was created. The hosted Streamable HTTP endpoint is used; no deprecated local Neon server package or `/sse` endpoint is configured.

`mcp add` automatically started OAuth with advertised read/write scopes. That first flow was interrupted, and login was restarted explicitly with **read** scope. The user approved the browser authorization and replied **Authorization completed**. The CLI printed a successful login; a subsequent elevated `codex mcp list --json` reported the `neon` server enabled with `auth_status: "o_auth"`. Credentials remain in Codex's authentication storage and were not printed or added to the project.

The current URL is read-only and **not project-scoped**. Project IDs were not retrieved. No database writes were needed for the task, and no broader OAuth grant was requested.

Distinguish persisted authentication from live tool availability: new Neon tools did not become callable through the current session's tool inventory. Two temporary app-server/proxy probes for inventory discovery timed out during initialization. They do not establish a Neon tool-call success or an account/auth failure. The user was told to **reload Codex** to expose the new connection's tools. In the next session, discover the tools again and verify them before claiming to have used Neon MCP for a query.

The database inspections that identified the instructor used the already installed Neon serverless driver with `DATABASE_URL` in explicit read-only transactions. They inspected table/column metadata and limited identity records; they did not use the newly installed MCP connection or alter Auth roles/database rows.

## Validation and evidence

Keep the phases separate when reporting results. The final small picker fixes were linted, typechecked, and browser-verified after the earlier full build; the full production build was **not rerun after those last UI-only edits**.

| Phase/check                                          | Observed result and limit                                                                                                                                                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main Studio implementation: ESLint and TypeScript    | Passed                                                                                                                                                                                                                                   |
| Main Studio implementation: Vitest                   | **99 tests across nine files passed**                                                                                                                                                                                                    |
| Main Studio implementation: webpack production build | Passed, using `npm run build -- --webpack` outside the sandbox where required                                                                                                                                                            |
| Selected production Playwright checks                | **Eight passed** across desktop/mobile Chromium, covering anonymous protected routes, security boundaries, theme persistence, and shared controls                                                                                        |
| Broad Studio UI exercise                             | Passed course search/filter/sort, dialog focus/Escape, automatic/custom slugs, dirty-draft protection, empty states, and mocked registration retry; both themes, library widths 320/390/768/1024/1440 and editor widths 320/390/768/1440 |
| ImageKit account check                               | Authenticated read-only `assets.list` succeeded; URL endpoint had valid HTTPS format; agent did not upload files                                                                                                                         |
| Neon database inspection                             | Read-only queries succeeded; application/Auth schemas present; sole verified active identity matched the app record                                                                                                                      |
| Neon MCP authentication                              | Successful OAuth login and saved `o_auth` status; live tool discovery in this session remained unavailable                                                                                                                               |
| Running local protected routes                       | Anonymous `/admin` and `/admin/media` returned sign-in redirects; `/auth/sign-in?next=/admin` returned 200                                                                                                                               |
| User's real cover-upload screenshots                 | Show the real private editor, saved cover preview, uploaded filename, and success message; useful evidence of a real image upload, not full video/platform acceptance                                                                    |
| “No file chosen” fix                                 | Targeted ESLint, TypeScript/typegen, and diff checks passed; mocked keyboard selection, same-file reselection, filename persistence, and retry passed; both themes at 320px                                                              |
| Final narrow button fix                              | Targeted ESLint, typecheck, and diff checks passed; actual StudioPanel width/padding exercised at 1280/390/320 viewports in both themes; button centered, text one line, text inside bounds, height 36px, no page overflow               |

Permanent Studio screenshots are indexed in [design/previews/README.md](../design/previews/README.md). Seven image files saved in the workspace are currently untracked: the four `studio-library-{dark,light}-{1440,390}.png` combinations, `studio-curriculum-dark-1440.png`, `studio-curriculum-light-390.png`, and `studio-publishing-dark-1440.png`. They depict labeled test fixtures in a temporary preview, not real database fixtures. No fake courses or users were inserted.

The latest button screenshots remain in `/tmp/baela-upload-label-dark.png` and `/tmp/baela-upload-label-light.png`; they were visually inspected. They show the actual uploader and StudioPanel with mocked uploads, and may disappear after cleanup/reboot.

User-provided screenshots remain at:

- `/home/dgk/Pictures/screenshot-2026-10-07_23-43-14.png`: successful cover upload with the native empty-file label circled.
- `/home/dgk/Pictures/screenshot-2026-10-07_23-51-42.png`: replacement picker text wrapping, circled.

These screenshots may contain account information. Inspect locally when useful; do not republish them as public assets.

Temporary `/design-system/studio-check` and `/design-system/upload-check` routes were removed after their browser checks. The latter was recreated briefly for the narrow-panel verification and removed again. Only the original `app/design-system/page.tsx` remains; no temporary preview or authentication bypass is part of the final implementation.

### Temporary helper scripts

These are debugging artifacts, not supported project commands:

| File                                 | Meaning / caution                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/tmp/baela-studio-qa.cjs`           | Earlier Studio UI checks; expects the now-removed preview route and a local server on 3100                                              |
| `/tmp/baela-imagekit-check.cjs`      | Read-only account check; loads local env and uses the actual SDK                                                                        |
| `/tmp/baela-neon-inspect.cjs`        | Read-only identity inspection; prints personal identity records, so do not rerun casually or paste its output                           |
| `/tmp/baela-neon-mcp-check.cjs`      | App-server/proxy discovery attempt that timed out; not proof of successful MCP tool discovery                                           |
| `/tmp/baela-upload-label-check.cjs`  | Latest mocked uploader/browser exercise with centered, single-line button geometry assertions; expects the removed upload preview route |
| `/tmp/baela-codex-appserver-schema/` | Generated schemas from the installed Codex binary; temporary protocol debugging data                                                    |

Do not run the old QA helpers expecting the removed routes to exist. Recreate only a local isolated fixture if useful, intercept all external mutations, remove it afterward, and ensure route type generation no longer references it.

## Source map of this session's changes

Use current files and diffs for implementation details; this index avoids duplicating their contents.

| Area                            | New or modified files                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Studio shell/design primitives  | New `components/admin/studio-shell.tsx`, `studio-ui.tsx`, `studio-dashboard.tsx`, `studio.module.css`                                                                          |
| Course inventory/draft creation | New `components/admin/course-library.tsx`, `new-course-dialog.tsx`; modified `app/admin/page.tsx`, `components/admin/command-form.tsx`                                         |
| Course workspace                | Modified `components/admin/course-editor.tsx`, `app/admin/courses/[id]/page.tsx`                                                                                               |
| Upload picker                   | Modified `components/admin/uploader.tsx`; styles in the new Studio CSS Module                                                                                                  |
| Media library                   | New `components/admin/media-library.tsx`, `app/admin/media/page.tsx`                                                                                                           |
| Studio layout/states            | Modified `app/admin/layout.tsx`; new `app/admin/loading.tsx`, `app/admin/error.tsx`                                                                                            |
| Administrative subpages         | Modified `app/admin/users/page.tsx`, `refunds/page.tsx`, `jobs/page.tsx`, `settings/page.tsx`                                                                                  |
| Real aggregate data             | New `lib/server/studio.ts`                                                                                                                                                     |
| ImageKit configuration/signing  | Modified `lib/server/imagekit.ts`, `app/api/admin/uploads/route.ts`, `app/api/media/sign/route.ts`                                                                             |
| Shared button cursor/state      | Modified `components/ui/button.tsx`; preserve pointer styling for enabled buttons and existing disabled behavior                                                               |
| Launch setup                    | Modified `.env.example`, `scripts/verify-launch.ts`; local ignored `.env.local` populated/configured                                                                           |
| Tests                           | New `tests/admin-uploads.test.ts`; modified `tests/integration.test.ts`, `tests/e2e/public.spec.ts`                                                                            |
| Documentation                   | Modified `README.md`, `PLAN.md`, `docs/design-system.md`, `docs/implementation-status.md`, `design/previews/README.md`; new `design/studio-ui.md` and seven Studio screenshots |
| External Codex setup            | `/home/dgk/.codex/config.toml`, authenticated Neon OAuth storage outside the repo                                                                                              |
| This handoff                    | New file here; latest-session pointer added to `handoff-session/README.md`                                                                                                     |

Existing backend authoring commands in [lib/server/admin.ts](../lib/server/admin.ts), managed images in [components/managed-image.tsx](../components/managed-image.tsx), Auth guards, media access services, and the database schema remain central contracts. They were inspected/reused rather than replaced wholesale.

## Trailer: exact current behavior and continuation point

There is no course-level trailer upload or `trailerAssetId` field. The user was instructed to:

1. Open the course → **Curriculum**.
2. Add a lesson named **Course trailer**.
3. Upload an MP4 and **Verify processing**.
4. Enable **Free preview: video, text, and attachments**.
5. **Save draft → Publish saved draft**.
6. Put that lesson before other preview lessons; the published course page selects the first published free-preview lesson.

The real sales page [app/courses/[courseSlug]/page.tsx](../app/courses/[courseSlug]/page.tsx) uses `detail.curriculum.find((l) => l.preview)` and renders `LessonPlayer` for it. It does not select a separate trailer asset. `courses.previewLessonId` exists in [the schema](../lib/db/schema.ts) but is not wired into this selection or exposed as a dedicated Studio trailer selector. Do not assume that column provides an implemented trailer feature.

Sample course routes can render `CourseWorkspace` from `lib/sample-courses` before database lookup. Those are sample learning screens; their static playback/progress are not proof of real course authoring or media delivery. Test new trailer behavior against real published-course routes if the user later requests it.

If a separate trailer is requested next, assess the sales-page playback, public media authorization, preview semantics, draft/publication behavior, and schema/migration implications before building it. A direct public URL for an arbitrary private asset would bypass the existing lesson-based media boundary. The current read-only MCP grant cannot run migrations; do not silently broaden it. Implementing this feature is a future request, not unfinished work from this session.

## Running locally and continuing verification

The user's development server was already running at **`http://localhost:3000`**. An attempted second `npm run dev -- --webpack` detected the same project already running and exited; that duplicate was not left running, and the user's server was not killed. Check current listeners before starting another server. The process ID observed during setup is historical and should not be used blindly.

For local Studio verification, visit `/admin`, sign in with the configured instructor, and open a course's details/curriculum. After environment edits, restart the user's dev server when necessary. For a new server in this environment, `npm run dev -- --webpack` is an available fallback. Do not overwrite `.env.local` with `.env.example`.

Use appropriate checks for actual changes:

```sh
npm run check
npm run build -- --webpack
npm run test:e2e -- --project=desktop --project=mobile --grep 'protected pages|security boundaries|theme preference|buttons and expandable' --workers=2
git diff --check
```

The selected Playwright command reproduces the scope of the eight earlier production cases. `playwright.config.ts` starts a production server on **3100**, with database/Auth intentionally blank unless its auth-test mode is enabled. It does not test the user's live account or production payments. A new production build is required before interpreting it as evidence for later UI edits.

Shell network access, browser launching, local listeners, writes outside the workspace, and some webpack runs needed approved execution outside the sandbox. No automatic approval-review rejection occurred in this session. The npm timeout and app-server discovery timeouts were connectivity/protocol-check failures, not authorization rejections.

WebKit/Safari remains an earlier host limitation: compatible `libicu74`, `libxml2`, and `libflite1` libraries are missing. No Safari/real-device certification was gained here. No subagents were used. Do not delegate unless the user or applicable instructions explicitly request it.

## Remaining work and limits

No requested code fix is pending. The user is moving the conversation to another session. Prioritize their next instruction and preserve this checkpoint.

The platform is not production-validated. Remaining acceptance work is documented in [docs/implementation-status.md](../docs/implementation-status.md) and [docs/launch.md](../docs/launch.md), including:

- Real video upload, processing, private HLS/MP4 playback, signed manifest/segment paths, URL expiry, and unsigned-access rejection.
- Complete authenticated authoring/preview/reordering/publication/retirement acceptance, and student/non-admin permission checks. The user demonstrated cover upload, not all these flows.
- Polar sandbox credentials, products, signed webhooks, purchases/refunds/cancellation, seller eligibility, legal/business configuration, and reviewed policies. Local Polar credentials are absent, so full course publication/product mapping is not ready locally.
- Project/branch-scoped Neon management credentials and real disposable-student deletion acceptance. Read-only MCP OAuth does not replace them.
- Cron secret/worker monitoring, Sentry, public domain/origins, actual content/support details, service budgets, backup/restore rehearsal, and cross-browser/real-device acceptance.
- Final production build and appropriate tests for any changes made in the next session; the newest picker edits have targeted verification but postdate the earlier production build.

No paid service purchases or paid API-generation jobs were performed. Image generation services were unnecessary for the dashboard; existing design assets and code-native UI were used.

## Suggested skills and framework rules

- **frontend-design**: read `.agents/skills/frontend-design/SKILL.md` for continued UI work. Preserve the accepted Horizon direction and use rendered narrow-panel/mobile checks, not only a wide isolated uploader.
- **openai-docs**: read `/home/dgk/.codex/skills/.system/openai-docs/SKILL.md` when troubleshooting Codex MCP/configuration. Prefer installed CLI help/config evidence and official OpenAI documentation.
- **handoff**: `.agents/skills/handoff/SKILL.md` is the repository handoff workflow. Its temporary-directory default was superseded by this user's explicit requested workspace destination. Keep secrets and personal identity details out of future handoffs; refer to existing artifacts rather than duplicating entire specs/diffs.

`AGENTS.md` requires reading relevant **installed Next.js guides** in `node_modules/next/dist/docs/` before framework-dependent changes. The repo pins **Next.js 16.3.8 / React 19.2.8**; older training assumptions can be wrong. This session consulted installed layout, forms/auth, server/client, and CSS guidance as appropriate. Keep the Next-generated AGENTS block intact.

## Suggested fresh-session prompt

> Continue in `/home/dgk/Projects/next/baela`. Read `handoff-session/2026-10-07-admin-studio-imagekit-neon-handoff.md`, `AGENTS.md`, and the current plan/design documentation first. Preserve the uncommitted Admin Studio implementation and my local configuration. The dashboard, ImageKit cover upload, admin identity, and read-only Neon MCP setup are complete. The latest uploader button is fixed. There is currently no separate trailer field; only a published free-preview lesson workflow. Inspect the current state and continue with my next request, without recreating the dashboard or claiming unverified video/payment/production acceptance.
