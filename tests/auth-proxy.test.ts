import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME,
  NEON_AUTH_SESSION_COOKIE_NAME,
  NEON_AUTH_SESSION_DATA_COOKIE_NAME,
} from "@neondatabase/auth/server";
import proxy from "@/proxy";
import { getAuthRedirect } from "@/lib/auth/redirect";

const fetchMock = vi.fn<typeof fetch>();
const authBaseUrl = "https://auth.example.test/neondb/auth";

beforeEach(() => {
  vi.stubEnv("NEON_AUTH_BASE_URL", authBaseUrl);
  vi.stubEnv(
    "NEON_AUTH_COOKIE_SECRET",
    "test-cookie-secret-that-is-long-enough",
  );
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Neon OAuth and route protection", () => {
  it("keeps the public catalog and demo dashboard accessible without Auth requests", async () => {
    for (const path of ["/", "/courses", "/dashboard", "/auth/sign-in"])
      expect(
        (await proxy(new NextRequest("https://baela.test" + path))).headers.get(
          "x-middleware-next",
        ),
      ).toBe("1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends anonymous visitors to sign-in with their original destination", async () => {
    for (const path of [
      "/account?tab=billing",
      "/admin/users",
      "/checkout/success",
    ]) {
      const response = await proxy(
        new NextRequest("https://baela.test" + path),
      );
      const location = new URL(response.headers.get("location")!);
      expect(location.pathname).toBe("/auth/sign-in");
      expect(location.searchParams.get("next")).toBe(path);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still redirects protected pages when Auth has not been configured", async () => {
    vi.stubEnv("NEON_AUTH_BASE_URL", "");
    const response = await proxy(new NextRequest("https://baela.test/account"));
    expect(new URL(response.headers.get("location")!).pathname).toBe(
      "/auth/sign-in",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("exchanges the OAuth verifier, sets app cookies, and removes it from the return URL", async () => {
    const now = new Date().toISOString();
    const session = {
      user: {
        id: "neon-user",
        name: "Student",
        email: "student@example.test",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      session: {
        id: "neon-session",
        userId: "neon-user",
        token: "session-token",
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      },
    };
    fetchMock.mockImplementation(async () =>
      Response.json(session, {
        headers: {
          "set-cookie": `${NEON_AUTH_SESSION_COOKIE_NAME}=session-token; Path=/; HttpOnly; Secure; SameSite=Lax`,
        },
      }),
    );

    const response = await proxy(
      new NextRequest(
        "https://baela.test/courses?category=web&neon_auth_session_verifier=oauth-verifier",
        {
          headers: {
            cookie: `${NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME}=oauth-challenge`,
          },
        },
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://baela.test/courses?category=web",
    );
    const cookies = response.headers.getSetCookie();
    expect(
      cookies.some((cookie) =>
        cookie.startsWith(NEON_AUTH_SESSION_COOKIE_NAME + "="),
      ),
    ).toBe(true);
    expect(
      cookies.some((cookie) =>
        cookie.startsWith(NEON_AUTH_SESSION_DATA_COOKIE_NAME + "="),
      ),
    ).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      authBaseUrl +
        "/get-session?category=web&neon_auth_session_verifier=oauth-verifier",
    );

    // The following request uses the signed app session without another upstream call.
    fetchMock.mockClear();
    const signedIn = await proxy(
      new NextRequest("https://baela.test/account", {
        headers: {
          cookie: cookies.map((cookie) => cookie.split(";")[0]).join("; "),
        },
      }),
    );
    expect(signedIn.headers.get("x-middleware-next")).toBe("1");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("auth return destinations", () => {
  it("preserves local paths, queries, and fragments", () => {
    expect(getAuthRedirect("/courses/react?lesson=intro#overview")).toBe(
      "/courses/react?lesson=intro#overview",
    );
  });

  it.each([
    undefined,
    ["/account", "//evil.test"],
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/\t/evil.test",
    "/\n/evil.test",
    "/..//evil.test",
  ])("rejects unsafe destinations: %s", (value) => {
    expect(getAuthRedirect(value)).toBe("/dashboard");
  });
});
