import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateWorkoutPlan, type WorkoutPreferences } from "@/lib/workout-generator";
import type { MuscleGroup } from "@/lib/exercises";
import { MUSCLE_GROUP_ICONS, dominantMuscleGroup } from "@/lib/muscle-icons";
import { Dumbbell, Check } from "lucide-react";
import { lastDateKeys, formatWeekdayShort, toDateKey } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function WorkoutsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } });
  if (!profile) redirect("/setup");

  const prefs: WorkoutPreferences = {
    daysPerWeek: profile.daysPerWeek ?? 4,
    splitStyle: (profile.splitStyle as WorkoutPreferences["splitStyle"]) ?? "push_pull_legs",
    equipmentPreference: (profile.equipmentPreference as WorkoutPreferences["equipmentPreference"]) ?? "machines",
    favoriteMuscleGroups: (profile.favoriteMuscleGroups as MuscleGroup[]) ?? [],
    goal: profile.goal as WorkoutPreferences["goal"],
    age: profile.age,
    seed: session.user.id,
  };
  const workouts = generateWorkoutPlan(prefs);

  const weekDateKeys = lastDateKeys(7);
  const todayKey = toDateKey(new Date());
  const weekLogs = await prisma.workoutLog.findMany({
    where: { userId: session.user.id, date: { in: weekDateKeys } },
    select: { date: true, planDayId: true },
  });
  const weekDatesWithWorkout = new Set(weekLogs.map((l) => l.date));
  const weekPlanDayIds = new Set(weekLogs.map((l) => l.planDayId).filter((id): id is string => !!id));

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="font-display text-[22px] font-bold">Treinos</div>
      <div className="mb-5 text-[13px] text-dim">Seu plano, montado a partir das suas respostas</div>

      <div className="mb-6 flex items-center justify-between rounded-[18px] border border-line bg-panel px-4 py-4">
        {weekDateKeys.map((dateKey) => {
          const done = weekDatesWithWorkout.has(dateKey);
          const isToday = dateKey === todayKey;
          const d = new Date(`${dateKey}T00:00:00`);
          return (
            <div key={dateKey} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-dim">{formatWeekdayShort(d)}</span>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  background: done ? "var(--accent)" : "transparent",
                  border: done ? "none" : isToday ? "2px solid var(--accent)" : "1.5px solid var(--line)",
                }}
              >
                {done && <Check size={14} strokeWidth={3} color="#0B0B0C" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {workouts.map((w) => {
          const group = dominantMuscleGroup(w.exercises.map((e) => e.muscleGroup));
          const Icon = group ? MUSCLE_GROUP_ICONS[group] : Dumbbell;
          const doneThisWeek = weekPlanDayIds.has(w.id);
          return (
            <Link
              key={w.id}
              href={`/workouts/${w.id}`}
              className="flex flex-col gap-3 rounded-[18px] border border-line bg-panel p-4.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: w.color }}>
                    {w.category}
                  </div>
                  <div className="font-display mt-1 flex items-center gap-1.5 text-[17px] font-bold">
                    <span style={{ textDecoration: doneThisWeek ? "underline" : "none" }}>{w.name}</span>
                    {doneThisWeek && (
                      <span
                        className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: w.color }}
                      >
                        <Check size={10} strokeWidth={3} color="#0B0B0C" />
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: w.color }}
                >
                  <Icon size={18} color="#0B0B0C" strokeWidth={2.3} />
                </div>
              </div>
              <div className="flex gap-4 text-xs text-dim">
                <span>{w.duration}</span>
                <span>{w.exercises.length} exercícios</span>
                <span>{w.level}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
