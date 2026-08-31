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
  // Um dia pode ter treino de força E cardio — soma as calorias dos dois em vez de um
  // sobrescrever o outro (bug corrigido: antes usava um Map de log único por data).
  const workoutByDate = new Map<string, number | null>();
  for (const w of workoutLogs) {
    const prev = workoutByDate.get(w.date) ?? null;
    if (w.caloriesBurned != null) workoutByDate.set(w.date, (prev ?? 0) + w.caloriesBurned);
    else if (!workoutByDate.has(w.date)) workoutByDate.set(w.date, null);
  }
  const workoutDatesWithLog = new Set(workoutLogs.map((w) => w.date));
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
      return {
        dateKey,
        meals: dayMeals.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
        hasWorkout: workoutDatesWithLog.has(dateKey),
        caloriesBurnedFromWorkout: workoutByDate.get(dateKey) ?? null,
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
