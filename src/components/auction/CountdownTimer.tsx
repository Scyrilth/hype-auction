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
  large = false,
  urgentThresholdSeconds = 300,
}: {
  endTime: string;
  compact?: boolean;
  large?: boolean;
  urgentThresholdSeconds?: number;
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

  const isUrgent = seconds > 0 && seconds <= urgentThresholdSeconds;
  const fontSize = large
    ? "clamp(1.75rem, 4vw, 2.75rem)"
    : compact
      ? "clamp(0.75rem, 1.2vw, 0.875rem)"
      : "clamp(1.125rem, 2.5vw, 1.5rem)";

  if (!mounted) {
    return (
      <span
        className={`font-mono font-bold tracking-wider ${isUrgent ? "text-live-red" : "text-live-red"}`}
        style={{ fontSize }}
      >
        --:--:--
      </span>
    );
  }

  return (
    <span
      className={`font-mono font-bold tracking-wider ${
        isUrgent || large ? "text-live-red" : "text-live-red"
      } ${isUrgent && large ? "animate-pulse" : ""}`}
      style={{ fontSize }}
    >
      {seconds <= 0 ? "00:00:00" : formatTime(seconds)}
    </span>
  );
}
