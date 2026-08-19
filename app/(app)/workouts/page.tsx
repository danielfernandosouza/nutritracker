import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateWorkoutPlan, type WorkoutPreferences } from "@/lib/workout-generator";
import type { MuscleGroup } from "@/lib/exercises";
import { MUSCLE_GROUP_ICONS, dominantMuscleGroup } from "@/lib/muscle-icons";
import { Dumbbell } from "lucide-react";

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
  };
  const workouts = generateWorkoutPlan(prefs);

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="font-display text-[22px] font-bold">Treinos</div>
      <div className="mb-5 text-[13px] text-dim">Seu plano, montado a partir das suas respostas</div>

      <div className="flex flex-col gap-3">
        {workouts.map((w) => {
          const group = dominantMuscleGroup(w.exercises.map((e) => e.muscleGroup));
          const Icon = group ? MUSCLE_GROUP_ICONS[group] : Dumbbell;
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
                  <div className="font-display mt-1 text-[17px] font-bold">{w.name}</div>
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
