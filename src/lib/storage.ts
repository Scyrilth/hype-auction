import { supabase } from "@/lib/supabase";

export type StorageBucket = "Avatars" | "Banners" | "Auction-images";

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export function getImageExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) {
    if (fromName === "jpeg" || fromName === "jpg") return "jpg";
    if (["png", "webp", "gif"].includes(fromName)) return fromName;
  }

  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return mimeMap[file.type] ?? "jpg";
}

export function validateImageFile(
  file: File,
  maxSizeMb: number
): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "Please upload a JPEG, PNG, WebP, or GIF image.";
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return `Image must be ${maxSizeMb}MB or smaller.`;
  }

  return null;
}

export function getPublicStorageUrl(bucket: StorageBucket, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

export async function uploadImageToStorage({
  bucket,
  path,
  file,
  onProgress,
}: {
  bucket: StorageBucket;
  path: string;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<string> {
  onProgress?.(0);

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    throw error;
  }

  onProgress?.(100);
  return getPublicStorageUrl(bucket, path);
}
