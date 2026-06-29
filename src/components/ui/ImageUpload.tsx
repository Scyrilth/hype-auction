"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import ImageCropModal from "@/components/ui/ImageCropModal";
import { resolveAvatarUrl } from "@/lib/avatars";
import type { ImageUploadVariant } from "@/lib/image-crop";
import {
  type StorageBucket,
  uploadImageToStorage,
  validateImageFile,
} from "@/lib/storage";
import { getErrorMessage, logSupabaseError } from "@/lib/errors";

export type { ImageUploadVariant } from "@/lib/image-crop";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted";

function fileInfoText(maxSizeMb: number) {
  return `JPG, PNG, WEBP or GIF · Max ${maxSizeMb}MB`;
}

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
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState("image.jpg");

  const displayUrl = previewUrl || value;
  const avatarFallback =
    walletAddress && variant === "avatar"
      ? resolveAvatarUrl(null, walletAddress)
      : null;

  const closeCropModal = () => {
    if (cropSource) {
      URL.revokeObjectURL(cropSource);
    }
    setCropSource(null);
    setPendingFileName("image.jpg");
  };

  const uploadFile = async (file: File) => {
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
      logSupabaseError("ImageUpload", uploadError);
      setError(getErrorMessage(uploadError, "Upload failed. Please try again."));
    } finally {
      setIsUploading(false);
      setProgress(null);
      URL.revokeObjectURL(localPreview);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImageFile(file, maxSizeMb);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setPendingFileName(file.name);
    setCropSource(URL.createObjectURL(file));
  };

  const handleCropConfirm = async (file: File) => {
    closeCropModal();
    await uploadFile(file);
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
        <div className="flex flex-col items-center">
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
          <p className="mt-2 text-center text-xs text-muted">
            {fileInfoText(maxSizeMb)}
          </p>
        </div>
      )}

      {variant === "banner" && (
        <>
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
          <p className="mt-2 text-center text-xs text-muted">
            {fileInfoText(maxSizeMb)}
          </p>
        </>
      )}

      {variant === "auction" && (
        <>
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
              <span className="absolute inset-0 flex items-center justify-center text-sm text-muted">
                Click to upload
              </span>
            )}
            {displayUrl && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                {isUploading ? `Uploading ${progress ?? 0}%` : "Replace image"}
              </span>
            )}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            {fileInfoText(maxSizeMb)}
          </p>
        </>
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
        <p className="mt-2 truncate text-center text-xs text-muted" title={value}>
          {value}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {cropSource && (
        <ImageCropModal
          open
          imageSrc={cropSource}
          variant={variant}
          fileName={pendingFileName}
          onCancel={closeCropModal}
          onConfirm={(file) => void handleCropConfirm(file)}
        />
      )}
    </div>
  );
}
