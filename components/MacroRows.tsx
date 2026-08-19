import type { MealTotals } from "@/lib/targets";

function MacroRow({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min((value / target) * 100, 100);
  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-3.5">
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="num text-dim">
          {Math.round(value)}{unit} / {target}{unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-track">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function MacroRows({ totals, targets }: { totals: MealTotals; targets: MealTotals }) {
  return (
    <div className="flex flex-col gap-2.5">
      <MacroRow label="Proteína" value={totals.protein} target={targets.protein} unit="g" color="var(--protein)" />
      <MacroRow label="Gordura" value={totals.fat} target={targets.fat} unit="g" color="var(--fat)" />
      <MacroRow label="Carboidrato" value={totals.carbs} target={targets.carbs} unit="g" color="var(--carb)" />
      <MacroRow label="Sódio" value={totals.sodium} target={targets.sodium} unit="mg" color="var(--sodium)" />
      <MacroRow label="Açúcar" value={totals.sugar} target={targets.sugar} unit="g" color="var(--sugar)" />
    </div>
  );
}
