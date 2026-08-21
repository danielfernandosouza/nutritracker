"use client";

import { useState } from "react";
import { getExerciseDemoImages } from "@/lib/exercises";

export function ExerciseDemo({
  demoName,
  imageUrl,
  size = 56,
}: {
  demoName?: string;
  imageUrl?: string;
  size?: number | string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || (!demoName && !imageUrl)) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-xl bg-track text-lg"
        style={{ width: size, height: size }}
        aria-hidden
      >
        🏋️
      </div>
    );
  }

  if (!demoName && imageUrl) {
    return (
      <div className="relative shrink-0 overflow-hidden rounded-xl bg-track" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }

  const [start, end] = getExerciseDemoImages(demoName!);

  return (
    <div className="relative shrink-0 overflow-hidden rounded-xl bg-track" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={start}
        alt=""
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ animation: "exerciseDemoCrossfade 2.4s ease-in-out infinite" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={end}
        alt=""
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ animation: "exerciseDemoCrossfade 2.4s ease-in-out infinite 1.2s" }}
      />
    </div>
  );
}
