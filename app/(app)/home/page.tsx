import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeTargets, type ProfileInput, type Goal } from "@/lib/calculations";
import { computeWaterTargetMl, computeSleepTargetHours, computeSleepFeedback } from "@/lib/wellness";
import { toDateKey, lastDateKeys } from "@/lib/date";
import { computeStreakFromDates } from "@/lib/streak";
import { HomeClient, type HomeInitialData } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } });
  if (!profile) redirect("/setup");

  const userId = session.user.id;
  const today = new Date();
  const dateKey = toDateKey(today);
  const weekStart = lastDateKeys(7, today)[0];
  const weightHistoryStart = lastDateKeys(21, today)[0];
  const yesterday = lastDateKeys(2)[0];

  const input: ProfileInput = {
    sex: profile.sex as ProfileInput["sex"],
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    activityLevel: profile.activityLevel as ProfileInput["activityLevel"],
    goal: profile.goal as ProfileInput["goal"],
  };
  const targets = computeTargets(input);

  const [weekMealsRaw, weightEntriesRaw, workoutRows, waterEntries, sleepEntryRaw, workedOutYesterday] = await Promise.all([
    prisma.meal.findMany({ where: { userId, date: { gte: weekStart, lte: dateKey } }, orderBy: { createdAt: "asc" } }),
    prisma.weightEntry.findMany({ where: { userId, date: { gte: weightHistoryStart } }, orderBy: { date: "asc" } }),
    prisma.workoutLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.waterEntry.findMany({ where: { userId, date: dateKey } }),
    // Estritamente hoje, igual calorias e água: sono precisa zerar todo dia. A tentativa anterior de
    // também aceitar "ontem" (pra corrigir um typo depois da virada do dia) tinha um efeito colateral
    // pior — editar salvava por id no registro antigo sem nunca criar um novo pro dia atual, e a tela
    // parecia "travada" mostrando sempre o mesmo sono desatualizado. O bug original que motivou aquilo
    // era o fuso horário calculando "hoje" errado no servidor, já corrigido em lib/date.ts.
    prisma.sleepEntry.findFirst({ where: { userId, date: dateKey } }),
    prisma.workoutLog.findFirst({ where: { userId, date: yesterday }, select: { id: true } }),
  ]);

  const sleepTarget = computeSleepTargetHours(profile.age, !!workedOutYesterday);
  const waterTargetMl = computeWaterTargetMl(input);
  const waterTotalMl = waterEntries.reduce((sum, e) => sum + e.amountMl, 0);

  const workoutDates = new Set(workoutRows.map((r) => r.date));
  const workoutStreak = computeStreakFromDates(workoutDates);
  const strengthToday = workoutRows.find((r) => r.date === dateKey && r.type === "STRENGTH") ?? null;
  const cardioToday = workoutRows.find((r) => r.date === dateKey && r.type === "CARDIO") ?? null;
  const workoutToday =
    strengthToday || cardioToday
      ? {
          durationMinutes: (strengthToday?.durationMinutes ?? 0) + (cardioToday?.durationMinutes ?? 0) || null,
          caloriesBurned: (strengthToday?.caloriesBurned ?? 0) + (cardioToday?.caloriesBurned ?? 0) || null,
        }
      : null;

  const weightEntries = weightEntriesRaw.map((e) => ({ date: e.date, weightKg: e.weightKg }));
  const latestLoggedWeightKg = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weightKg : null;

  const weekMeals = weekMealsRaw.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));
  const meals = weekMeals.filter((m) => m.date === dateKey);

  const sleepFeedback = sleepEntryRaw
    ? computeSleepFeedback(sleepEntryRaw.bedTime, sleepEntryRaw.wakeTime, {
        minHours: sleepTarget.minHours,
        maxHours: sleepTarget.maxHours,
      })
    : null;

  const initial: HomeInitialData = {
    meals,
    weekMeals,
    weightEntries,
    profileName: profile.name,
    goal: profile.goal as Goal,
    currentWeightKg: latestLoggedWeightKg ?? profile.weightKg,
    targets,
    tdee: targets.tdee,
    workoutStreak,
    workoutLoggedToday: !!strengthToday,
    workoutToday,
    waterTotalMl,
    waterTargetMl,
    sleepFeedback,
    sleepEntry: sleepEntryRaw ? { id: sleepEntryRaw.id, bedTime: sleepEntryRaw.bedTime, wakeTime: sleepEntryRaw.wakeTime } : null,
  };

  return <HomeClient initial={initial} />;
}
