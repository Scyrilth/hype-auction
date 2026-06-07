import { getReviewTagLabel, REVIEW_TAG_OPTIONS } from "@/lib/review-tags";

export function ReviewTagDisplay({ tags }: { tags: string[] | null }) {
  if (!tags?.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-[11px] text-zinc-300"
        >
          {getReviewTagLabel(tag)}
        </span>
      ))}
    </div>
  );
}

export function ReviewTagSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const toggle = (tagId: string) => {
    if (selected.includes(tagId)) {
      onChange(selected.filter((id) => id !== tagId));
      return;
    }
    onChange([...selected, tagId]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {REVIEW_TAG_OPTIONS.map((tag) => {
        const active = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-accent bg-accent/20 text-purple-200"
                : "border-border bg-background/60 text-muted hover:border-accent/50 hover:text-white"
            }`}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
