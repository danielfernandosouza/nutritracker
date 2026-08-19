import { X } from "lucide-react";
import { MealIcon } from "@/components/MealIcon";
import type { Meal } from "@/lib/types";

export function MealList({
  meals,
  onDelete,
  onEdit,
}: {
  meals: Meal[];
  onDelete: (id: string) => void;
  onEdit: (meal: Meal) => void;
}) {
  return (
    <>
      <div className="mb-3.5 flex items-center justify-between">
        <div className="font-display text-[17px] font-bold">Refeições de hoje</div>
        <span className="text-[13px] text-dim">{meals.length} registradas</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {meals.length === 0 ? (
          <div className="rounded-2xl border border-line bg-panel px-5 py-6 text-center text-sm text-dim">
            Nenhuma refeição registrada ainda. Toque no botão de câmera pra escanear um prato ou adicione manualmente.
          </div>
        ) : (
          meals
            .slice()
            .reverse()
            .map((meal) => (
              <button
                key={meal.id}
                onClick={() => onEdit(meal)}
                className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3 text-left active:opacity-80"
              >
                <MealIcon photo={meal.photo} emoji={meal.emoji} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{meal.name}</div>
                  <div className="mt-0.5 truncate text-xs text-dim">
                    P {meal.protein}g · G {meal.fat}g · C {meal.carbs}g
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="num text-[15px] font-bold text-accent">{Math.round(meal.calories)}</span>
                  <span className="text-[11px] font-semibold text-dim">kcal</span>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(meal.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      onDelete(meal.id);
                    }
                  }}
                  aria-label={`Excluir ${meal.name}`}
                  className="rounded-md px-1.5 py-1 text-dim hover:text-sodium"
                >
                  <X size={14} strokeWidth={2.2} />
                </span>
              </button>
            ))
        )}
      </div>
    </>
  );
}
