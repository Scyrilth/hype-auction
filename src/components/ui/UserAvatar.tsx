import Image from "next/image";

import { resolveAvatarUrl } from "@/lib/avatars";

const sizeClasses = {
  xs: "h-7 w-7",
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-14 w-14",
  xl: "h-16 w-16",
  "2xl": "h-20 w-20",
  "3xl": "h-24 w-24",
} as const;

export default function UserAvatar({
  walletAddress,
  avatarUrl,
  alt,
  size = "md",
  className = "",
  rounded = "full",
}: {
  walletAddress: string;
  avatarUrl?: string | null;
  alt: string;
  size?: keyof typeof sizeClasses;
  className?: string;
  rounded?: "full" | "xl" | "lg";
}) {
  const src = resolveAvatarUrl(avatarUrl, walletAddress);
  const roundedClass =
    rounded === "full" ? "rounded-full" : rounded === "xl" ? "rounded-xl" : "rounded-lg";

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-surface-elevated ${sizeClasses[size]} ${roundedClass} ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  );
}
