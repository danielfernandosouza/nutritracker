import Link from "next/link";
import { Flame, ChevronRight } from "lucide-react";

type TodayWorkout = { durationMinutes: number | null; caloriesBurned: number | null } | null;

export function WorkoutStreakCard({
  streak,
  loggedToday,
  today,
}: {
  streak: number;
  loggedToday: boolean;
  today?: TodayWorkout;
}) {
  const hasTodayDetails = loggedToday && (today?.durationMinutes || today?.caloriesBurned);

  const text = hasTodayDetails
    ? [
        today?.durationMinutes ? `${Math.round(today.durationMinutes)} min` : null,
        today?.caloriesBurned ? `${Math.round(today.caloriesBurned)} kcal gastas` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : streak === 0
      ? "Registre seu treino de hoje pra começar sua sequência."
      : loggedToday
        ? "Treino de hoje registrado — continue assim amanhã!"
        : "Não esqueça de concluir o treino de hoje pra manter a sequência.";

  return (
    <Link
      href="/workouts"
      className="mb-6 flex items-center gap-3.5 rounded-3xl border border-line bg-panel p-5"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: streak > 0 ? "color-mix(in srgb, var(--protein) 18%, var(--panel))" : "var(--track)" }}
      >
        <Flame size={22} strokeWidth={2} color={streak > 0 ? "var(--protein)" : "var(--dim)"} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[20px] font-bold leading-none">{streak}</span>
          <span className="text-[13px] font-semibold text-dim">{streak === 1 ? "dia seguido" : "dias seguidos"}</span>
        </div>
        <p className="mt-1 truncate text-[12px] text-dim">{text}</p>
      </div>
      <ChevronRight size={16} strokeWidth={2} color="var(--dim)" />
    </Link>
  );
}
