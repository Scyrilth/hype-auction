import type { PixelCrop } from "react-image-crop";

export type ImageUploadVariant = "avatar" | "banner" | "auction";

export type ImageCropProfile = {
  aspect: number;
  minWidth: number;
  minHeight: number;
  circular: boolean;
};

export const IMAGE_CROP_PROFILES: Record<ImageUploadVariant, ImageCropProfile> = {
  avatar: {
    aspect: 1,
    minWidth: 200,
    minHeight: 200,
    circular: true,
  },
  banner: {
    aspect: 16 / 3,
    minWidth: 800,
    minHeight: 150,
    circular: false,
  },
  auction: {
    aspect: 1,
    minWidth: 400,
    minHeight: 400,
    circular: false,
  },
};

const TO_RADIANS = Math.PI / 180;

function drawCroppedImage(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const rotateRads = rotate * TO_RADIANS;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );
  ctx.restore();
}

function resizeCanvasToMinimum(
  source: HTMLCanvasElement,
  minWidth: number,
  minHeight: number
) {
  if (source.width >= minWidth && source.height >= minHeight) {
    return source;
  }

  const widthScale = minWidth / source.width;
  const heightScale = minHeight / source.height;
  const scale = Math.max(widthScale, heightScale, 1);
  const targetWidth = Math.round(source.width * scale);
  const targetHeight = Math.round(source.height * scale);

  const resized = document.createElement("canvas");
  resized.width = targetWidth;
  resized.height = targetHeight;

  const ctx = resized.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  return resized;
}

export async function getCroppedImageFile(
  image: HTMLImageElement,
  crop: PixelCrop,
  profile: ImageCropProfile,
  options?: {
    scale?: number;
    rotate?: number;
    fileName?: string;
  }
): Promise<File> {
  const canvas = document.createElement("canvas");
  drawCroppedImage(image, canvas, crop, options?.scale ?? 1, options?.rotate ?? 0);
  const outputCanvas = resizeCanvasToMinimum(
    canvas,
    profile.minWidth,
    profile.minHeight
  );

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to crop image"));
          return;
        }

        resolve(
          new File([blob], options?.fileName ?? "image.jpg", {
            type: "image/jpeg",
          })
        );
      },
      "image/jpeg",
      0.9
    );
  });
}
