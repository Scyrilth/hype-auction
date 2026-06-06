import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import WalletNav from "@/components/WalletNav";
import { BellIcon } from "@/components/icons";

const navLinks = ["Browse", "Categories", "Live", "Rewards"];

export default function TopNav() {
  return (
    <header className="flex h-12 shrink-0 flex-wrap items-center gap-3 border-b border-border bg-surface px-3 sm:h-14 sm:gap-4 sm:px-4 lg:gap-6 lg:px-5">
      <div className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-[40%] lg:max-w-xl">
        <GlobalSearchBar />
      </div>

      <nav className="hidden items-center gap-4 lg:flex lg:gap-6">
        {navLinks.map((link) => (
          <a
            key={link}
            href="#"
            className={`text-sm font-medium transition-colors hover:text-white ${
              link === "Live" ? "text-accent" : "text-zinc-400"
            }`}
          >
            {link}
          </a>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <WalletNav />

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-surface-elevated hover:text-white"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
        </button>

        <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-accent bg-gradient-to-br from-purple-500 to-indigo-600" />
      </div>
    </header>
  );
}
