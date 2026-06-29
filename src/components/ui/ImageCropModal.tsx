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

const CROP_PADDING_PX = 20;

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

function fitImageToContainer(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  containerHeight: number
) {
  const availableWidth = Math.max(containerWidth - CROP_PADDING_PX * 2, 1);
  const availableHeight = Math.max(containerHeight - CROP_PADDING_PX * 2, 1);
  const fitScale = Math.min(
    availableWidth / naturalWidth,
    availableHeight / naturalHeight,
    1
  );

  return {
    width: Math.max(1, Math.floor(naturalWidth * fitScale)),
    height: Math.max(1, Math.floor(naturalHeight * fitScale)),
  };
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
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [baseSize, setBaseSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const [scale, setScale] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyImageFit = useCallback(
    (img: HTMLImageElement) => {
      const container = containerRef.current;
      if (!container) return;

      const fitted = fitImageToContainer(
        img.naturalWidth,
        img.naturalHeight,
        container.clientWidth,
        container.clientHeight
      );

      img.style.width = `${fitted.width}px`;
      img.style.height = `${fitted.height}px`;
      img.style.maxWidth = "none";
      img.style.maxHeight = "none";
      img.style.objectFit = "contain";

      setBaseSize(fitted);
      setScale(1);
      setCrop(
        centerAspectCrop(
          fitted.width,
          fitted.height,
          profile.aspect,
          profile.circular
        )
      );
    },
    [profile.aspect, profile.circular]
  );

  useEffect(() => {
    if (!open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setBaseSize(null);
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

  useEffect(() => {
    if (!open || !baseSize || !imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const container = containerRef.current;
    const maxWidth = container.clientWidth - CROP_PADDING_PX * 2;
    const maxHeight = container.clientHeight - CROP_PADDING_PX * 2;
    const zoomedWidth = baseSize.width * scale;
    const zoomedHeight = baseSize.height * scale;
    const clamp = Math.min(1, maxWidth / zoomedWidth, maxHeight / zoomedHeight);
    const width = Math.max(1, Math.floor(zoomedWidth * clamp));
    const height = Math.max(1, Math.floor(zoomedHeight * clamp));

    img.style.width = `${width}px`;
    img.style.height = `${height}px`;
  }, [baseSize, open, scale]);

  const onImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      applyImageFit(event.currentTarget);
    },
    [applyImageFit]
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
          scale: 1,
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 sm:p-4"
      onClick={() => {
        if (!processing) onCancel();
      }}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
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
          ref={containerRef}
          className="image-crop-shell box-border h-[50vh] max-h-[50vh] w-full shrink-0 overflow-hidden bg-black/40"
          style={{ padding: CROP_PADDING_PX }}
          onWheel={handleWheel}
        >
          <div className="flex h-full w-full items-center justify-center overflow-hidden">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              aspect={profile.aspect}
              circularCrop={profile.circular}
              minWidth={Math.min(profile.minWidth, 80)}
              minHeight={Math.min(profile.minHeight, 80)}
              className="max-h-full max-w-full"
              style={{ maxHeight: "100%", maxWidth: "100%" }}
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imageSrc}
                onLoad={onImageLoad}
                className="block object-contain"
              />
            </ReactCrop>
          </div>
        </div>

        <div className="shrink-0 space-y-3 border-t border-border px-4 py-3 sm:space-y-4 sm:px-6 sm:py-4">
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
