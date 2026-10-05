import { describe, it, expect } from "vitest";
import { evaluateAccess, isFullRefund, type Grant } from "@/lib/domain/access";
import {
  mergeIntervals,
  watchedRatio,
  coursePercentage,
} from "@/lib/domain/progress";
import { allowedMediaUrl } from "@/lib/domain/media";
const now = new Date("2026-10-02T00:00:00Z");
const grant = (overrides: Partial<Grant> = {}): Grant => ({
  kind: "course",
  courseId: "course-a",
  startsAt: new Date("2026-01-01"),
  endsAt: null,
  revokedAt: null,
  ...overrides,
});
describe("entitlement decisions", () => {
  it("opens only published previews anonymously", () => {
    expect(evaluateAccess("a", true, true, [], now).allowed).toBe(true);
    expect(evaluateAccess("a", true, false, [], now).allowed).toBe(false);
  });
  it("limits a course purchase to its course", () => {
    expect(evaluateAccess("course-a", false, true, [grant()], now).reason).toBe(
      "course",
    );
    expect(evaluateAccess("b", false, true, [grant()], now).allowed).toBe(
      false,
    );
  });
  it("keeps paid-period access until the exact boundary", () => {
    const g = grant({ kind: "monthly", courseId: null, endsAt: now });
    expect(
      evaluateAccess("any", false, true, [g], new Date(now.getTime() - 1))
        .allowed,
    ).toBe(true);
    expect(evaluateAccess("any", false, true, [g], now).allowed).toBe(false);
  });
  it("preserves another purchase when a grant is refunded", () => {
    expect(
      evaluateAccess(
        "course-a",
        false,
        true,
        [grant(), grant({ kind: "lifetime", courseId: null, revokedAt: now })],
        now,
      ).reason,
    ).toBe("course");
  });
  it("does not activate future paid periods early", () => {
    expect(
      evaluateAccess(
        "a",
        false,
        true,
        [grant({ kind: "monthly", startsAt: new Date("2027-01-01") })],
        now,
      ).allowed,
    ).toBe(false);
  });
  it("chooses permanent access over expiring access", () => {
    expect(
      evaluateAccess(
        "course-a",
        false,
        true,
        [grant(), grant({ kind: "monthly", endsAt: new Date("2027-01-01") })],
        now,
      ).expiresAt,
    ).toBeNull();
  });
  it("only treats cumulative full refunds as full", () => {
    expect(isFullRefund(833, 832)).toBe(false);
    expect(isFullRefund(833, 833)).toBe(true);
    expect(isFullRefund(0, 0)).toBe(false);
  });
});
describe("learning progress", () => {
  it("merges overlaps without counting repeat viewing twice", () => {
    expect(
      mergeIntervals(
        [
          [0, 40],
          [20, 60],
          [60, 80],
        ],
        100,
      ),
    ).toEqual([[0, 80]]);
    expect(
      watchedRatio(
        [
          [0, 60],
          [0, 60],
        ],
        100,
      ),
    ).toBe(0.6);
  });
  it("seeking to the end does not complete a lesson", () => {
    expect(
      watchedRatio(
        [
          [0, 4],
          [98, 100],
        ],
        100,
      ),
    ).toBe(0.06);
  });
  it("clamps invalid ranges and recognizes 95 percent", () => {
    expect(
      mergeIntervals(
        [
          [-10, 10],
          [90, 200],
          [40, 30],
        ],
        100,
      ),
    ).toEqual([
      [0, 10],
      [90, 100],
    ]);
    expect(watchedRatio([[0, 95]], 100)).toBe(0.95);
  });
  it("recalculates on new published lessons", () => {
    expect(coursePercentage(3, 3)).toBe(100);
    expect(coursePercentage(3, 4)).toBe(75);
    expect(coursePercentage(0, 0)).toBe(0);
  });
});
describe("media URL boundaries", () => {
  const endpoint = "https://ik.imagekit.io/baela",
    path = "/baela/video/lesson.mp4";
  it("accepts only resources within the exact source", () => {
    expect(
      allowedMediaUrl(
        endpoint + path + "/ik-master.m3u8?tr=sr-360_480_720_1080",
        endpoint,
        path,
      ),
    ).toBe(true);
    expect(
      allowedMediaUrl(endpoint + path + "/segment-1.ts", endpoint, path),
    ).toBe(true);
  });
  it.each([
    "https://evil.test/baela/video/lesson.mp4",
    "https://ik.imagekit.io/baela/baela/video/other.mp4",
    "https://ik.imagekit.io/baela/baela/video/lesson.mp4/../other.mp4",
    "https://ik.imagekit.io/baela/baela/video/lesson.mp4?tr=n-secret",
    "https://ik.imagekit.io/baela/baela/video/lesson.mp4?unknown=1",
  ])("rejects tampered URL %s", (url) => {
    expect(allowedMediaUrl(url, endpoint, path)).toBe(false);
  });
});
