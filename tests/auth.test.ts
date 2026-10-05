import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  session: null as unknown,
  user: null as unknown,
}));
vi.mock("@neondatabase/auth/next/server", () => ({
  createNeonAuth: () => ({ getSession: async () => ({ data: state.session }) }),
}));
vi.mock("@/lib/db", () => ({
  withDb: async (fn: (db: unknown) => Promise<unknown>) =>
    fn({
      insert: () => ({
        values: () => ({ onConflictDoNothing: async () => {} }),
      }),
      query: { users: { findFirst: async () => state.user } },
    }),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
import { getViewer, requireUser, requireAdmin } from "@/lib/auth/server";
beforeEach(() => {
  vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.example.test");
  vi.stubEnv("DATABASE_URL", "postgresql://test.invalid/test");
  vi.stubEnv(
    "NEON_AUTH_COOKIE_SECRET",
    "test-cookie-secret-that-is-long-enough",
  );
  vi.stubEnv("ADMIN_AUTH_USER_ID", "admin-identity");
  state.session = {
    user: {
      id: "student-identity",
      name: "Student",
      email: "admin@example.test",
      emailVerified: true,
      role: "admin",
    },
    session: { createdAt: new Date() },
  };
  state.user = { id: "user-1", state: "active", authId: "student-identity" };
});
describe("identity and admin boundary", () => {
  it("denies anonymous callers", async () => {
    state.session = null;
    await expect(requireUser()).rejects.toMatchObject({ status: 401 });
  });
  it("does not accept an email or provider role as administrator authority", async () => {
    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
  });
  it("recognizes only the configured immutable identity", async () => {
    vi.stubEnv("ADMIN_AUTH_USER_ID", "student-identity");
    await expect(requireAdmin()).resolves.toMatchObject({ admin: true });
  });
  it("never returns a deleted identity with a still-cached provider session", async () => {
    state.user = { id: "user-1", state: "deleted" };
    expect(await getViewer()).toBeNull();
  });
  it("denies a deleting student except for explicitly allowed account operations", async () => {
    state.user = { id: "user-1", state: "deleting" };
    await expect(requireUser()).rejects.toMatchObject({ status: 403 });
    await expect(requireUser(true)).resolves.toMatchObject({
      state: "deleting",
    });
  });
});
