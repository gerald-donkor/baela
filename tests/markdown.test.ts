import { describe, expect, it } from "vitest";
import { markdownManager, validateMarkdown } from "@/lib/domain/markdown";
import { streamingLadder } from "@/lib/domain/media";

describe("canonical Markdown", () => {
  it.each([
    "# Heading\n\n## Subheading\n\n**Bold** and *emphasis* and ~~strike~~.",
    "- first\n- second\n\n1. one\n2. two\n\n> A blockquote",
    "A [link](https://example.com/docs) and `inline <code>`.",
    "```tsx\nexport const element = <div>{value}</div>;\n```",
    "| Name | Value |\n| --- | --- |\n| **Bold** | `code` |",
    "![Diagram](/media/00000000-0000-4000-8000-000000000001)",
  ])("preserves semantics through visual/source round trips: %s", (source) => {
    expect(() => validateMarkdown(source)).not.toThrow();
    const manager = markdownManager();
    const document = manager.parse(source);
    expect(manager.parse(manager.serialize(document))).toEqual(document);
  });
  it.each([
    "<script>alert(1)</script>",
    "Hello <b>world</b>",
    "<Component />",
    "{value}",
    "export const x = 1",
    "![Image](https://outside.example/a.png)",
    "[unsafe](javascript:alert)",
  ])("rejects unsupported or unmanaged content: %s", (source) => {
    expect(() => validateMarkdown(source)).toThrow();
  });
  it("deduplicates managed image references", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(
      validateMarkdown(`![A](/media/${id})\n\n![B](/media/${id})`),
    ).toEqual([id]);
  });
});
it("caps video representations and uses MP4 below the first HLS rung", () => {
  expect(streamingLadder(0)).toBeNull();
  expect(streamingLadder(240)).toBeNull();
  expect(streamingLadder(480)).toBe("sr-360_480");
  expect(streamingLadder(720)).toBe("sr-360_480_720");
  expect(streamingLadder(2160)).toBe("sr-360_480_720_1080");
});
