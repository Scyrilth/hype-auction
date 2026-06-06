import { EyeIcon } from "@/components/icons";
import Image from "next/image";

export default function LiveStream() {
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-border bg-surface-elevated">
      <div className="relative aspect-video w-full">
        <Image
          src="https://images.unsplash.com/photo-1606503908835-3f39244f23b8?w=800&q=80"
          alt="Live auction stream"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-live-red px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
          <span className="flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
            <EyeIcon />
            1.2K
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="text-lg font-bold text-white">
            1999 Pokemon Pikachu Holo #58
          </h2>
          <p className="mt-0.5 text-sm text-zinc-300">PSA 10 GEM MINT</p>
          <span className="mt-2 inline-block rounded-full bg-accent/20 px-3 py-0.5 text-xs font-medium text-purple-300">
            Trading Cards
          </span>
        </div>
      </div>
    </div>
  );
}
