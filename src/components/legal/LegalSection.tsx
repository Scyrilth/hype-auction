export default function LegalSection({
  title,
  children,
  paragraphs,
  bullets,
}: {
  title: string;
  children?: React.ReactNode;
  paragraphs?: string[];
  bullets?: string[];
}) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-purple-300 sm:text-lg">
        {title}
      </h2>
      {children && (
        <div className="mt-3 text-sm leading-relaxed text-zinc-300">
          {children}
        </div>
      )}
      {paragraphs?.map((paragraph) => (
        <p key={paragraph} className="mt-3 text-sm leading-relaxed text-zinc-300">
          {paragraph}
        </p>
      ))}
      {bullets && bullets.length > 0 && (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
