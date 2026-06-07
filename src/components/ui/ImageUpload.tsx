"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { resolveAvatarUrl } from "@/lib/avatars";
import {
  type StorageBucket,
  uploadImageToStorage,
  validateImageFile,
} from "@/lib/storage";

export type ImageUploadVariant = "avatar" | "banner" | "auction";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

export default function ImageUpload({
  label,
  bucket,
  buildPath,
  value,
  onChange,
  onUploaded,
  maxSizeMb,
  variant = "auction",
  walletAddress,
  showUrl = false,
  disabled = false,
}: {
  label: string;
  bucket: StorageBucket;
  buildPath: (file: File) => string;
  value: string;
  onChange: (url: string) => void;
  onUploaded?: (url: string) => Promise<void> | void;
  maxSizeMb: number;
  variant?: ImageUploadVariant;
  walletAddress?: string;
  showUrl?: boolean;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = previewUrl || value;
  const avatarFallback =
    walletAddress && variant === "avatar"
      ? resolveAvatarUrl(null, walletAddress)
      : null;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file, maxSizeMb);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const path = buildPath(file);
      const publicUrl = await uploadImageToStorage({
        bucket,
        path,
        file,
        onProgress: setProgress,
      });

      setPreviewUrl(publicUrl);
      onChange(publicUrl);
      await onUploaded?.(publicUrl);
    } catch (uploadError) {
      setPreviewUrl(value || null);
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed."
      );
    } finally {
      setIsUploading(false);
      setProgress(null);
      URL.revokeObjectURL(localPreview);
    }
  };

  const openPicker = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  return (
    <div>
      <p className={labelClass}>{label}</p>

      <input
        ref={inputRef}
        type="file"
        accept={["image/jpeg", "image/png", "image/webp", "image/gif"].join(",")}
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleFileChange}
      />

      {variant === "avatar" && (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled || isUploading}
          className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-border bg-surface-elevated transition-colors hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Image
            src={displayUrl || avatarFallback!}
            alt={label}
            fill
            className="object-cover"
            unoptimized
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
            {isUploading ? `${progress ?? 0}%` : "Upload"}
          </span>
        </button>
      )}

      {variant === "banner" && (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled || isUploading}
          className="group relative h-32 w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/50 via-purple-900/80 to-background transition-colors hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
          ) : null}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            {isUploading ? `Uploading ${progress ?? 0}%` : "Click to upload banner"}
          </span>
        </button>
      )}

      {variant === "auction" && (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled || isUploading}
          className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-dashed border-border bg-background/60 transition-colors hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm text-muted">
              <span>Click to upload</span>
              <span className="text-xs">JPEG, PNG, WebP, GIF · max {maxSizeMb}MB</span>
            </span>
          )}
          {displayUrl && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              {isUploading ? `Uploading ${progress ?? 0}%` : "Replace image"}
            </span>
          )}
        </button>
      )}

      {isUploading && progress !== null && variant !== "avatar" && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="h-full rounded-full bg-accent transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {showUrl && value && (
        <input
          readOnly
          value={value}
          className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted outline-none"
        />
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
