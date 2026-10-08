"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileVideo, Paperclip, Search } from "lucide-react";
import { ManagedImage } from "@/components/managed-image";
import { Badge } from "@/components/ui/badge";
import { Uploader, VerifyAsset, type UploadedAsset } from "./uploader";
import styles from "./studio.module.css";

type MediaAsset = UploadedAsset & { size: number };
export function MediaLibrary({ assets }: { assets: MediaAsset[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<"video" | "image" | "attachment">("video");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const filtered = assets.filter(
    (asset) =>
      (filter === "all" || asset.kind === filter) &&
      asset.name.toLowerCase().includes(query.toLowerCase().trim()),
  );
  return (
    <div className={styles.editorStack}>
      <section className={styles.panel}>
        <h2>Upload to your library</h2>
        <p className={styles.panelDescription}>
          Upload once, then choose the file inside a course or lesson. Videos
          need verification before publishing.
        </p>
        <div
          className="flex flex-wrap gap-2 my-5"
          role="group"
          aria-label="Upload type"
        >
          {(["video", "image", "attachment"] as const).map((value) => (
            <button
              type="button"
              className={`px-4 py-2 rounded-control text-xs ${kind === value ? "bg-secondary text-primary" : "text-muted-foreground"}`}
              aria-pressed={kind === value}
              key={value}
              onClick={() => setKind(value)}
            >
              {value === "video"
                ? "Video"
                : value === "image"
                  ? "Image"
                  : "Resource"}
            </button>
          ))}
        </div>
        <Uploader key={kind} kind={kind} onUpload={() => router.refresh()} />
      </section>
      <div className={styles.searchRow}>
        <label className={styles.search}>
          <Search size={16} />
          <input
            type="search"
            aria-label="Search media"
            placeholder="Search your media…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          className="field !w-auto text-xs"
          aria-label="Filter media type"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All files</option>
          <option value="video">Videos</option>
          <option value="image">Images</option>
          <option value="attachment">Resources</option>
        </select>
      </div>
      {filtered.length ? (
        <div className={styles.mediaGrid}>
          {filtered.map((asset) => (
            <article
              className={`${styles.library} overflow-hidden`}
              key={asset.id}
            >
              <div className={styles.mediaPreview}>
                {asset.kind === "image" ? (
                  <ManagedImage assetId={asset.id} alt={asset.name} editor />
                ) : asset.kind === "video" ? (
                  <FileVideo size={35} strokeWidth={1.2} />
                ) : (
                  <Paperclip size={32} strokeWidth={1.2} />
                )}
              </div>
              <div className={styles.mediaInfo}>
                <h2>{asset.name}</h2>
                <p>
                  {asset.kind === "attachment"
                    ? "Resource"
                    : asset.kind === "video"
                      ? "Video"
                      : "Image"}{" "}
                  · {(asset.size / 1_000_000).toFixed(1)} MB
                  {asset.duration
                    ? ` · ${Math.floor(asset.duration / 60)}:${String(asset.duration % 60).padStart(2, "0")}`
                    : ""}
                </p>
                <div className="mt-3">
                  <Badge
                    variant={asset.ready ? "success" : "muted"}
                    className={styles.status}
                  >
                    {asset.ready ? "Ready" : "Needs verification"}
                  </Badge>
                </div>
                {asset.kind === "video" && !asset.ready && (
                  <div className="mt-4">
                    <VerifyAsset
                      id={asset.id}
                      onReady={() => router.refresh()}
                    />
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className={styles.panel}>
          <div className={styles.empty}>
            <h3>
              {assets.length
                ? "No files match your search."
                : "A home for your course media."}
            </h3>
            <p>
              {assets.length
                ? "Try another name or file type."
                : "Upload a video, image, or resource above to start your library."}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
