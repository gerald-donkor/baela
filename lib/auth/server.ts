import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import { redirect, notFound } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { withDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { required } from "@/lib/config";
import { HttpError } from "@/lib/http";
export function auth() {
  return createNeonAuth({
    baseUrl: required("NEON_AUTH_BASE_URL"),
    cookies: {
      secret: required("NEON_AUTH_COOKIE_SECRET"),
      sessionDataTtl: 60,
    },
  });
}
export const getViewer = cache(async () => {
  if (!process.env.NEON_AUTH_BASE_URL || !process.env.DATABASE_URL) return null;
  const { data: session } = await auth().getSession();
  if (!session?.user) return null;
  return withDb(async (db) => {
    const identity = session.user;
    await db
      .insert(users)
      .values({
        authId: identity.id,
        name: identity.name || "Student",
        email: identity.email,
      })
      .onConflictDoNothing({ target: users.authId });
    const user = await db.query.users.findFirst({
      where: eq(users.authId, identity.id),
    });
    if (!user || user.state === "deleted") return null;
    return {
      ...user,
      verified: identity.emailVerified,
      admin:
        !!process.env.ADMIN_AUTH_USER_ID &&
        identity.id === process.env.ADMIN_AUTH_USER_ID,
      sessionCreatedAt: session.session.createdAt,
    };
  });
});
export async function requireUser(allowDeleting = false) {
  const user = await getViewer();
  if (!user) throw new HttpError(401, "Please sign in to continue.");
  if (!allowDeleting && user.state !== "active")
    throw new HttpError(403, "Your account deletion is being processed.");
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (!user.admin) throw new HttpError(403, "Administrator access required.");
  return user;
}

export async function requireAdminPage() {
  const user = await getViewer();
  if (!user) redirect("/auth/sign-in?next=/admin");
  if (!user.admin || user.state !== "active") notFound();
  return user;
}
