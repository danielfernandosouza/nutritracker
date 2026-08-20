"use client";

import { X } from "lucide-react";
import { MacroRows } from "@/components/MacroRows";
import { MealIcon } from "@/components/MealIcon";
import { useLockBodyScroll } from "@/lib/hooks/useLockBodyScroll";
import { EMPTY_TOTALS, type MealTotals } from "@/lib/targets";
import type { Meal } from "@/lib/types";

function formatLongDate(dateKey: string): string {
  const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function DaySummaryModal({
  date,
  meals,
  targets,
  onClose,
}: {
  date: string;
  meals: Meal[];
  targets: MealTotals;
  onClose: () => void;
}) {
  useLockBodyScroll(true);

  const totals = meals.reduce(
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

  const pct = Math.round((totals.calories / targets.calories) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-[420px] overflow-y-auto rounded-t-3xl border-t border-line bg-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="font-display text-[16px] font-bold capitalize">{formatLongDate(date)}</div>
            <div className="mt-0.5 text-[13px] text-dim">{meals.length} refeições registradas</div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full bg-track text-dim">
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-line bg-track px-4 py-3.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="num text-[22px] font-bold">{Math.round(totals.calories)}</span>
              <span className="text-[12px] font-semibold text-dim">kcal</span>
            </div>
            <span className="text-[13px] font-semibold text-dim">de {targets.calories} kcal ({pct}%)</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: pct > 115 ? "var(--sodium)" : pct < 70 ? "var(--fat)" : "var(--accent)",
              }}
            />
          </div>
        </div>

        {meals.length > 0 ? (
          <>
            <div className="mb-3">
              <MacroRows totals={totals} targets={targets} />
            </div>

            <div className="flex flex-col gap-2">
              {meals.map((meal) => (
                <div key={meal.id} className="flex items-center gap-3 rounded-2xl border border-line bg-track px-3.5 py-3">
                  <MealIcon photo={meal.photo} emoji={meal.emoji} size={40} rounded="rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{meal.name}</div>
                    <div className="mt-0.5 text-[11px] text-dim">
                      P {meal.protein}g · G {meal.fat}g · C {meal.carbs}g
                    </div>
                  </div>
                  <span className="num text-[13px] font-bold text-accent">{Math.round(meal.calories)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-line bg-track px-5 py-6 text-center text-sm text-dim">
            Nenhuma refeição registrada nesse dia.
          </div>
        )}
      </div>
    </div>
  );
}
