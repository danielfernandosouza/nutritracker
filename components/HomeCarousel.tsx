"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Flame, ChevronRight } from "lucide-react";
import { Ring } from "@/components/Ring";
import { classifyEnergyBalance, type EnergyBalance } from "@/lib/calorie-burn";
import { METRIC_INFO } from "@/lib/metric-info";
import type { Goal } from "@/lib/calculations";

const BALANCE_COLOR: Record<EnergyBalance, string> = {
  good: "var(--accent)",
  watch: "var(--sodium)",
  neutral: "var(--dim)",
};

const caloriesBlurb = METRIC_INFO.calories.whyThisTarget.split(". ")[0] + ".";

export function HomeCarousel({
  totalsCalories,
  targetCalories,
  kcalRemaining,
  burnedTodayKcal,
  workoutBurnKcal,
  onOpenCaloriesInfo,
  workoutStreak,
  workoutLoggedToday,
  workoutToday,
  goal,
}: {
  totalsCalories: number;
  targetCalories: number;
  kcalRemaining: number;
  burnedTodayKcal: number;
  workoutBurnKcal: number;
  onOpenCaloriesInfo: () => void;
  workoutStreak: number;
  workoutLoggedToday: boolean;
  workoutToday: { durationMinutes: number | null; caloriesBurned: number | null } | null;
  goal: Goal;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const cardCount = 3;

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(cardCount - 1, Math.max(0, index)));
  }

  const netKcal = Math.round(totalsCalories - burnedTodayKcal);
  const balance = classifyEnergyBalance(netKcal, goal);
  const balanceColor = BALANCE_COLOR[balance];
  const balanceText =
    netKcal <= 0
      ? `Déficit de ${Math.abs(netKcal)} kcal hoje`
      : `Superávit de ${netKcal} kcal hoje`;
  const goalContext =
    goal === "lose_fat" || goal === "recomposition"
      ? "Seu objetivo pede déficit — quanto mais consistente, melhor."
      : goal === "gain_muscle"
        ? "Seu objetivo pede superávit — sem exagerar, pra ganhar sem acumular gordura demais."
        : "Seu objetivo é manter — o ideal é ficar perto de zero.";

  const cardBaseClass = "flex w-full shrink-0 snap-center flex-col rounded-3xl border border-line bg-panel p-6";

  return (
    <div className="mb-4">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <button onClick={onOpenCaloriesInfo} className={`${cardBaseClass} items-start text-left`}>
          <div className="flex w-full items-center gap-5">
            <Ring value={totalsCalories} target={targetCalories} color="var(--accent)" />
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-[28px] font-bold leading-none">{Math.round(totalsCalories)}</span>
                <span className="text-[13px] font-semibold text-dim">kcal</span>
              </div>
              <div className="mt-1 text-[13px] text-dim">de {targetCalories} kcal</div>
              <div className="mt-2.5 text-[13px] font-semibold text-accent">{Math.round(kcalRemaining)} kcal restantes</div>
              {burnedTodayKcal > 0 && (
                <div className="mt-1 text-[11px] text-dim">
                  🔥 ~{burnedTodayKcal} kcal queimadas hoje{workoutBurnKcal > 0 ? "" : " (estimativa)"}
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-dim">{caloriesBlurb}</p>
        </button>

        <Link href="/workouts" className={`${cardBaseClass} justify-between`}>
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: workoutStreak > 0 ? "color-mix(in srgb, var(--protein) 18%, var(--panel))" : "var(--track)" }}
            >
              <Flame size={22} strokeWidth={2} color={workoutStreak > 0 ? "var(--protein)" : "var(--dim)"} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-[24px] font-bold leading-none">{workoutStreak}</span>
                <span className="text-[13px] font-semibold text-dim">{workoutStreak === 1 ? "dia seguido" : "dias seguidos"}</span>
              </div>
            </div>
            <ChevronRight size={16} strokeWidth={2} color="var(--dim)" />
          </div>
          <p className="mt-4 text-[13px] text-dim">
            {workoutLoggedToday
              ? [
                  "Treino de hoje registrado.",
                  workoutToday?.durationMinutes ? `${Math.round(workoutToday.durationMinutes)} min` : null,
                  workoutToday?.caloriesBurned ? `${Math.round(workoutToday.caloriesBurned)} kcal gastas` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : workoutStreak === 0
                ? "Registre seu treino de hoje pra começar sua sequência."
                : "Não esqueça de concluir o treino de hoje pra manter a sequência."}
          </p>
        </Link>

        <div className={cardBaseClass}>
          <div className="text-[11px] font-bold uppercase tracking-wide text-dim">Resumo do dia</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-[24px] font-bold leading-none" style={{ color: balanceColor }}>
              {balanceText}
            </span>
          </div>
          <div className="mt-2 text-[13px] text-dim">
            Consumiu {Math.round(totalsCalories)} kcal · Queimou ~{burnedTodayKcal} kcal
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-dim">{goalContext}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {Array.from({ length: cardCount }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === activeIndex ? 16 : 6,
              background: i === activeIndex ? "var(--accent)" : "var(--line)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
