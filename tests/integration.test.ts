import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq, getTableName } from "drizzle-orm";
import { readdirSync, readFileSync } from "node:fs";
import * as schema from "@/lib/db/schema";
const state = vi.hoisted(() => ({
  db: null as unknown,
  viewer: null as unknown,
}));
vi.mock("@/lib/db", () => ({
  withDb: (fn: (db: unknown) => Promise<unknown>) => fn(state.db),
}));
vi.mock("@/lib/auth/server", () => ({
  getViewer: () => state.viewer,
  requireUser: () => state.viewer,
  requireAdmin: () => state.viewer,
}));
vi.mock("@/lib/server/imagekit", () => ({
  signedAsset: vi.fn(() => "https://example.test/signed"),
}));
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/server/polar", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/server/polar")>()),
  polarApi: vi.fn(),
}));
import { polarApi } from "@/lib/server/polar";
import { enqueue, runJobs } from "@/lib/server/jobs";
import { authorizedLesson } from "@/lib/server/catalog";
const pg = new PGlite();
const db = drizzle(pg, { schema });
const userId = "00000000-0000-4000-8000-000000000001",
  courseId = "00000000-0000-4000-8000-000000000002",
  offerId = "00000000-0000-4000-8000-000000000003";
const start = new Date(Date.now() - 86400000).toISOString(),
  end = new Date(Date.now() + 86400000 * 29).toISOString();
const customer = { id: "customer-1", external_id: userId };
function sub(extra = {}) {
  return {
    id: "sub-1",
    customer,
    product_id: "monthly",
    status: "active",
    current_period_start: start,
    current_period_end: end,
    cancel_at_period_end: false,
    modified_at: start,
    created_at: start,
    ends_at: null,
    ...extra,
  };
}
function order(extra = {}) {
  return {
    id: "order-1",
    customer,
    product_id: "course-product",
    subscription_id: null,
    subscription: null,
    net_amount: 833,
    refunded_amount: 0,
    currency: "usd",
    paid: true,
    status: "paid",
    modified_at: start,
    created_at: start,
    ...extra,
  };
}
async function event(
  type: string,
  data: Record<string, unknown>,
  id = crypto.randomUUID(),
) {
  await db
    .insert(schema.webhookEvents)
    .values({ id, type, payload: { type, data } })
    .onConflictDoNothing();
  await enqueue(db as never, "webhook", "webhook:" + id, { eventId: id });
  await runJobs();
  return id;
}
beforeAll(async () => {
  for (const file of readdirSync("drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await pg.exec(readFileSync("drizzle/" + file, "utf8"));
  state.db = db;
});
beforeEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await pg.exec(
    "TRUNCATE " +
      Object.values(schema)
        .map((t) => '"' + getTableName(t) + '"')
        .join(",") +
      " CASCADE",
  );
  vi.mocked(polarApi).mockReset();
  state.viewer = {
    id: userId,
    email: "student@example.test",
    state: "active",
    verified: true,
    admin: false,
  };
  await db.insert(schema.users).values({
    id: userId,
    authId: "auth-1",
    name: "Student",
    email: "student@example.test",
  });
  await db.insert(schema.courses).values({
    id: courseId,
    slug: "course",
    title: "Course",
    status: "published",
  });
  await db.insert(schema.offers).values({
    id: offerId,
    kind: "course",
    courseId,
    productId: "course-product",
    amount: 833,
  });
});
afterAll(() => pg.close());
describe("durable commerce", () => {
  it("deduplicates delivery and never resurrects a refunded grant", async () => {
    let current = order();
    vi.mocked(polarApi).mockImplementation(async () => current);
    const id = await event("order.paid", current);
    await event("order.paid", current, id);
    expect(await db.select().from(schema.entitlements)).toHaveLength(1);
    current = order({
      refunded_amount: 833,
      status: "refunded",
      modified_at: new Date().toISOString(),
    });
    await event("order.refunded", current);
    current = order();
    await event("order.paid", current);
    expect(
      (await db.select().from(schema.entitlements))[0].revokedAt,
    ).not.toBeNull();
  });
  it("retains access after partial refund and removes it after cumulative full refund", async () => {
    let current = order();
    vi.mocked(polarApi).mockImplementation(async () => current);
    await event("order.paid", current);
    current = order({
      refunded_amount: 100,
      modified_at: new Date().toISOString(),
    });
    await event("order.refunded", current);
    expect(
      (await db.select().from(schema.entitlements))[0].revokedAt,
    ).toBeNull();
    current = order({
      refunded_amount: 833,
      modified_at: new Date(Date.now() + 1).toISOString(),
    });
    await event("order.refunded", current);
    expect(
      (await db.select().from(schema.entitlements))[0].revokedAt,
    ).not.toBeNull();
  });
  it("does not grant access to an unpaid order", async () => {
    const current = order({ paid: false, status: "pending" });
    vi.mocked(polarApi).mockResolvedValue(current);
    await event("order.created", current);
    expect(await db.select().from(schema.entitlements)).toHaveLength(0);
  });
  it("preserves the period in a delayed paid-order snapshot", async () => {
    await db
      .update(schema.offers)
      .set({
        kind: "monthly",
        courseId: null,
        productId: "monthly",
        amount: 1667,
      })
      .where(eq(schema.offers.id, offerId));
    const current = order({
      subscription_id: "sub-1",
      product_id: "monthly",
      subscription: {
        current_period_start: end,
        current_period_end: new Date(Date.now() + 86400000 * 60).toISOString(),
      },
    });
    vi.mocked(polarApi).mockImplementation(async (path) =>
      path.startsWith("/orders/") ? current : sub(),
    );
    await event("order.paid", {
      ...current,
      subscription: { current_period_start: start, current_period_end: end },
    });
    const grant = (await db.select().from(schema.entitlements))[0];
    expect(grant.endsAt?.toISOString()).toBe(end);
  });
  it("cancels renewal when lifetime arrives before subscription delivery", async () => {
    await db
      .update(schema.offers)
      .set({
        kind: "lifetime",
        courseId: null,
        productId: "lifetime",
        amount: 8333,
      })
      .where(eq(schema.offers.id, offerId));
    const current = order({ product_id: "lifetime", net_amount: 8333 });
    vi.mocked(polarApi).mockImplementation(async (path, method) =>
      method === "PATCH"
        ? sub({ cancel_at_period_end: true })
        : path.startsWith("/orders/")
          ? current
          : sub(),
    );
    await event("order.paid", current);
    await event("subscription.created", sub());
    await runJobs();
    expect(vi.mocked(polarApi)).toHaveBeenCalledWith(
      "/subscriptions/sub-1",
      "PATCH",
      { cancel_at_period_end: true },
      expect.any(String),
    );
    expect((await db.select().from(schema.entitlements))[0].kind).toBe(
      "lifetime",
    );
  });
  it("queues retries without acknowledging a job as complete", async () => {
    vi.mocked(polarApi).mockRejectedValue(
      new Error("Provider temporarily unavailable"),
    );
    await event("order.paid", order());
    const job = (await db.select().from(schema.jobs))[0];
    expect(job.doneAt).toBeNull();
    expect(job.attempts).toBe(1);
    expect(job.runAt.getTime()).toBeGreaterThan(Date.now());
  });
});
describe("published lesson isolation", () => {
  it("uses published content and blocks unpublished paid bodies", async () => {
    const [section] = await db
      .insert(schema.sections)
      .values({ courseId, title: "Section", position: 0 })
      .returning();
    const [lesson] = await db
      .insert(schema.lessons)
      .values({ sectionId: section.id, title: "Lesson", position: 0 })
      .returning();
    const [published] = await db
      .insert(schema.revisions)
      .values({
        lessonId: lesson.id,
        title: "Public title",
        markdown: "Published",
        preview: true,
      })
      .returning();
    const [draft] = await db
      .insert(schema.revisions)
      .values({
        lessonId: lesson.id,
        title: "Secret title",
        markdown: "Secret draft",
        preview: false,
      })
      .returning();
    await db
      .update(schema.lessons)
      .set({ publishedRevisionId: published.id, draftRevisionId: draft.id })
      .where(eq(schema.lessons.id, lesson.id));
    expect(
      (await authorizedLesson(db as never, lesson.id)).revision.markdown,
    ).toBe("Published");
    await db
      .update(schema.revisions)
      .set({ preview: false })
      .where(eq(schema.revisions.id, published.id));
    await expect(
      authorizedLesson(db as never, lesson.id),
    ).rejects.toMatchObject({ status: 403 });
  });
});

async function playableLesson(preview = false) {
  const [section] = await db
    .insert(schema.sections)
    .values({ courseId, title: "Section", position: 0 })
    .returning();
  const [lesson] = await db
    .insert(schema.lessons)
    .values({ sectionId: section.id, title: "Lesson", position: 0 })
    .returning();
  const [video] = await db
    .insert(schema.assets)
    .values({
      fileId: "video",
      filePath: "/baela/video.mp4",
      name: "Video",
      kind: "video",
      mime: "video/mp4",
      size: 100,
      duration: 100,
      ready: true,
      private: true,
    })
    .returning();
  const [revision] = await db
    .insert(schema.revisions)
    .values({
      lessonId: lesson.id,
      title: "Lesson",
      videoId: video.id,
      preview,
    })
    .returning();
  await db
    .update(schema.lessons)
    .set({ publishedRevisionId: revision.id })
    .where(eq(schema.lessons.id, lesson.id));
  return lesson.id;
}
function request(path: string, data: unknown) {
  return new Request("http://localhost:3000" + path, {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
describe("student API boundaries", () => {
  it("blocks media signing for an unowned paid lesson", async () => {
    const lessonId = await playableLesson();
    const { POST } = await import("@/app/api/media/sign/route");
    expect((await POST(request("/api/media/sign", { lessonId }))).status).toBe(
      403,
    );
  });
  it("blocks unrelated asset IDs even on a preview", async () => {
    const lessonId = await playableLesson(true);
    const { POST } = await import("@/app/api/media/sign/route");
    expect(
      (
        await POST(
          request("/api/media/sign", {
            lessonId,
            assetId: crypto.randomUUID(),
          }),
        )
      ).status,
    ).toBe(403);
  });
  it("does not overwrite progress with stale requests or auto-complete an explicitly undone lesson", async () => {
    const lessonId = await playableLesson(true);
    const { POST } = await import("@/app/api/progress/route");
    const { sessionId } = await (
      await POST(request("/api/progress", { lessonId }))
    ).json();
    const save = (data: Record<string, unknown>) =>
      POST(request("/api/progress", { lessonId, sessionId, ...data }));
    await save({ sequence: 2, position: 96, intervals: [[0, 96]] });
    expect((await db.select().from(schema.progress))[0].completed).toBe(true);
    await save({ sequence: 1, position: 5 });
    expect((await db.select().from(schema.progress))[0].position).toBe(96);
    await save({ sequence: 3, complete: false });
    await save({ sequence: 4, intervals: [[0, 100]] });
    expect((await db.select().from(schema.progress))[0].completed).toBe(false);
  });
  it("rejects a playback session owned by a different student", async () => {
    const lessonId = await playableLesson(true);
    const [other] = await db
      .insert(schema.users)
      .values({ authId: "other", name: "Other", email: "other@example.test" })
      .returning();
    const [session] = await db
      .insert(schema.playbackSessions)
      .values({ userId: other.id, lessonId })
      .returning();
    const { POST } = await import("@/app/api/progress/route");
    expect(
      (
        await POST(
          request("/api/progress", {
            lessonId,
            sessionId: session.id,
            sequence: 1,
            complete: true,
          }),
        )
      ).status,
    ).toBe(403);
  });
  it("reuses a checkout and recovers an ambiguous provider response without another POST", async () => {
    const product = {
      id: "course-product",
      is_recurring: false,
      is_archived: false,
      recurring_interval: null,
      recurring_interval_count: null,
      prices: [{ id: "price", price_amount: 833, price_currency: "usd" }],
    };
    let metadata = {};
    vi.mocked(polarApi).mockImplementation(async (path, method, body) => {
      if (path.startsWith("/products/")) return product;
      if (method === "POST") {
        metadata = (body as { metadata: object }).metadata;
        throw new Error("Response lost");
      }
      return {
        items: [
          {
            id: "checkout-1",
            url: "https://checkout.example.test/one",
            expires_at: end,
            metadata,
          },
        ],
      };
    });
    const { POST } = await import("@/app/api/checkout/route");
    expect((await POST(request("/api/checkout", { offerId }))).status).toBe(
      500,
    );
    const recovered = await POST(request("/api/checkout", { offerId }));
    expect(recovered.status).toBe(200);
    expect(await recovered.json()).toMatchObject({
      url: "https://checkout.example.test/one",
    });
    await POST(request("/api/checkout", { offerId }));
    expect(
      vi.mocked(polarApi).mock.calls.filter((c) => c[1] === "POST"),
    ).toHaveLength(1);
  });
});

describe("authoring regression coverage", () => {
  it("does not publish a course whose only published lesson is retired", async () => {
    const lessonId = await playableLesson();
    await db
      .update(schema.lessons)
      .set({ retiredAt: new Date() })
      .where(eq(schema.lessons.id, lessonId));
    const { POST } = await import("@/app/api/admin/route");
    expect(
      (
        await POST(
          request("/api/admin", {
            action: "course-status",
            id: courseId,
            status: "published",
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("saves a cover without overwriting edited course metadata", async () => {
    const [image] = await db
      .insert(schema.assets)
      .values({
        fileId: "cover",
        filePath: "/baela/image/cover.png",
        name: "Cover",
        kind: "image",
        mime: "image/png",
        size: 10,
        ready: true,
      })
      .returning();
    await db
      .update(schema.courses)
      .set({ title: "New title" })
      .where(eq(schema.courses.id, courseId));
    const { POST } = await import("@/app/api/admin/route");
    expect(
      (
        await POST(
          request("/api/admin", {
            action: "course-cover",
            id: courseId,
            coverId: image.id,
          }),
        )
      ).status,
    ).toBe(200);
    expect((await db.select().from(schema.courses))[0]).toMatchObject({
      title: "New title",
      coverId: image.id,
    });
  });
  it("rejects unsupported HTML while allowing fenced HTML examples", async () => {
    const lessonId = await playableLesson();
    const lesson = (await db.select().from(schema.lessons))[0];
    const { POST } = await import("@/app/api/admin/route");
    const save = (markdown: string) =>
      POST(
        request("/api/admin", {
          action: "lesson",
          id: lessonId,
          sectionId: lesson.sectionId,
          title: "Lesson",
          videoId: null,
          attachmentIds: [],
          preview: false,
          markdown,
        }),
      );
    expect((await save("<div>not supported</div>")).status).toBe(400);
    expect((await save("```html\n<div>example</div>\n```")).status).toBe(200);
  });
  it("authorizes managed images only through the published revision", async () => {
    const lessonId = await playableLesson(true);
    const [image] = await db
      .insert(schema.assets)
      .values({
        fileId: "lesson-image",
        filePath: "/baela/image/image.png",
        name: "Diagram",
        kind: "image",
        mime: "image/png",
        size: 10,
        ready: true,
      })
      .returning();
    const { POST } = await import("@/app/api/media/sign/route");
    const sign = () =>
      POST(request("/api/media/sign", { lessonId, assetId: image.id }));
    expect((await sign()).status).toBe(403);
    await db.update(schema.revisions).set({ imageIds: [image.id] });
    expect((await sign()).status).toBe(200);
  });
});

describe("product and paid-period reconciliation", () => {
  const product = {
    id: "course-product",
    is_archived: false,
    is_recurring: true,
    recurring_interval: "year",
    recurring_interval_count: 1,
    prices: [{ id: "price", price_amount: 833, price_currency: "usd" }],
  };
  it("blocks checkout when the mapped one-time product becomes recurring", async () => {
    vi.mocked(polarApi).mockResolvedValue(product);
    const { POST } = await import("@/app/api/checkout/route");
    expect((await POST(request("/api/checkout", { offerId }))).status).toBe(
      409,
    );
    expect(await db.select().from(schema.checkoutIntents)).toHaveLength(0);
  });
  it("disables an incompatible product on synchronization without changing purchase history", async () => {
    vi.mocked(polarApi).mockResolvedValue(product);
    await event("product.updated", product);
    expect((await db.select().from(schema.offers))[0]).toMatchObject({
      active: false,
      productId: "course-product",
      amount: 833,
    });
  });
  it("waits for a paid snapshot instead of granting a newer canonical subscription period", async () => {
    await db
      .update(schema.offers)
      .set({ kind: "monthly", courseId: null, productId: "monthly" });
    const current = order({
      product_id: "monthly",
      subscription_id: "sub-1",
      subscription: { current_period_start: start, current_period_end: end },
    });
    vi.mocked(polarApi).mockImplementation(async (path) =>
      path.startsWith("/orders/") ? current : sub(),
    );
    await event("order.updated", current);
    expect(await db.select().from(schema.entitlements)).toHaveLength(0);
    expect((await db.select().from(schema.jobs))[0].doneAt).toBeNull();
    await event("order.paid", current);
    expect(
      (await db.select().from(schema.entitlements))[0].endsAt?.toISOString(),
    ).toBe(end);
  });
});

describe("account deletion lifecycle", () => {
  async function prepare() {
    await db.update(schema.users).set({ state: "deleting" });
    vi.stubEnv("NEON_PROJECT_ID", "test-project");
    vi.stubEnv("NEON_BRANCH_ID", "test-branch");
    vi.stubEnv("NEON_API_KEY", "test-key");
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    await enqueue(db as never, "delete_account", "delete:" + userId, {
      userId,
    });
    return fetcher;
  }
  it("cancels renewal before identity removal and scrubs learning data", async () => {
    const lessonId = await playableLesson(true);
    await db.insert(schema.progress).values({ userId, lessonId, position: 20 });
    const fetcher = await prepare();
    vi.mocked(polarApi).mockImplementation(async (path, method) => {
      expect(fetcher).not.toHaveBeenCalled();
      if (method === "PATCH") return sub({ cancel_at_period_end: true });
      return { items: path.startsWith("/subscriptions/") ? [sub()] : [] };
    });
    await runJobs();
    expect(
      vi.mocked(polarApi).mock.calls.some((call) => call[1] === "PATCH"),
    ).toBe(true);
    expect(fetcher).toHaveBeenCalledWith(
      "https://console.neon.tech/api/v2/projects/test-project/branches/test-branch/auth/users/auth-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect((await db.select().from(schema.users))[0]).toMatchObject({
      state: "deleted",
      name: "Deleted student",
    });
    expect(await db.select().from(schema.progress)).toHaveLength(0);
  });
  it("keeps deletion pending if cancellation fails", async () => {
    const fetcher = await prepare();
    vi.mocked(polarApi).mockImplementation(async (_path, method) => {
      if (method === "PATCH") throw new Error("Cancellation unavailable");
      return { items: [sub()] };
    });
    await runJobs();
    expect(fetcher).not.toHaveBeenCalled();
    expect((await db.select().from(schema.users))[0].state).toBe("deleting");
    expect((await db.select().from(schema.jobs))[0]).toMatchObject({
      doneAt: null,
      attempts: 1,
    });
  });
  it("requires provider confirmation of renewal cancellation", async () => {
    const fetcher = await prepare();
    vi.mocked(polarApi).mockImplementation(async (_path, method) =>
      method === "PATCH" ? sub() : { items: [sub()] },
    );
    await runJobs();
    expect(fetcher).not.toHaveBeenCalled();
    expect((await db.select().from(schema.jobs))[0].lastError).toContain(
      "not confirmed",
    );
  });
  it.each([404, 503])(
    "keeps deletion pending on an unconfirmed Neon response (%s)",
    async (status) => {
      const fetcher = await prepare();
      fetcher.mockResolvedValue(new Response(null, { status }));
      vi.mocked(polarApi).mockResolvedValue({ items: [] });
      await runJobs();
      expect((await db.select().from(schema.users))[0].state).toBe("deleting");
      expect((await db.select().from(schema.jobs))[0].doneAt).toBeNull();
    },
  );
  it("checks every subscription page before deleting", async () => {
    const fetcher = await prepare();
    vi.mocked(polarApi).mockImplementation(async (path, method) => {
      if (method === "PATCH") return sub({ cancel_at_period_end: true });
      if (path.includes("page=1"))
        return {
          items: Array.from({ length: 100 }, (_, i) =>
            sub({ id: "old-" + i, cancel_at_period_end: true }),
          ),
        };
      if (path.includes("page=2")) return { items: [sub()] };
      return { items: [] };
    });
    await runJobs();
    expect(fetcher).toHaveBeenCalledOnce();
    expect(
      vi.mocked(polarApi).mock.calls.some((call) => call[0].includes("page=2")),
    ).toBe(true);
  });
  it.each(["reservation", "remote"])(
    "defers without consuming retries while a %s checkout is pending",
    async (kind) => {
      const fetcher = await prepare();
      if (kind === "reservation")
        await db
          .insert(schema.checkoutIntents)
          .values({ userId, offerId, expiresAt: new Date(Date.now() + 60000) });
      vi.mocked(polarApi).mockImplementation(async (path) => ({
        items:
          kind === "remote" && path.startsWith("/checkouts/")
            ? [{ status: "confirmed", expires_at: end }]
            : [],
      }));
      await runJobs();
      expect(fetcher).not.toHaveBeenCalled();
      expect((await db.select().from(schema.jobs))[0]).toMatchObject({
        doneAt: null,
        attempts: 0,
      });
    },
  );
  it("never grants a deleted student access on late payment and cancels late subscriptions", async () => {
    await db.update(schema.users).set({ state: "deleted" });
    const current = order({ subscription_id: "sub-1" });
    vi.mocked(polarApi).mockImplementation(async (path, method) =>
      method === "PATCH"
        ? sub({ cancel_at_period_end: true })
        : path.startsWith("/orders/")
          ? current
          : sub(),
    );
    await event("order.paid", current);
    await event("subscription.created", sub());
    await runJobs();
    expect(await db.select().from(schema.entitlements)).toHaveLength(0);
    expect((await db.select().from(schema.users))[0].state).toBe("deleted");
    expect(
      vi.mocked(polarApi).mock.calls.some((call) => call[1] === "PATCH"),
    ).toBe(true);
  });
  it("does not delete an active account even if a stale job exists", async () => {
    const fetcher = await prepare();
    await db.update(schema.users).set({ state: "active" });
    await runJobs();
    expect(fetcher).not.toHaveBeenCalled();
    expect(polarApi).not.toHaveBeenCalled();
  });
});

it("rejects equal-character-length but unequal-byte-length cron tokens", async () => {
  vi.stubEnv("CRON_SECRET", "a");
  const { GET } = await import("@/app/api/cron/route");
  expect(
    (
      await GET(
        new Request("http://localhost/api/cron", {
          headers: { Authorization: "Bearer é" },
        }),
      )
    ).status,
  ).toBe(401);
});
