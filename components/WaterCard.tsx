"use client";

import { Droplets } from "lucide-react";

const QUICK_ADD_ML = [250, 500];

export function WaterCard({
  totalMl,
  targetMl,
  onAdd,
  onOpenInfo,
}: {
  totalMl: number;
  targetMl: number;
  onAdd: (amountMl: number) => void;
  onOpenInfo: () => void;
}) {
  const pct = Math.min((totalMl / targetMl) * 100, 100);

  return (
    <button onClick={onOpenInfo} className="mb-6 w-full rounded-3xl border border-line bg-panel p-5 text-left">
      <div className="flex items-center gap-3.5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "color-mix(in srgb, var(--accent) 18%, var(--panel))" }}
        >
          <Droplets size={22} strokeWidth={2} color="var(--accent)" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[20px] font-bold leading-none">{(totalMl / 1000).toFixed(1)}L</span>
            <span className="text-[13px] font-semibold text-dim">de {(targetMl / 1000).toFixed(1)}L</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--accent)" }} />
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {QUICK_ADD_ML.map((ml) => (
            <span
              key={ml}
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(ml);
              }}
              className="rounded-full bg-track px-3 py-2 text-[12px] font-bold text-accent"
            >
              +{ml}ml
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
