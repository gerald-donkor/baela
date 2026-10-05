"use client";
import { useState } from "react";
import { command } from "./client";
import { uploadLimits } from "@/lib/config";
import { Button } from "@/components/ui/button";
export type UploadedAsset = {
  id: string;
  name: string;
  kind: string;
  ready: boolean;
  duration: number;
};
export function Uploader({
  kind,
  onUpload,
}: {
  kind: "video" | "image" | "attachment";
  onUpload: (asset: UploadedAsset) => void | Promise<void>;
}) {
  const [percent, setPercent] = useState<number | null>(null),
    [message, setMessage] = useState("");
  async function upload(file: File) {
    setMessage("");
    if (file.size > uploadLimits[kind]) {
      setMessage("This file exceeds the upload limit.");
      return;
    }
    setPercent(0);
    try {
      const auth = await command({ action: "authorize" }, "/api/admin/uploads");
      const form = new FormData();
      form.set("file", file);
      form.set("fileName", file.name);
      form.set("folder", "/baela/" + kind);
      form.set("isPrivateFile", "true");
      form.set("useUniqueFileName", "true");
      for (const key of ["token", "signature", "expire", "publicKey"])
        form.set(key, String(auth[key]));
      const uploaded = await new Promise<{ fileId: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable)
              setPercent(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onerror = () =>
            reject(new Error("Upload interrupted. Please retry."));
          xhr.onload = () => {
            try {
              const data = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) resolve(data);
              else reject(new Error(data.message || "Upload failed."));
            } catch {
              reject(new Error("Invalid upload response."));
            }
          };
          xhr.send(form);
        },
      );
      const asset = await command(
        { action: "register", fileId: uploaded.fileId, kind },
        "/api/admin/uploads",
      );
      await onUpload(asset);
      setMessage(
        kind === "video"
          ? "Uploaded. Verify processing before publishing."
          : "Uploaded.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setPercent(null);
    }
  }
  return (
    <div className="border border-dashed rounded-xl p-4">
      <label className="field-label">
        Upload {kind}
        <input
          type="file"
          disabled={percent !== null}
          accept={
            kind === "video"
              ? "video/mp4"
              : kind === "image"
                ? "image/jpeg,image/png,image/webp"
                : ".pdf,.zip,.pptx"
          }
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>
      {percent !== null && (
        <progress
          aria-label="Upload progress"
          className="w-full mt-3"
          value={percent}
          max={100}
        />
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Limit:{" "}
        {kind === "video" ? "2 GB" : kind === "image" ? "10 MB" : "50 MB"}
      </p>
      {message && (
        <p className="text-sm mt-2" role="status">
          {message}
        </p>
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
  return (
    <div className="flex gap-3 items-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          setMessage("Checking…");
          try {
            const data = await command(
              { action: "verify", id },
              "/api/admin/uploads",
            );
            setMessage(
              data.ready ? "Ready" : "Processing. Try again in a moment.",
            );
            if (data.ready) onReady();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Check failed.");
          }
        }}
      >
        Verify video processing
      </Button>
      <span role="status" className="text-xs">
        {message}
      </span>
    </div>
  );
}
