"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import type { ImageUploadVariant } from "@/lib/image-crop";
import {
  getCroppedImageFile,
  IMAGE_CROP_PROFILES,
} from "@/lib/image-crop";

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
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
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
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
      setCrop(centerAspectCrop(width, height, profile.aspect));
    },
    [profile.aspect]
  );

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    setScale((current) => {
      const next = current + (event.deltaY < 0 ? 0.08 : -0.08);
      return Math.min(3, Math.max(1, Number(next.toFixed(2))));
    });
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop?.width || !completedCrop.height) {
      setError("Adjust the crop area before continuing.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const file = await getCroppedImageFile(
        imgRef.current,
        completedCrop,
        profile,
        {
          scale,
          fileName: fileName.replace(/\.[^.]+$/, ".jpg"),
        }
      );
      onConfirm(file);
    } catch {
      setError("Unable to crop image. Please try again.");
      setProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
      onClick={() => {
        if (!processing) onCancel();
      }}
      role="presentation"
    >
      <div
        className="flex w-full max-w-3xl flex-col rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-title"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="image-crop-title" className="text-lg font-semibold text-white">
              Crop image
            </h2>
            <p className="mt-1 text-sm text-muted">
              Drag to reposition. Scroll or use the slider to zoom.
            </p>
          </div>
        </div>

        <div
          className="image-crop-shell max-h-[55vh] overflow-auto rounded-xl border border-border bg-black/40 p-3"
          onWheel={handleWheel}
        >
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
            aspect={profile.aspect}
            circularCrop={profile.circular}
            minWidth={Math.min(profile.minWidth, 120)}
            minHeight={Math.min(profile.minHeight, 120)}
            className="mx-auto max-w-full"
          >
            <img
              ref={imgRef}
              alt="Crop preview"
              src={imageSrc}
              onLoad={onImageLoad}
              className="mx-auto max-h-[48vh] max-w-full object-contain"
              style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
            />
          </ReactCrop>
        </div>

        <div className="mt-4">
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

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
  );
}
