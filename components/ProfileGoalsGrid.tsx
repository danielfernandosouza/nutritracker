"use client";

import { useState } from "react";
import { Flame, Beef, Droplet, Wheat, Waves, Candy, Droplets, Moon, type LucideIcon } from "lucide-react";
import { MetricInfoSheet } from "@/components/MetricInfoSheet";
import type { MetricKey } from "@/lib/metric-info";

type GoalRow = { metric: MetricKey; label: string; value: string; unit: string; cap: boolean; color: string; icon: LucideIcon };

export function ProfileGoalsGrid({
  targets,
  waterTargetMl,
  sleepTargetMinHours,
  sleepTargetMaxHours,
}: {
  targets: { calories: number; protein: number; fat: number; carbs: number; sodium: number; sugar: number };
  waterTargetMl: number;
  sleepTargetMinHours: number;
  sleepTargetMaxHours: number;
}) {
  const [openMetric, setOpenMetric] = useState<MetricKey | null>(null);

  const rows: GoalRow[] = [
    { metric: "calories", label: "Calorias", value: String(targets.calories), unit: "kcal", cap: false, color: "var(--accent)", icon: Flame },
    { metric: "protein", label: "Proteína", value: String(targets.protein), unit: "g", cap: false, color: "var(--protein)", icon: Beef },
    { metric: "fat", label: "Gordura", value: String(targets.fat), unit: "g", cap: false, color: "var(--fat)", icon: Droplet },
    { metric: "carbs", label: "Carboidrato", value: String(targets.carbs), unit: "g", cap: false, color: "var(--carb)", icon: Wheat },
    { metric: "sodium", label: "Sódio", value: String(targets.sodium), unit: "mg", cap: true, color: "var(--sodium)", icon: Waves },
    { metric: "sugar", label: "Açúcar", value: String(targets.sugar), unit: "g", cap: true, color: "var(--sugar)", icon: Candy },
    { metric: "water", label: "Água", value: (waterTargetMl / 1000).toFixed(1), unit: "L", cap: false, color: "var(--accent)", icon: Droplets },
    {
      metric: "sleep",
      label: "Sono",
      value: sleepTargetMinHours === sleepTargetMaxHours ? String(sleepTargetMinHours) : `${sleepTargetMinHours}-${sleepTargetMaxHours}`,
      unit: "h",
      cap: false,
      color: "var(--protein)",
      icon: Moon,
    },
  ];

  return (
    <>
      <div className="font-display mb-3 text-[15px] font-bold">Metas diárias</div>
      <div className="mb-6 grid grid-cols-2 gap-2.5">
        {rows.map((g) => (
          <button
            key={g.metric}
            onClick={() => setOpenMetric(g.metric)}
            className="relative overflow-hidden rounded-2xl border border-line bg-panel p-4 text-left"
          >
            <div
              className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-[0.12]"
              style={{ background: g.color }}
            />
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)", color: g.color }}
            >
              <g.icon size={18} strokeWidth={1.8} />
            </div>
            <div className="text-[11px] font-medium text-dim">{g.label}</div>
            <div className="num mt-0.5 text-[19px] font-bold" style={{ color: g.color }}>
              {g.cap && <span className="text-[13px] font-semibold">&lt;</span>}
              {g.value}
              <span className="ml-0.5 text-[12px] font-semibold text-dim">{g.unit}</span>
            </div>
          </button>
        ))}
      </div>

      <MetricInfoSheet metric={openMetric} onClose={() => setOpenMetric(null)} />
    </>
  );
}
