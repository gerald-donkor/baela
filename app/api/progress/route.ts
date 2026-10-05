import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { endpoint, sameOrigin, HttpError } from "@/lib/http";
import { requireUser } from "@/lib/auth/server";
import { withDb } from "@/lib/db";
import { authorizedLesson, assetById } from "@/lib/server/catalog";
import { playbackSessions, progress } from "@/lib/db/schema";
import { rateLimit } from "@/lib/server/rate-limit";
import { mergeIntervals, watchedRatio } from "@/lib/domain/progress";
export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    const user = await requireUser();
    await rateLimit("progress:" + user.id, 120);
    const input = z
      .object({
        lessonId: z.uuid(),
        sessionId: z.uuid().optional(),
        sequence: z.number().int().min(0).optional(),
        position: z.number().min(0).max(86400).optional(),
        intervals: z
          .array(z.tuple([z.number().min(0), z.number().min(0)]))
          .max(500)
          .optional(),
        complete: z.boolean().optional(),
      })
      .parse(await request.json());
    return withDb((db) =>
      db.transaction(async (tx) => {
        const row = await authorizedLesson(
          tx,
          input.lessonId,
          user.id,
          user.admin,
        );
        if (!input.sessionId) {
          await tx
            .insert(progress)
            .values({ userId: user.id, lessonId: input.lessonId })
            .onConflictDoNothing();
          const [session] = await tx
            .insert(playbackSessions)
            .values({ userId: user.id, lessonId: input.lessonId })
            .returning();
          return { sessionId: session.id };
        }
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${user.id + input.lessonId}))`,
        );
        const session = await tx.query.playbackSessions.findFirst({
          where: and(
            eq(playbackSessions.id, input.sessionId),
            eq(playbackSessions.userId, user.id),
            eq(playbackSessions.lessonId, input.lessonId),
          ),
        });
        if (!session) throw new HttpError(403, "Playback session not found.");
        if (input.sequence === undefined)
          throw new HttpError(400, "Missing progress sequence.");
        if (input.sequence <= session.sequence)
          return { saved: true, stale: true };
        const asset = row.revision.videoId
          ? await assetById(tx, row.revision.videoId)
          : null;
        const duration = asset?.duration || 0;
        const previous = await tx.query.progress.findFirst({
          where: and(
            eq(progress.userId, user.id),
            eq(progress.lessonId, input.lessonId),
          ),
        });
        const intervals = mergeIntervals(
          [...(previous?.intervals || []), ...(input.intervals || [])],
          duration,
        );
        const manualIncomplete =
          input.complete === false
            ? true
            : input.complete === true
              ? false
              : previous?.manualIncomplete || false;
        const completed =
          input.complete ??
          (previous?.completed ||
            (!manualIncomplete && watchedRatio(intervals, duration) >= 0.95));
        const values = {
          position: Math.round(
            Math.min(input.position ?? previous?.position ?? 0, duration),
          ),
          intervals,
          completed,
          manualIncomplete,
          updatedAt: new Date(),
        };
        await tx
          .insert(progress)
          .values({ userId: user.id, lessonId: input.lessonId, ...values })
          .onConflictDoUpdate({
            target: [progress.userId, progress.lessonId],
            set: values,
          });
        await tx
          .update(playbackSessions)
          .set({ sequence: input.sequence })
          .where(eq(playbackSessions.id, session.id));
        return { saved: true, completed };
      }),
    );
  });
}
