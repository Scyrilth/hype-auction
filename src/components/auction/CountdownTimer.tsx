"use client";

import { useEffect, useState } from "react";

import { getSecondsUntil } from "@/lib/format";
import { getTimerColor } from "@/lib/timer-color";

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function CountdownTimer({
  endTime,
  compact = false,
  large = false,
}: {
  endTime: string;
  compact?: boolean;
  large?: boolean;
}) {
  const [seconds, setSeconds] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSeconds(getSecondsUntil(endTime));
    const tick = () => setSeconds(getSecondsUntil(endTime));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const colorClass = !mounted
    ? "text-muted"
    : seconds <= 0
      ? "text-muted"
      : getTimerColor(seconds);

  const sizeClass = large
    ? "text-[clamp(1.75rem,4vw,2.75rem)]"
    : compact
      ? "text-xs"
      : "text-[clamp(1.125rem,2.5vw,1.5rem)]";

  return (
    <span
      className={`whitespace-nowrap font-mono font-bold tracking-wider ${sizeClass} ${colorClass}`}
    >
      {!mounted ? "--:--:--" : seconds <= 0 ? "00:00:00" : formatTime(seconds)}
    </span>
  );
}
