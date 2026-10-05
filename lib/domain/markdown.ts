import { MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";

export const markdownExtensions = [
  StarterKit.configure({ underline: false }),
  TableKit,
  Image,
];
export function markdownManager() {
  return new MarkdownManager({ extensions: markdownExtensions });
}
import { managedImageId } from "./managed-image";
// Inspect tokens, not source regexes: HTML/code examples inside code blocks remain valid.
export function validateMarkdown(source: string) {
  const manager = markdownManager();
  const images = new Set<string>();
  function inspect(value: unknown): void {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(inspect);
      return;
    }
    const token = value as Record<string, unknown>;
    if (token.type === "code" || token.type === "codespan") return;
    if (token.type === "html")
      throw new Error(
        "HTML and MDX are not supported. Use Markdown or a fenced code block.",
      );
    if (
      token.type === "text" &&
      typeof token.raw === "string" &&
      (/(?<!\\)\{[^\n]*\}/.test(token.raw) ||
        /^(?:import|export)\s/m.test(token.raw))
    )
      throw new Error(
        "MDX expressions and imports are not supported. Put examples in code blocks.",
      );
    if (token.type === "image") {
      const id = managedImageId(String(token.href));
      if (!id)
        throw new Error("Insert images using the managed image uploader.");
      images.add(id);
    }
    if (
      token.type === "link" &&
      !/^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(String(token.href))
    )
      throw new Error(
        "Links must use HTTPS, HTTP, email, or an internal path.",
      );
    Object.values(token).forEach(inspect);
  }
  inspect(manager.instance.lexer(source));
  if (images.size > 30)
    throw new Error("A lesson may contain at most 30 images.");
  return [...images];
}
