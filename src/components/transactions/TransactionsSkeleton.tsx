export default function TransactionsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="sticky top-0 z-20 -mx-5 border-b border-border bg-background/95 px-5 py-4 backdrop-blur-sm">
        <div className="h-8 w-48 rounded-lg bg-surface-elevated" />
        <div className="mt-3 flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-surface-elevated" />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-border bg-surface"
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-56 rounded-xl border border-border bg-surface"
          />
        ))}
      </div>

      <div className="h-96 rounded-xl border border-border bg-surface" />
    </div>
  );
}
