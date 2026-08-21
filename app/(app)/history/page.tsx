import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { toDateKey, lastDateKeys } from "@/lib/date";
import { computeTargets, type ProfileInput } from "@/lib/calculations";
import { HistoryDayList } from "@/components/HistoryDayList";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } });
  if (!profile) redirect("/setup");

  const input: ProfileInput = {
    sex: profile.sex as ProfileInput["sex"],
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    activityLevel: profile.activityLevel as ProfileInput["activityLevel"],
    goal: profile.goal as ProfileInput["goal"],
  };
  const targets = computeTargets(input);

  const historyStart = lastDateKeys(30)[0];

  const [meals, workoutLogs, weightEntries] = await Promise.all([
    prisma.meal.findMany({
      where: { userId: session.user.id },
      orderBy: [{ date: "desc" }, { createdAt: "asc" }],
      take: 300,
    }),
    prisma.workoutLog.findMany({
      where: { userId: session.user.id, date: { gte: historyStart } },
      select: { date: true, workoutName: true, caloriesBurned: true, durationMinutes: true },
    }),
    prisma.weightEntry.findMany({
      where: { userId: session.user.id, date: { gte: historyStart } },
      select: { date: true, weightKg: true },
    }),
  ]);

  const todayKey = toDateKey(new Date());
  const workoutByDate = new Map(workoutLogs.map((w) => [w.date, w]));
  const weightByDate = new Map(weightEntries.map((w) => [w.date, w.weightKg]));

  const byDate = new Map<string, typeof meals>();
  for (const meal of meals) {
    const list = byDate.get(meal.date) ?? [];
    list.push(meal);
    byDate.set(meal.date, list);
  }

  const days = Array.from(byDate.entries())
    .slice(0, 30)
    .map(([dateKey, dayMeals]) => {
      const workoutLog = workoutByDate.get(dateKey);
      return {
        dateKey,
        meals: dayMeals.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
        hasWorkout: !!workoutLog,
        caloriesBurnedFromWorkout: workoutLog?.caloriesBurned ?? null,
        weightKg: weightByDate.get(dateKey) ?? null,
      };
    });

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="font-display mb-5 text-[22px] font-bold">Histórico</div>

      {days.length === 0 ? (
        <p className="text-sm text-dim">Nenhuma refeição registrada ainda.</p>
      ) : (
        <HistoryDayList days={days} targets={targets} todayKey={todayKey} tdee={targets.tdee} goal={profile.goal as ProfileInput["goal"]} />
      )}
    </div>
  );
}
