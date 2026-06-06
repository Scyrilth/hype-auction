import WalletButton from "@/components/WalletButton";
import { BellIcon, ChevronDownIcon, SearchIcon } from "@/components/icons";

const navLinks = ["Browse", "Categories", "Live", "Rewards"];

export default function TopNav() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-6 border-b border-border bg-surface px-5">
      <div className="relative flex-1 max-w-xl">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Search items, users, categories..."
          className="w-full rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </div>

      <nav className="hidden items-center gap-6 md:flex">
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

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-zinc-300 sm:flex"
        >
          <span className="font-medium text-white">2.45 SOL</span>
          <ChevronDownIcon className="h-3.5 w-3.5 text-muted" />
        </button>

        <WalletButton />

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
