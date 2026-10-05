"use client";
import { useState } from "react";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { markdownExtensions, validateMarkdown } from "@/lib/domain/markdown";
import { managedImageId } from "@/lib/domain/managed-image";
import Image from "@tiptap/extension-image";
import { ManagedImage } from "@/components/managed-image";
import { Uploader } from "./uploader";
import { Markdown as MarkdownExtension } from "@tiptap/markdown";

import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
function ImageNode({ node }: NodeViewProps) {
  const id = managedImageId(node.attrs.src);
  return (
    <NodeViewWrapper>
      {id && <ManagedImage assetId={id} alt={node.attrs.alt || ""} editor />}
    </NodeViewWrapper>
  );
}
const ManagedImageExtension = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNode);
  },
});
export function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [mode, setMode] = useState("visual"),
    [error, setError] = useState(""),
    [link, setLink] = useState("");
  const editor = useEditor({
    extensions: [
      ...markdownExtensions.filter((extension) => extension.name !== "image"),
      ManagedImageExtension,
      MarkdownExtension,
    ],
    content: value,
    contentType: "markdown",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getMarkdown()),
    editorProps: {
      attributes: { class: "prose-content", "aria-label": "Lesson content" },
    },
  });
  function switchMode(next: string) {
    try {
      validateMarkdown(value);
      setError("");
    } catch (error) {
      setError((error as Error).message);
      if (next !== "markdown") return;
    }
    if (next === "visual" && editor)
      editor.commands.setContent(value, { contentType: "markdown" });
    setMode(next);
  }
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <div className="flex flex-wrap gap-2 border-b p-3">
        {["visual", "markdown", "preview"].map((m) => (
          <Button
            type="button"
            key={m}
            size="sm"
            variant={mode === m ? "secondary" : "ghost"}
            onClick={() => switchMode(m)}
          >
            {m[0].toUpperCase() + m.slice(1)}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {mode === "visual" ? (
        <>
          <div className="border-b flex flex-wrap gap-1 p-2">
            {[
              {
                label: "Bold",
                run: () => editor?.chain().focus().toggleBold().run(),
              },
              {
                label: "Italic",
                run: () => editor?.chain().focus().toggleItalic().run(),
              },
              {
                label: "Heading",
                run: () =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run(),
              },
              {
                label: "List",
                run: () => editor?.chain().focus().toggleBulletList().run(),
              },
              {
                label: "Code",
                run: () => editor?.chain().focus().toggleCodeBlock().run(),
              },
              {
                label: "Quote",
                run: () => editor?.chain().focus().toggleBlockquote().run(),
              },
              {
                label: "Table",
                run: () =>
                  editor
                    ?.chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run(),
              },
            ].map((b) => (
              <Button
                type="button"
                key={b.label}
                size="sm"
                variant="ghost"
                onClick={b.run}
              >
                {b.label}
              </Button>
            ))}
          </div>
          <div className="p-3 flex flex-wrap items-end gap-2 border-b">
            <label className="field-label flex-1">
              Link URL
              <input
                type="url"
                className="field"
                value={link}
                onChange={(event) => setLink(event.target.value)}
                placeholder="https://"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!/^https?:\/\//i.test(link)) {
                  setError("Enter an HTTP or HTTPS link.");
                  return;
                }
                editor
                  ?.chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: link })
                  .run();
                setLink("");
                setError("");
              }}
            >
              Apply link to selection
            </Button>
          </div>
          <EditorContent editor={editor} />
          <div className="p-3 border-t">
            <Uploader
              kind="image"
              onUpload={(asset) => {
                editor
                  ?.chain()
                  .focus()
                  .setImage({ src: "/media/" + asset.id, alt: asset.name })
                  .run();
              }}
            />
          </div>
        </>
      ) : mode === "markdown" ? (
        <textarea
          aria-label="Markdown source"
          className="w-full p-4 min-h-80 font-mono text-sm outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="p-5 min-h-60">
          <Markdown content={value} editor />
        </div>
      )}
    </div>
  );
}
