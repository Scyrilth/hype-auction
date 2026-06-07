"use client";

import AuctionSummaryTile from "@/components/messages/AuctionSummaryTile";
import { parseAuctionSummaryMessage } from "@/lib/auction-lifecycle";

interface TrackingMatch {
  start: number;
  end: number;
  number: string;
}

function findTrackingMatches(content: string): TrackingMatch[] {
  const matches: TrackingMatch[] = [];

  const labeledRe =
    /(?:tracking\s*(?:number)?\s*:)\s*([A-Za-z0-9-]{10,})/gi;

  for (const match of content.matchAll(labeledRe)) {
    const number = match[1];
    const labelEnd = match.index! + match[0].length;
    const start = labelEnd - number.length;
    matches.push({ start, end: start + number.length, number });
  }

  const standaloneRe = /\b([A-Za-z0-9-]{10,})\b/g;

  for (const match of content.matchAll(standaloneRe)) {
    const number = match[1];
    if (!/[0-9]/.test(number)) continue;

    const start = match.index!;
    const end = start + number.length;
    const overlaps = matches.some(
      (existing) => start < existing.end && end > existing.start
    );
    if (overlaps) continue;

    matches.push({ start, end, number });
  }

  return matches.sort((a, b) => a.start - b.start);
}

function CopyTrackingButton({
  trackingNumber,
  onCopy,
}: {
  trackingNumber: string;
  onCopy: (trackingNumber: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(trackingNumber)}
      className="inline-flex shrink-0 items-center justify-center rounded p-0.5 text-current opacity-60 transition-opacity hover:opacity-100"
      aria-label="Copy tracking number"
      title="Copy tracking number"
    >
      <i className="ti ti-copy text-[13px] leading-none" />
    </button>
  );
}

export default function MessageContent({
  content,
  isMine,
  onCopyTracking,
}: {
  content: string;
  isMine: boolean;
  onCopyTracking: (trackingNumber: string) => void;
}) {
  const auctionSummary = parseAuctionSummaryMessage(content);
  if (auctionSummary) {
    return <AuctionSummaryTile summary={auctionSummary} />;
  }

  const matches = findTrackingMatches(content);

  if (matches.length === 0) {
    return <>{content}</>;
  }

  const segments: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      segments.push(content.slice(cursor, match.start));
    }

    segments.push(
      <span
        key={`tracking-${match.start}-${index}`}
        className={`inline-flex items-center gap-1 rounded px-1 py-0.5 font-mono text-[13px] ${
          isMine
            ? "bg-white/15 text-purple-100"
            : "bg-amber-500/15 text-amber-200"
        }`}
      >
        <span>{match.number}</span>
        <CopyTrackingButton
          trackingNumber={match.number}
          onCopy={onCopyTracking}
        />
      </span>
    );

    cursor = match.end;
  });

  if (cursor < content.length) {
    segments.push(content.slice(cursor));
  }

  return <>{segments}</>;
}
