"use client";

import { useEffect, useState } from "react";

import { getSecondsUntil } from "@/lib/format";

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function CountdownTimer({
  endTime,
  compact = false,
}: {
  endTime: string;
  compact?: boolean;
}) {
  const [seconds, setSeconds] = useState(() => getSecondsUntil(endTime));

  useEffect(() => {
    const tick = () => setSeconds(getSecondsUntil(endTime));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return (
    <span
      className="font-mono font-bold tracking-wider text-live-red"
      style={{
        fontSize: compact
          ? "clamp(0.75rem, 1.2vw, 0.875rem)"
          : "clamp(1.125rem, 2.5vw, 1.5rem)",
      }}
    >
      {seconds <= 0 ? "00:00:00" : formatTime(seconds)}
    </span>
  );
}
