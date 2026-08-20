import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateWorkoutPlan, type WorkoutPreferences } from "@/lib/workout-generator";
import type { MuscleGroup } from "@/lib/exercises";
import { MUSCLE_GROUP_ICONS, dominantMuscleGroup } from "@/lib/muscle-icons";
import { ChevronLeft, ChevronRight, Dumbbell, Check, Moon } from "lucide-react";
import { weekDateKeys, formatWeekdayShort, toDateKey } from "@/lib/date";
import { WorkoutSettingsSheet } from "@/components/WorkoutSettingsSheet";

export const dynamic = "force-dynamic";

const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatWeekRangeLabel(weekKeys: string[]): string {
  const first = new Date(`${weekKeys[0]}T00:00:00`);
  const last = new Date(`${weekKeys[6]}T00:00:00`);
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} de ${MONTHS_SHORT[first.getMonth()]}`;
  }
  return `${first.getDate()} ${MONTHS_SHORT[first.getMonth()]} – ${last.getDate()} ${MONTHS_SHORT[last.getMonth()]}`;
}

export default async function WorkoutsPage(props: PageProps<"/workouts">) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } });
  if (!profile) redirect("/setup");

  const searchParams = await props.searchParams;
  const weekParam = Array.isArray(searchParams.week) ? searchParams.week[0] : searchParams.week;
  const weekOffset = Number.isFinite(Number(weekParam)) ? Math.trunc(Number(weekParam)) : 0;

  const prefs: WorkoutPreferences = {
    daysPerWeek: profile.daysPerWeek ?? 4,
    splitStyle: (profile.splitStyle as WorkoutPreferences["splitStyle"]) ?? "push_pull_legs",
    equipmentPreference: (profile.equipmentPreference as WorkoutPreferences["equipmentPreference"]) ?? "machines",
    favoriteMuscleGroups: (profile.favoriteMuscleGroups as MuscleGroup[]) ?? [],
    goal: profile.goal as WorkoutPreferences["goal"],
    age: profile.age,
    seed: session.user.id,
    restWeekdays: profile.restWeekdays ?? [],
  };
  const workouts = generateWorkoutPlan(prefs);
  const workoutByWeekday = new Map(workouts.map((w) => [w.weekday, w]));

  const weekKeys = weekDateKeys(weekOffset);
  const todayKey = toDateKey(new Date());
  const weekLogs = await prisma.workoutLog.findMany({
    where: { userId: session.user.id, date: { in: weekKeys } },
    select: { date: true, planDayId: true },
  });
  // A workout is "done this week" if it was logged on ANY day within the week, not necessarily
  // the exact calendar date its weekday would suggest — users often log a workout on a different
  // day than it was nominally scheduled for (e.g. catching up late), and the card should still
  // show as completed for the week either way.
  const weekPlanDayIds = new Set(weekLogs.map((l) => l.planDayId).filter((id): id is string => !!id));

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="font-display text-[22px] font-bold">Treinos</div>
          <div className="text-[13px] text-dim">Seu plano, montado a partir das suas respostas</div>
        </div>
        <WorkoutSettingsSheet
          profile={{
            name: profile.name,
            sex: profile.sex,
            age: profile.age,
            heightCm: profile.heightCm,
            weightKg: profile.weightKg,
            activityLevel: profile.activityLevel,
            goal: profile.goal,
            exerciseNotes: profile.exerciseNotes,
            mealsPerDay: profile.mealsPerDay,
            daysPerWeek: profile.daysPerWeek,
            splitStyle: profile.splitStyle,
            equipmentPreference: profile.equipmentPreference,
            favoriteMuscleGroups: profile.favoriteMuscleGroups,
            restWeekdays: profile.restWeekdays,
          }}
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/workouts?week=${weekOffset - 1}`}
          aria-label="Semana anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel"
        >
          <ChevronLeft size={16} strokeWidth={2.2} />
        </Link>
        <div className="text-center">
          <div className="font-display text-[15px] font-bold capitalize">{formatWeekRangeLabel(weekKeys)}</div>
          {weekOffset !== 0 && (
            <Link href="/workouts" className="text-[11px] font-semibold text-accent">
              voltar pra semana atual
            </Link>
          )}
        </div>
        <Link
          href={`/workouts?week=${weekOffset + 1}`}
          aria-label="Próxima semana"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel"
        >
          <ChevronRight size={16} strokeWidth={2.2} />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {weekKeys.map((dateKey) => {
          const d = new Date(`${dateKey}T00:00:00`);
          const weekday = d.getDay();
          const workout = workoutByWeekday.get(weekday);
          const isToday = dateKey === todayKey;
          const dayLabel = `${formatWeekdayShort(d)} · ${d.getDate()}`;

          if (!workout) {
            return (
              <div
                key={dateKey}
                className="flex items-center gap-3 rounded-[18px] border border-dashed border-line px-4.5 py-3.5"
                style={{ opacity: 0.7 }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-track">
                  <Moon size={15} strokeWidth={2} color="var(--dim)" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-dim">{dayLabel}</div>
                  <div className="text-[13px] font-semibold text-dim">Dia de descanso</div>
                </div>
              </div>
            );
          }

          const group = dominantMuscleGroup(workout.exercises.map((e) => e.muscleGroup));
          const Icon = group ? MUSCLE_GROUP_ICONS[group] : Dumbbell;
          const done = weekPlanDayIds.has(workout.id);

          return (
            <Link
              key={dateKey}
              href={`/workouts/${workout.id}`}
              className="flex flex-col gap-3 rounded-[18px] border p-4.5"
              style={{
                borderColor: isToday ? "var(--accent)" : "var(--line)",
                background: "var(--panel)",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-dim">
                    {dayLabel}
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: "color-mix(in srgb, " + workout.color + " 18%, var(--panel))", color: workout.color }}
                    >
                      {workout.splitLabel}
                    </span>
                  </div>
                  <div className="font-display mt-1 flex items-center gap-1.5 text-[17px] font-bold">
                    <span style={{ textDecoration: done ? "underline" : "none" }}>{workout.name}</span>
                    {done && (
                      <span
                        className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: workout.color }}
                      >
                        <Check size={10} strokeWidth={3} color="#0B0B0C" />
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: workout.color }}
                >
                  <Icon size={18} color="#0B0B0C" strokeWidth={2.3} />
                </div>
              </div>
              <div className="flex gap-4 text-xs text-dim">
                <span>{workout.duration}</span>
                <span>{workout.exercises.length} exercícios</span>
                <span>{workout.level}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
