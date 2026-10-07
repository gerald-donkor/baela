import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import { required } from "@/lib/config";

let instance: ReturnType<typeof createNeonAuth> | undefined;

export function isAuthConfigured() {
  return !!(
    process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET
  );
}

// Initialize lazily so public pages can still run before Auth is configured.
export function auth() {
  return (instance ??= createNeonAuth({
    baseUrl: required("NEON_AUTH_BASE_URL"),
    cookies: {
      secret: required("NEON_AUTH_COOKIE_SECRET"),
      sessionDataTtl: 60,
      sameSite: "lax",
    },
  }));
}
