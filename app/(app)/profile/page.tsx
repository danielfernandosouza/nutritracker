import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Ruler } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeTargets, computeBMI, GOAL_LABELS, type ProfileInput } from "@/lib/calculations";
import { computeWaterTargetMl, computeSleepTargetHours } from "@/lib/wellness";
import { computeStreakFromDates } from "@/lib/streak";
import { lastDateKeys } from "@/lib/date";
import { LogoutButton } from "@/components/LogoutButton";
import { BiometricSetupButton } from "@/components/BiometricSetupButton";
import { ProfileGoalsGrid } from "@/components/ProfileGoalsGrid";
import { WeightSection } from "@/components/WeightSection";

export const dynamic = "force-dynamic";

async function computeStreak(userId: string): Promise<number> {
  const rows = await prisma.meal.findMany({
    where: { userId },
    distinct: ["date"],
    select: { date: true },
  });
  return computeStreakFromDates(new Set(rows.map((r) => r.date)));
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } });
  if (!profile) redirect("/setup");

  const weightHistoryStart = lastDateKeys(90)[0];
  const weightEntries = await prisma.weightEntry.findMany({
    where: { userId: session.user.id, date: { gte: weightHistoryStart } },
    orderBy: { date: "asc" },
    select: { date: true, weightKg: true },
  });
  const latestWeightKg = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weightKg : profile.weightKg;

  const input: ProfileInput = {
    sex: profile.sex as ProfileInput["sex"],
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    activityLevel: profile.activityLevel as ProfileInput["activityLevel"],
    goal: profile.goal as ProfileInput["goal"],
  };
  const targets = computeTargets(input);
  const bmi = computeBMI(latestWeightKg, profile.heightCm);
  const streak = await computeStreak(session.user.id);

  const yesterday = lastDateKeys(2)[0];
  const workedOutYesterday = !!(await prisma.workoutLog.findFirst({
    where: { userId: session.user.id, date: yesterday },
    select: { id: true },
  }));
  const waterTargetMl = computeWaterTargetMl(input);
  const sleepTarget = computeSleepTargetHours(profile.age, workedOutYesterday);

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-panel p-4">
          <Image src="/icons/icon-transparent.png" alt="" width={56} height={56} />
        </div>
        <div className="font-display text-[19px] font-bold">Perfil</div>
        <div className="text-[13px] text-dim">
          {GOAL_LABELS[input.goal].label} · {profile.age} anos · {Math.round(profile.heightCm) / 100}m
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl border border-line bg-panel p-3.5 text-center">
          <div className="font-display text-[17px] font-bold">{latestWeightKg} kg</div>
          <div className="mt-0.5 text-[11px] text-dim">peso atual</div>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-3.5 text-center">
          <div className="font-display text-[17px] font-bold">{bmi.value}</div>
          <div className="mt-0.5 text-[11px] text-dim">IMC · {bmi.category}</div>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-3.5 text-center">
          <div className="font-display text-[17px] font-bold">{streak}</div>
          <div className="mt-0.5 text-[11px] text-dim">dias seguidos</div>
        </div>
      </div>

      <WeightSection entries={weightEntries} currentWeightKg={latestWeightKg} />

      <ProfileGoalsGrid
        targets={targets}
        waterTargetMl={waterTargetMl}
        sleepTargetMinHours={sleepTarget.minHours}
        sleepTargetMaxHours={sleepTarget.maxHours}
      />

      <div className="flex flex-col gap-2">
        <Link
          href="/setup"
          className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5 text-sm font-medium text-accent"
        >
          <Ruler size={16} strokeWidth={2} />
          Editar respostas do perfil
        </Link>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5 text-sm font-medium">
          <Bell size={16} strokeWidth={2} color="var(--dim)" />
          Notificações
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5 text-sm font-medium">
          <Ruler size={16} strokeWidth={2} color="var(--dim)" />
          Unidades e preferências
        </div>
        {session.user.email && <BiometricSetupButton email={session.user.email} />}
        <LogoutButton />
      </div>
    </div>
  );
}
