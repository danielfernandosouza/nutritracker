"use client";

import { Moon, ChevronRight } from "lucide-react";
import type { SleepFeedback } from "@/lib/wellness";

export function SleepCard({ feedback, onOpenLog }: { feedback: SleepFeedback | null; onOpenLog: () => void }) {
  const color =
    feedback?.quality === "good" ? "var(--accent)" : feedback?.quality === "short" ? "var(--sodium)" : "var(--sugar)";

  return (
    <button
      onClick={onOpenLog}
      className="mb-6 flex w-full items-center gap-3.5 rounded-3xl border border-line bg-panel p-5 text-left"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: feedback ? "color-mix(in srgb, " + color + " 18%, var(--panel))" : "var(--track)" }}
      >
        <Moon size={22} strokeWidth={2} color={feedback ? color : "var(--dim)"} />
      </div>
      <div className="min-w-0 flex-1">
        {feedback ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[20px] font-bold leading-none">
                {feedback.durationHours.toFixed(1).replace(".0", "")}h
              </span>
              <span className="text-[13px] font-semibold text-dim">de sono</span>
            </div>
            <p className="mt-1 truncate text-[12px] text-dim">{feedback.message}</p>
          </>
        ) : (
          <>
            <div className="font-display text-[15px] font-bold">Sono</div>
            <p className="mt-0.5 text-[12px] text-dim">Toque pra registrar a que horas você dormiu e acordou.</p>
          </>
        )}
      </div>
      <ChevronRight size={16} strokeWidth={2} color="var(--dim)" />
    </button>
  );
}
