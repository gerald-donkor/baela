import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { managedImageId } from "@/lib/domain/managed-image";
import { ManagedImage } from "./managed-image";
export function Markdown({
  content,
  lessonId,
  draft,
  editor,
}: {
  content: string;
  lessonId?: string;
  draft?: boolean;
  editor?: boolean;
}) {
  return (
    <div className="prose-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: (props) => <a {...props} rel="noopener noreferrer" />,
          img: ({ src, alt }) => {
            const id =
              typeof src === "string" ? managedImageId(src) : undefined;
            return id && (lessonId || editor) ? (
              <ManagedImage
                assetId={id}
                alt={alt || ""}
                lessonId={lessonId}
                draft={draft}
                editor={editor}
              />
            ) : null;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
