import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/http";
import ImageKit from "@imagekit/nodejs";
import { createHmac } from "node:crypto";
const provider = vi.hoisted(() => ({ parameters: vi.fn(), file: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ requireAdmin: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/server/imagekit", async (original) => ({
  ...(await original<typeof import("@/lib/server/imagekit")>()),
  imagekit: () => ({
    helper: { getAuthenticationParameters: provider.parameters },
    files: { get: provider.file },
  }),
}));
import { requireAdmin } from "@/lib/auth/server";
import { POST } from "@/app/api/admin/uploads/route";

function request(origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/admin/uploads", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "authorize" }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY", "");
  vi.stubEnv("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT", "");
  vi.stubEnv("IMAGEKIT_FOLDER", "dev");
  vi.mocked(requireAdmin).mockResolvedValue({ admin: true } as Awaited<
    ReturnType<typeof requireAdmin>
  >);
  vi.stubEnv("IMAGEKIT_PRIVATE_KEY", "private-test-key");
  vi.stubEnv("IMAGEKIT_PUBLIC_KEY", "public-test-key");
  vi.stubEnv("IMAGEKIT_URL_ENDPOINT", "https://ik.imagekit.io/test");
  provider.parameters.mockImplementation((token?: string, expire?: number) =>
    new ImageKit({
      privateKey: "private-test-key",
    }).helper.getAuthenticationParameters(token, expire),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("admin upload authorization", () => {
  it("authorizes a short-lived upload without exposing the private key", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);
    const response = await POST(request());
    expect(response.status).toBe(200);
    const parameters = await response.json();
    expect(parameters).toEqual({
      token: expect.any(String),
      signature: createHmac("sha1", "private-test-key")
        .update(parameters.token + 1_800_000_300)
        .digest("hex"),
      expire: 1_800_000_300,
      publicKey: "public-test-key",
      folder: "/dev",
    });
    expect(provider.parameters).toHaveBeenCalledWith(undefined, 1_800_000_300);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
  it("retains compatibility with the earlier public variable names", async () => {
    vi.stubEnv("IMAGEKIT_PUBLIC_KEY", "");
    vi.stubEnv("IMAGEKIT_URL_ENDPOINT", "");
    vi.stubEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY", "legacy-public-key");
    vi.stubEnv(
      "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT",
      "https://ik.imagekit.io/legacy",
    );
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).publicKey).toBe("legacy-public-key");
  });
  it.each([401, 403])(
    "does not issue upload signatures to unauthorized callers (%s)",
    async (status) => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new HttpError(status, "Access denied."),
      );
      expect((await POST(request())).status).toBe(status);
      expect(provider.parameters).not.toHaveBeenCalled();
    },
  );
  it.each([
    "IMAGEKIT_PRIVATE_KEY",
    "IMAGEKIT_PUBLIC_KEY",
    "IMAGEKIT_URL_ENDPOINT",
  ])("reports missing %s as recoverable configuration", async (key) => {
    vi.stubEnv(key, "");
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain(
      "ImageKit uploads are not configured",
    );
    expect(provider.parameters).not.toHaveBeenCalled();
  });
  it("rejects a cross-origin request before authorizing or signing", async () => {
    expect((await POST(request("https://attacker.test"))).status).toBe(403);
    expect(requireAdmin).not.toHaveBeenCalled();
    expect(provider.parameters).not.toHaveBeenCalled();
  });
  it.each([
    "/baela/image/cover.png",
    "/development/image/cover.png",
    "/dev/video/cover.png",
  ])(
    "rejects registration outside the configured image folder: %s",
    async (filePath) => {
      provider.file.mockResolvedValue({
        fileId: "uploaded-file",
        filePath,
        name: "cover.png",
        size: 20,
        isPrivateFile: true,
        fileType: "image",
      });
      const response = await POST(
        new Request("http://localhost:3000/api/admin/uploads", {
          method: "POST",
          headers: {
            Origin: "http://localhost:3000",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "register",
            fileId: "uploaded-file",
            kind: "image",
          }),
        }),
      );
      expect(response.status).toBe(400);
    },
  );
});
