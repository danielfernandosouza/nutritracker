import { TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import type { WeeklySummaryResult } from "@/lib/weekly-summary";

const VERDICT_COLOR: Record<WeeklySummaryResult["weightVerdict"], string> = {
  good: "var(--accent)",
  neutral: "var(--dim)",
  watch: "var(--sodium)",
  no_data: "var(--dim)",
};

function barColor(bar: WeeklySummaryResult["bars"][number]): string {
  if (!bar.hasData) return "var(--line)";
  const ratio = bar.calories / bar.target;
  if (ratio > 1.15) return "var(--sodium)";
  if (ratio < 0.7) return "var(--fat)";
  return "var(--accent)";
}

export function WeeklySummaryCard({
  summary,
  onLogWeight,
  onSelectDay,
}: {
  summary: WeeklySummaryResult;
  onLogWeight: () => void;
  onSelectDay: (date: string) => void;
}) {
  const maxCalories = Math.max(summary.bars[0]?.target ?? 1, ...summary.bars.map((b) => b.calories));

  return (
    <div className="rounded-3xl border border-line bg-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-display text-[15px] font-bold">Resumo da semana</div>
        <button
          onClick={onLogWeight}
          className="flex items-center gap-1 rounded-full border border-line bg-track px-2.5 py-1 text-[11px] font-semibold text-dim"
        >
          <Plus size={11} strokeWidth={2.4} />
          Peso
        </button>
      </div>

      <div className="mb-4 flex items-end justify-between gap-1.5">
        {summary.bars.map((bar) => {
          const heightPct = Math.max(6, Math.min(100, (bar.calories / maxCalories) * 100));
          return (
            <button
              key={bar.date}
              onClick={() => onSelectDay(bar.date)}
              className="flex flex-1 flex-col items-center gap-1.5"
              aria-label={`Ver resumo de ${bar.label}`}
            >
              <div className="relative flex h-20 w-full items-end justify-center overflow-hidden rounded-md bg-track">
                <div
                  className="w-full rounded-md transition-all"
                  style={{ height: `${bar.hasData ? heightPct : 4}%`, background: barColor(bar) }}
                />
              </div>
              <span
                className="text-[10px] font-semibold"
                style={{ color: bar.isToday ? "var(--accent)" : "var(--dim)" }}
              >
                {bar.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-track px-3.5 py-3">
          <div className="text-[11px] text-dim">Dentro da meta</div>
          <div className="num mt-0.5 text-[16px] font-bold">
            {summary.daysOnTarget}
            <span className="text-[12px] font-semibold text-dim">/{summary.daysLogged || 7} dias</span>
          </div>
        </div>
        <div className="rounded-2xl bg-track px-3.5 py-3">
          <div className="text-[11px] text-dim">Peso</div>
          {summary.weightDeltaKg === null ? (
            <div className="mt-0.5 text-[13px] font-semibold text-dim">
              {summary.latestWeightKg ? `${summary.latestWeightKg}kg` : "sem registro"}
            </div>
          ) : (
            <div className="mt-0.5 flex items-center gap-1">
              {summary.weightDeltaKg > 0 ? (
                <TrendingUp size={14} strokeWidth={2.4} color={VERDICT_COLOR[summary.weightVerdict]} />
              ) : summary.weightDeltaKg < 0 ? (
                <TrendingDown size={14} strokeWidth={2.4} color={VERDICT_COLOR[summary.weightVerdict]} />
              ) : (
                <Minus size={14} strokeWidth={2.4} color={VERDICT_COLOR[summary.weightVerdict]} />
              )}
              <span className="num text-[16px] font-bold" style={{ color: VERDICT_COLOR[summary.weightVerdict] }}>
                {summary.weightDeltaKg > 0 ? "+" : ""}
                {summary.weightDeltaKg}kg
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-dim">{summary.verdictText}</p>
    </div>
  );
}
