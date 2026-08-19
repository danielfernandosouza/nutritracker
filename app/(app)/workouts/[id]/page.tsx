import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { generateWorkoutPlan, type WorkoutPreferences } from "@/lib/workout-generator";
import type { MuscleGroup } from "@/lib/exercises";
import { WorkoutDetailClient } from "@/components/WorkoutDetailClient";

export const dynamic = "force-dynamic";

export default async function WorkoutDetailPage(props: PageProps<"/workouts/[id]">) {
  const { id } = await props.params;

  const profile = await prisma.profile.findUnique({ where: { id: "me" } });
  if (!profile) redirect("/setup");

  const prefs: WorkoutPreferences = {
    daysPerWeek: profile.daysPerWeek ?? 4,
    splitStyle: (profile.splitStyle as WorkoutPreferences["splitStyle"]) ?? "push_pull_legs",
    equipmentPreference: (profile.equipmentPreference as WorkoutPreferences["equipmentPreference"]) ?? "machines",
    favoriteMuscleGroups: (profile.favoriteMuscleGroups as MuscleGroup[]) ?? [],
  };
  const workout = generateWorkoutPlan(prefs).find((w) => w.id === id);

  if (!workout) notFound();

  return <WorkoutDetailClient workout={workout} />;
}
