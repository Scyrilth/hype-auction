export default function ReferenceNumber({
  referenceNumber,
  className = "",
}: {
  referenceNumber: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs text-purple-300 ${className}`.trim()}
      title="Private reference — visible only to seller and winner"
    >
      <span aria-hidden>🔒</span>
      {referenceNumber}
    </span>
  );
}
