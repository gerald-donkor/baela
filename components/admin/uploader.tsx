"use client";
import { useEffect, useRef, useState } from "react";
import { CloudUpload, FileImage, FileVideo, Paperclip } from "lucide-react";
import { command } from "./client";
import { uploadLimits } from "@/lib/config";
import { Button } from "@/components/ui/button";
import styles from "./studio.module.css";

export type UploadedAsset = {
  id: string;
  name: string;
  kind: string;
  ready: boolean;
  duration: number;
};
const formats = {
  video: {
    accept: "video/mp4,.mp4",
    extensions: ["mp4"],
    text: "MP4 · up to 2 GB",
    label: "video",
    icon: FileVideo,
  },
  image: {
    accept: "image/jpeg,image/png,image/webp",
    extensions: ["jpg", "jpeg", "png", "webp"],
    text: "JPEG, PNG, WebP · up to 10 MB",
    label: "image",
    icon: FileImage,
  },
  attachment: {
    accept: ".pdf,.zip,.pptx",
    extensions: ["pdf", "zip", "pptx"],
    text: "PDF, ZIP, PPTX · up to 50 MB",
    label: "resource",
    icon: Paperclip,
  },
};
type PendingUpload = { file: File; fileId?: string; asset?: UploadedAsset };
export function Uploader({
  kind,
  onUpload,
  disabled = false,
  onBusyChange,
}: {
  kind: "video" | "image" | "attachment";
  onUpload: (asset: UploadedAsset) => void | Promise<void>;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [percent, setPercent] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [filename, setFilename] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pending = useRef<PendingUpload | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const active = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      xhrRef.current?.abort();
    };
  }, []);
  const format = formats[kind];
  const Icon = format.icon;
  async function upload(file: File, retry = false) {
    if (active.current || disabled) return;
    setMessage("");
    setFailed(false);
    setFilename(file.name);
    if (!file.size || file.size > uploadLimits[kind]) {
      setMessage(
        !file.size
          ? "Choose a file that isn’t empty."
          : `This file is too large. ${format.text}.`,
      );
      return;
    }
    if (
      !format.extensions.includes(
        file.name.split(".").pop()?.toLowerCase() || "",
      )
    ) {
      setMessage(`Choose a supported file. ${format.text}.`);
      return;
    }
    if (!retry) pending.current = { file };
    const attempt = pending.current!;
    active.current = true;
    onBusyChange?.(true);
    setPercent(attempt.fileId ? 100 : 0);
    try {
      if (!attempt.fileId) {
        const auth = await command(
          { action: "authorize" },
          "/api/admin/uploads",
        );
        if (!mounted.current) return;
        const form = new FormData();
        form.set("file", file);
        form.set("fileName", file.name);
        form.set("folder", auth.folder + "/" + kind);
        form.set("isPrivateFile", "true");
        form.set("useUniqueFileName", "true");
        for (const key of ["token", "signature", "expire", "publicKey"])
          form.set(key, String(auth[key]));
        const result = await new Promise<{ fileId: string }>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;
            xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable && mounted.current)
                setPercent(Math.round((event.loaded / event.total) * 100));
            };
            xhr.onerror = () =>
              reject(
                new Error(
                  "Upload interrupted. Check your connection and retry.",
                ),
              );
            xhr.onabort = () => reject(new Error("Upload canceled."));
            xhr.onload = () => {
              try {
                const data = JSON.parse(xhr.responseText);
                if (
                  xhr.status >= 200 &&
                  xhr.status < 300 &&
                  typeof data.fileId === "string"
                )
                  resolve(data);
                else
                  reject(
                    new Error(
                      "ImageKit could not accept the upload. Check your account limits and retry.",
                    ),
                  );
              } catch {
                reject(
                  new Error(
                    "ImageKit returned an invalid response. Retry the upload.",
                  ),
                );
              }
            };
            xhr.send(form);
          },
        );
        attempt.fileId = result.fileId;
      }
      if (!mounted.current) return;
      setMessage("Saving the uploaded file…");
      if (!attempt.asset)
        attempt.asset = await command(
          { action: "register", fileId: attempt.fileId, kind },
          "/api/admin/uploads",
        );
      if (!mounted.current) return;
      await onUpload(attempt.asset!);
      if (!mounted.current) return;
      setMessage(
        kind === "video"
          ? "Video uploaded. Verify processing before publishing."
          : `${kind === "image" ? "Image" : "Resource"} uploaded.`,
      );
      pending.current = null;
    } catch (error) {
      if (mounted.current) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Upload failed. Retry the upload.",
        );
        setFailed(true);
      }
    } finally {
      active.current = false;
      if (mounted.current) onBusyChange?.(false);
      xhrRef.current = null;
      if (mounted.current) setPercent(null);
    }
  }
  return (
    <div
      className={styles.upload}
      data-dragging={dragging}
      onDragOver={(event) => {
        event.preventDefault();
        if (!active.current && !disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        if (event.dataTransfer.files.length !== 1) {
          setMessage("Choose one file at a time.");
          return;
        }
        const file = event.dataTransfer.files[0];
        if (file) void upload(file);
      }}
    >
      <div className={styles.uploadLabel}>
        <Icon size={23} strokeWidth={1.5} />
        <strong>
          Choose {kind === "image" ? "an" : "a"} {format.label} or drop it here
        </strong>
        <small>{format.text}</small>
        <input
          ref={inputRef}
          type="file"
          hidden
          aria-label={`Upload ${kind}`}
          disabled={disabled || percent !== null}
          accept={format.accept}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={styles.uploadButton}
          disabled={disabled || percent !== null}
          onClick={() => inputRef.current?.click()}
        >
          {filename ? "Choose another" : `Choose ${format.label}`}
        </Button>
      </div>
      {filename && percent === null && (
        <p className={styles.uploadFilename}>{filename}</p>
      )}
      {percent !== null && (
        <>
          <div className={styles.uploadProgress}>
            <span className="truncate">{filename}</span>
            <span>{percent === 100 ? "Finishing…" : `${percent}%`}</span>
          </div>
          <progress
            aria-label={`Upload ${kind} progress`}
            className="w-full mt-2 h-1.5"
            value={percent}
            max={100}
          />
        </>
      )}
      {message && (
        <p
          className={`${styles.uploadMessage} ${failed ? styles.uploadError : ""}`}
          role={failed ? "alert" : "status"}
        >
          {message}
        </p>
      )}
      {failed && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3"
          disabled={disabled}
          onClick={() => void upload(pending.current!.file, true)}
        >
          Retry upload
        </Button>
      )}
    </div>
  );
}
export function VerifyAsset({
  id,
  onReady,
}: {
  id: string;
  onReady: () => void;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMessage("");
          try {
            const data = await command(
              { action: "verify", id },
              "/api/admin/uploads",
            );
            setMessage(
              data.ready
                ? "Media verified and ready."
                : "Still processing. Try again shortly.",
            );
            if (data.ready) onReady();
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Verification failed. Please retry.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <CloudUpload size={14} />
        {busy ? "Checking…" : "Verify processing"}
      </Button>
      <p className="text-xs text-muted-foreground" role="status">
        {message}
      </p>
    </div>
  );
}
