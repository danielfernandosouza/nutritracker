"use client";

import { useState } from "react";
import { Dumbbell, Scale, Flame } from "lucide-react";
import { MealIcon } from "@/components/MealIcon";
import { DaySummaryModal } from "@/components/DaySummaryModal";
import { toDateKey } from "@/lib/date";
import { EMPTY_TOTALS, type MealTotals } from "@/lib/targets";
import { estimateBaselineBurnKcal, classifyEnergyBalance } from "@/lib/calorie-burn";
import type { Goal } from "@/lib/calculations";
import type { Meal } from "@/lib/types";

type Day = {
  dateKey: string;
  meals: Meal[];
  hasWorkout: boolean;
  caloriesBurnedFromWorkout: number | null;
  weightKg: number | null;
};

const BALANCE_COLOR: Record<"good" | "watch" | "neutral", string> = {
  good: "var(--accent)",
  watch: "var(--sodium)",
  neutral: "var(--dim)",
};

function formatHistoryDate(dateKey: string, todayKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (dateKey === todayKey) return "Hoje";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === toDateKey(yesterday)) return "Ontem";

  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${days[date.getDay()]}, ${d} ${months[m - 1]}`;
}

export function HistoryDayList({
  days,
  targets,
  todayKey,
  tdee,
  goal,
}: {
  days: Day[];
  targets: MealTotals;
  todayKey: string;
  tdee: number;
  goal: Goal;
}) {
  const [selected, setSelected] = useState<Day | null>(null);

  return (
    <>
      {days.map((day) => {
        const totals = day.meals.reduce(
          (acc, m) => ({
            calories: acc.calories + m.calories,
            protein: acc.protein + m.protein,
            carbs: acc.carbs + m.carbs,
            fat: acc.fat + m.fat,
            sodium: acc.sodium + m.sodium,
            sugar: acc.sugar + m.sugar,
          }),
          EMPTY_TOTALS,
        );

        const isToday = day.dateKey === todayKey;
        const baselineBurn = isToday ? estimateBaselineBurnKcal(tdee) : Math.round(tdee);
        const burnedTotal = baselineBurn + (day.caloriesBurnedFromWorkout ?? 0);
        const netKcal = Math.round(totals.calories - burnedTotal);
        const balance = classifyEnergyBalance(netKcal, goal);
        const balanceColor = BALANCE_COLOR[balance];

        return (
          <button key={day.dateKey} onClick={() => setSelected(day)} className="mb-6 block w-full text-left">
            <div className="mb-2.5 flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold">{formatHistoryDate(day.dateKey, todayKey)}</span>
                {day.hasWorkout && (
                  <span className="flex items-center gap-1 rounded-full bg-track px-2 py-0.5 text-[10px] font-semibold text-accent">
                    <Dumbbell size={10} strokeWidth={2.4} />
                    treino
                  </span>
                )}
                {day.caloriesBurnedFromWorkout !== null && (
                  <span className="flex items-center gap-1 rounded-full bg-track px-2 py-0.5 text-[10px] font-semibold text-dim">
                    <Flame size={10} strokeWidth={2.4} />
                    {Math.round(day.caloriesBurnedFromWorkout)}kcal
                  </span>
                )}
                {day.weightKg !== null && (
                  <span className="flex items-center gap-1 rounded-full bg-track px-2 py-0.5 text-[10px] font-semibold text-dim">
                    <Scale size={10} strokeWidth={2.4} />
                    {day.weightKg}kg
                  </span>
                )}
              </div>
              <div className="num text-[13px] text-dim">{Math.round(totals.calories)} kcal</div>
            </div>

            <div className="mb-1 text-[11px] text-dim">
              P {Math.round(totals.protein)}g · G {Math.round(totals.fat)}g · C {Math.round(totals.carbs)}g
            </div>

            <div className="mb-2 text-[11px] font-semibold" style={{ color: balanceColor }}>
              Consumiu {Math.round(totals.calories)} · Queimou ~{burnedTotal} ·{" "}
              {netKcal <= 0 ? `déficit de ${Math.abs(netKcal)}kcal` : `superávit de ${netKcal}kcal`}
            </div>

            <div className="flex flex-col gap-2">
              {day.meals.map((meal) => (
                <div key={meal.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-3.5 py-2.5">
                  <MealIcon photo={meal.photo} emoji={meal.emoji} size={34} rounded="rounded-lg" />
                  <div className="min-w-0 flex-1 truncate text-[13px] font-medium">{meal.name}</div>
                  <div className="num min-w-[44px] text-right text-[13px] font-bold">{Math.round(meal.calories)}</div>
                </div>
              ))}
            </div>
          </button>
        );
      })}

      {selected && (
        <DaySummaryModal
          date={selected.dateKey}
          meals={selected.meals}
          targets={targets}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
