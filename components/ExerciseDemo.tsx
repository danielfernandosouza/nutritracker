"use client";

import { useState } from "react";
import { getExerciseDemoImages } from "@/lib/exercises";

/** One frame of the crossfade — retries once (with a cache-busting param) before giving up, since
    the demo images are hotlinked from a GitHub raw CDN that occasionally hiccups transiently. */
function DemoFrame({ src, delaySeconds, onFail }: { src: string; delaySeconds: number; onFail: () => void }) {
  const [attempt, setAttempt] = useState(0);

  function handleError() {
    if (attempt < 1) {
      setAttempt((a) => a + 1);
    } else {
      onFail();
    }
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={attempt}
      src={attempt > 0 ? `${src}?retry=${attempt}` : src}
      alt=""
      onError={handleError}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ animation: `exerciseDemoCrossfade 2.4s ease-in-out infinite ${delaySeconds}s` }}
    />
  );
}

export function ExerciseDemo({ demoName, size = 56 }: { demoName?: string; size?: number | string }) {
  const [failed, setFailed] = useState(false);

  if (!demoName || failed) {
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

  const [start, end] = getExerciseDemoImages(demoName);

  return (
    <div className="relative shrink-0 overflow-hidden rounded-xl bg-track" style={{ width: size, height: size }}>
      <DemoFrame src={start} delaySeconds={0} onFail={() => setFailed(true)} />
      <DemoFrame src={end} delaySeconds={1.2} onFail={() => setFailed(true)} />
    </div>
  );
}
