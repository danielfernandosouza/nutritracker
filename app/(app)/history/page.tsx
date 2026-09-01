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
      select: { date: true, workoutName: true, caloriesBurned: true, durationMinutes: true, type: true, cardioActivity: true, distanceKm: true },
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
  const strengthDatesWithLog = new Set(workoutLogs.filter((w) => w.type === "STRENGTH").map((w) => w.date));
  const cardioByDate = new Map<string, { cardioActivity: string | null; distanceKm: number | null }[]>();
  for (const w of workoutLogs) {
    if (w.type !== "CARDIO") continue;
    const list = cardioByDate.get(w.date) ?? [];
    list.push({ cardioActivity: w.cardioActivity, distanceKm: w.distanceKm });
    cardioByDate.set(w.date, list);
  }
  const weightByDate = new Map(weightEntries.map((w) => [w.date, w.weightKg]));

  const mealsByDate = new Map<string, typeof meals>();
  for (const meal of meals) {
    const list = mealsByDate.get(meal.date) ?? [];
    list.push(meal);
    mealsByDate.set(meal.date, list);
  }

  // Um dia pode ter só treino/cardio registrado, sem nenhuma refeição — ainda assim precisa
  // aparecer no histórico, então a lista de dias é a união de datas com refeição OU com log.
  const allDates = new Set([...mealsByDate.keys(), ...workoutLogs.map((w) => w.date)]);
  const sortedDates = Array.from(allDates)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 30);

  const days = sortedDates.map((dateKey) => {
    const dayMeals = mealsByDate.get(dateKey) ?? [];
    return {
      dateKey,
      meals: dayMeals.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      hasWorkout: strengthDatesWithLog.has(dateKey),
      cardioSessions: cardioByDate.get(dateKey) ?? [],
      caloriesBurnedFromWorkout: workoutByDate.get(dateKey) ?? null,
      weightKg: weightByDate.get(dateKey) ?? null,
    };
  });

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="font-display mb-5 text-[22px] font-bold">Histórico</div>

      {days.length === 0 ? (
        <p className="text-sm text-dim">Nenhuma refeição ou treino registrado ainda.</p>
      ) : (
        <HistoryDayList days={days} targets={targets} todayKey={todayKey} tdee={targets.tdee} goal={profile.goal as ProfileInput["goal"]} />
      )}
    </div>
  );
}
