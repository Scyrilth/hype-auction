"use client";

import { useEffect, useState } from "react";

import { getSecondsUntil } from "@/lib/format";

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function CountdownTimer({ endTime }: { endTime: string }) {
  const [seconds, setSeconds] = useState(() => getSecondsUntil(endTime));

  useEffect(() => {
    const tick = () => setSeconds(getSecondsUntil(endTime));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return (
    <span className="font-mono text-2xl font-bold tracking-wider text-live-red">
      {seconds <= 0 ? "00:00:00" : formatTime(seconds)}
    </span>
  );
}
