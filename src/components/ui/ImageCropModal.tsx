"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type Crop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import type { ImageUploadVariant } from "@/lib/image-crop";
import { IMAGE_CROP_PROFILES, type ImageCropProfile } from "@/lib/image-crop";

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
  circular: boolean
) {
  const cropWidthPercent = circular ? 70 : 85;

  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: cropWidthPercent,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function exportCroppedJpegFile(
  image: HTMLImageElement,
  crop: Crop,
  profile: ImageCropProfile,
  fileName: string
): Promise<File> {
  console.log("Starting crop export");

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelCrop = convertToPixelCrop(crop, image.width, image.height);

    canvas.width = profile.minWidth;
    canvas.height = profile.minHeight;
    console.log(`Canvas created: ${canvas.width}x${canvas.height}`);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get canvas 2d context");
      reject(new Error("No 2d context"));
      return;
    }

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      profile.minWidth,
      profile.minHeight
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error("Blob is null");
          reject(new Error("Failed to crop image"));
          return;
        }

        console.log(`Blob created: ${blob.size} bytes`);
        const file = new File([blob], fileName, { type: "image/jpeg" });
        resolve(file);
      },
      "image/jpeg",
      0.9
    );
  });
}

export default function ImageCropModal({
  open,
  imageSrc,
  variant,
  fileName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  imageSrc: string;
  variant: ImageUploadVariant;
  fileName: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const profile = IMAGE_CROP_PROFILES[variant];
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCrop(undefined);
      setScale(1);
      setProcessing(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !processing) {
        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel, processing]);

  const onImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = event.currentTarget;
      setCrop(centerAspectCrop(width, height, profile.aspect, profile.circular));
    },
    [profile.aspect, profile.circular]
  );

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    setScale((current) => {
      const next = current + (event.deltaY < 0 ? 0.08 : -0.08);
      return Math.min(3, Math.max(1, Number(next.toFixed(2))));
    });
  };

  const handleConfirm = async () => {
    const image = imgRef.current;

    if (!image || !crop?.width || !crop?.height) {
      setError("Adjust the crop area before continuing.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const file = await exportCroppedJpegFile(
        image,
        crop,
        profile,
        fileName.replace(/\.[^.]+$/, ".jpg")
      );
      console.log("Calling onConfirm with file");
      onConfirm(file);
    } catch (exportError) {
      console.error("ImageCropModal: crop export failed", exportError);
      setError("Unable to crop image. Please try again.");
      setProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 sm:p-4"
      onClick={() => {
        if (!processing) onCancel();
      }}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-title"
      >
        <div className="shrink-0 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="image-crop-title" className="text-base font-semibold text-white sm:text-lg">
            Crop image
          </h2>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Drag to reposition. Scroll or use the slider to zoom.
          </p>
        </div>

        <div
          className="image-crop-shell w-full bg-black/40 p-4 sm:p-5"
          onWheel={handleWheel}
        >
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            aspect={profile.aspect}
            circularCrop={profile.circular}
            minWidth={Math.min(profile.minWidth, 80)}
            minHeight={Math.min(profile.minHeight, 80)}
            className="w-full"
          >
            <img
              ref={imgRef}
              alt="Crop preview"
              src={imageSrc}
              onLoad={onImageLoad}
              className="block h-auto w-full"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center center",
              }}
            />
          </ReactCrop>
        </div>

        <div className="sticky bottom-0 z-10 shrink-0 space-y-3 border-t border-border bg-surface px-4 py-3 sm:space-y-4 sm:px-6 sm:py-4">
          <div>
            <label
              htmlFor="crop-zoom"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted"
            >
              Zoom
            </label>
            <input
              id="crop-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
              className="w-full accent-accent"
              disabled={processing}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={processing}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? "Processing..." : "Crop & Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
