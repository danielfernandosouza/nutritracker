import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateWorkoutPlan, type WorkoutPreferences } from "@/lib/workout-generator";
import type { MuscleGroup } from "@/lib/exercises";
import { WorkoutDetailClient } from "@/components/WorkoutDetailClient";

export const dynamic = "force-dynamic";

export default async function WorkoutDetailPage(props: PageProps<"/workouts/[id]">) {
  const { id } = await props.params;

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
    restWeekdays: profile.restWeekdays ?? [],
  };
  const workout = generateWorkoutPlan(prefs).find((w) => w.id === id);

  if (!workout) notFound();

  return <WorkoutDetailClient workout={workout} />;
}
