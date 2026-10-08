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
import { HttpError } from "@/lib/http";

const state = vi.hoisted(() => ({
  db: null as unknown,
  viewer: null as null | { id: string; admin: boolean; state: string },
}));
vi.mock("@/lib/db", () => ({
  withDb: (fn: (db: unknown) => Promise<unknown>) => fn(state.db),
}));
vi.mock("@/lib/auth/server", () => ({
  getViewer: () => state.viewer,
  requireAdmin: () => {
    if (!state.viewer) throw new HttpError(401, "Sign in required.");
    if (!state.viewer.admin || state.viewer.state !== "active")
      throw new HttpError(403, "Administrator access required.");
    return state.viewer;
  },
}));
vi.mock("@/lib/server/imagekit", () => ({
  signedAsset: vi.fn(() => "https://example.test/signed"),
  imagekitUrlEndpoint: () => "https://ik.imagekit.io/test",
}));
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
import { executeAdminCommand } from "@/lib/server/admin";
import { authorizedTrailer, courseDetail } from "@/lib/server/catalog";
import { signedAsset } from "@/lib/server/imagekit";
import { POST } from "@/app/api/media/sign/route";

const pg = new PGlite();
const db = drizzle(pg, { schema });
const courseId = "00000000-0000-4000-8000-000000000002";
const admin = {
  id: "00000000-0000-4000-8000-000000000001",
  admin: true,
  state: "active",
};
beforeAll(async () => {
  for (const file of readdirSync("drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await pg.exec(readFileSync("drizzle/" + file, "utf8"));
  state.db = db;
});
beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubEnv("DATABASE_URL", "test");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  await pg.exec(
    "TRUNCATE " +
      Object.values(schema)
        .map((t) => '"' + getTableName(t) + '"')
        .join(",") +
      " CASCADE",
  );
  state.viewer = admin;
  await db
    .insert(schema.courses)
    .values({
      id: courseId,
      slug: "real-course",
      title: "Real course",
      status: "published",
    });
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await pg.close();
});
async function video(extra: Partial<typeof schema.assets.$inferInsert> = {}) {
  return (
    await db
      .insert(schema.assets)
      .values({
        fileId: crypto.randomUUID(),
        filePath: "/baela/video/trailer.mp4",
        name: "Trailer.mp4",
        kind: "video",
        mime: "video/mp4",
        size: 100,
        duration: 90,
        height: 720,
        ready: true,
        private: true,
        ...extra,
      })
      .returning()
  )[0];
}
const save = (trailerId: string | null) =>
  executeAdminCommand({ action: "course-trailer", id: courseId, trailerId });
const publish = (trailerId: string) =>
  executeAdminCommand({
    action: "publish-course-trailer",
    id: courseId,
    trailerId,
  });
const remove = (trailerId: string) =>
  executeAdminCommand({
    action: "remove-course-trailer",
    id: courseId,
    trailerId,
  });
async function sign(
  data: Record<string, unknown> = {},
  origin = "http://localhost:3000",
) {
  return POST(
    new Request("http://localhost:3000/api/media/sign", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, ...data }),
    }),
  );
}
async function current() {
  return (await db.select().from(schema.courses))[0];
}

describe("course trailer publication", () => {
  it("saves a replacement privately while preserving the published trailer and metadata", async () => {
    const first = await video();
    await save(first.id);
    await publish(first.id);
    const replacement = await video({ ready: false, duration: 0 });
    await save(replacement.id);
    expect(await current()).toMatchObject({
      title: "Real course",
      slug: "real-course",
      trailerId: first.id,
      trailerDraftId: replacement.id,
    });
    expect(await db.select().from(schema.lessons)).toHaveLength(0);
    state.viewer = null;
    expect((await sign()).status).toBe(200);
    expect(signedAsset).toHaveBeenLastCalledWith(
      first.filePath,
      300,
      undefined,
    );
  });
  it.each([{ ready: false }, { duration: 0 }])(
    "requires processing and duration before publication: %j",
    async (extra) => {
      const asset = await video(extra);
      await save(asset.id);
      await expect(publish(asset.id)).rejects.toMatchObject({ status: 400 });
      expect((await current()).trailerId).toBeNull();
    },
  );
  it.each([{ kind: "image" as const }, { private: false }])(
    "rejects an invalid trailer asset: %j",
    async (extra) => {
      await expect(save((await video(extra)).id)).rejects.toMatchObject({
        status: 400,
      });
    },
  );
  it("rejects missing assets and courses", async () => {
    await expect(save(crypto.randomUUID())).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      executeAdminCommand({
        action: "course-trailer",
        id: crypto.randomUUID(),
        trailerId: null,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("blocks publishing and removal from a stale editor", async () => {
    const first = await video();
    const second = await video();
    await save(first.id);
    await publish(first.id);
    await save(second.id);
    await expect(publish(first.id)).rejects.toMatchObject({ status: 409 });
    await publish(second.id);
    await expect(remove(first.id)).rejects.toMatchObject({ status: 409 });
    expect((await current()).trailerId).toBe(second.id);
  });
  it("clears a draft without unpublishing and removes the live trailer without changing lessons", async () => {
    const asset = await video();
    await save(asset.id);
    await publish(asset.id);
    await save(null);
    expect(await current()).toMatchObject({
      trailerId: asset.id,
      trailerDraftId: null,
    });
    await remove(asset.id);
    expect((await current()).trailerId).toBeNull();
    state.viewer = null;
    expect((await sign()).status).toBe(404);
  });
  it.each([null, { ...admin, admin: false }, { ...admin, state: "deleting" }])(
    "requires an active administrator for authoring: %j",
    async (viewer) => {
      const asset = await video();
      state.viewer = viewer;
      for (const action of [
        () => save(asset.id),
        () => publish(asset.id),
        () => remove(asset.id),
      ])
        await expect(action()).rejects.toBeInstanceOf(HttpError);
      expect((await current()).trailerDraftId).toBeNull();
    },
  );
});

describe("trailer media authorization", () => {
  it("signs only the published trailer for anonymous visitors and preserves HLS path checks", async () => {
    const asset = await video();
    await save(asset.id);
    await publish(asset.id);
    state.viewer = null;
    expect((await sign({ hls: true })).status).toBe(200);
    expect(signedAsset).toHaveBeenLastCalledWith(
      asset.filePath + "/ik-master.m3u8",
      300,
      "sr-360_480_720",
    );
    expect(
      (
        await sign({
          url:
            "https://ik.imagekit.io/test" +
            asset.filePath +
            "/segment-1.ts?tr=sr-360_480_720",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await sign({
          url:
            "https://ik.imagekit.io/test" +
            asset.filePath +
            "/ik-master.m3u8?tr=sr-360_480_720_1080",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await sign({
          url: "https://ik.imagekit.io/test/other-private-video.mp4",
        })
      ).status,
    ).toBe(403);
    expect((await sign({ assetId: crypto.randomUUID() })).status).toBe(400);
    expect((await sign({ lessonId: crypto.randomUUID() })).status).toBe(400);
  });
  it("keeps a draft trailer private even on a public course", async () => {
    const asset = await video();
    await save(asset.id);
    state.viewer = null;
    expect((await sign()).status).toBe(404);
    expect((await sign({ draft: true })).status).toBe(401);
    state.viewer = { ...admin, admin: false };
    expect((await sign({ draft: true })).status).toBe(403);
    state.viewer = admin;
    expect((await sign({ draft: true })).status).toBe(200);
    state.viewer = null;
    await expect(
      authorizedTrailer(db as never, courseId, true),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("hides even a published trailer on a draft course, with an admin draft preview", async () => {
    const asset = await video();
    await save(asset.id);
    await publish(asset.id);
    await db
      .update(schema.courses)
      .set({ status: "draft" })
      .where(eq(schema.courses.id, courseId));
    expect((await sign({ draft: true })).status).toBe(200);
    state.viewer = null;
    expect((await sign()).status).toBe(404);
    expect(await courseDetail("real-course")).toBeNull();
  });
  it("rejects cross-origin and inactive-account playback before signing", async () => {
    const asset = await video();
    await save(asset.id);
    await publish(asset.id);
    expect((await sign({}, "https://attacker.test")).status).toBe(403);
    state.viewer = { ...admin, state: "deleting" };
    expect((await sign()).status).toBe(403);
    expect(signedAsset).not.toHaveBeenCalled();
  });
  it("exposes only a course playback reference, with the existing curriculum intact", async () => {
    const asset = await video();
    await save(asset.id);
    expect((await courseDetail("real-course"))?.trailer).toBeNull();
    await publish(asset.id);
    const detail = await courseDetail("real-course");
    expect(detail?.trailer).toEqual({ courseId });
    expect(detail?.curriculum).toEqual([]);
    expect(detail?.trailer).not.toHaveProperty("filePath");
  });
});
