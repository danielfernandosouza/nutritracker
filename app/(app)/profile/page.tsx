import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, Beef, Droplet, Wheat, Waves, Candy, Bell, Ruler, type LucideIcon } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeTargets, computeBMI, GOAL_LABELS, type ProfileInput } from "@/lib/calculations";
import { computeStreakFromDates } from "@/lib/streak";
import { LogoutButton } from "@/components/LogoutButton";

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

  const input: ProfileInput = {
    sex: profile.sex as ProfileInput["sex"],
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    activityLevel: profile.activityLevel as ProfileInput["activityLevel"],
    goal: profile.goal as ProfileInput["goal"],
  };
  const targets = computeTargets(input);
  const bmi = computeBMI(profile.weightKg, profile.heightCm);
  const streak = await computeStreak(session.user.id);

  const GOAL_ROWS: { label: string; value: number; unit: string; cap: boolean; color: string; icon: LucideIcon }[] = [
    { label: "Calorias", value: targets.calories, unit: "kcal", cap: false, color: "var(--accent)", icon: Flame },
    { label: "Proteína", value: targets.protein, unit: "g", cap: false, color: "var(--protein)", icon: Beef },
    { label: "Gordura", value: targets.fat, unit: "g", cap: false, color: "var(--fat)", icon: Droplet },
    { label: "Carboidrato", value: targets.carbs, unit: "g", cap: false, color: "var(--carb)", icon: Wheat },
    { label: "Sódio", value: targets.sodium, unit: "mg", cap: true, color: "var(--sodium)", icon: Waves },
    { label: "Açúcar", value: targets.sugar, unit: "g", cap: true, color: "var(--sugar)", icon: Candy },
  ];

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
          <div className="font-display text-[17px] font-bold">{profile.weightKg} kg</div>
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

      <div className="font-display mb-3 text-[15px] font-bold">Metas diárias</div>
      <div className="mb-6 grid grid-cols-2 gap-2.5">
        {GOAL_ROWS.map((g) => (
          <div
            key={g.label}
            className="relative overflow-hidden rounded-2xl border border-line bg-panel p-4"
          >
            <div
              className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-[0.12]"
              style={{ background: g.color }}
            />
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)", color: g.color }}
            >
              <g.icon size={18} strokeWidth={1.8} />
            </div>
            <div className="text-[11px] font-medium text-dim">{g.label}</div>
            <div className="num mt-0.5 text-[19px] font-bold" style={{ color: g.color }}>
              {g.cap && <span className="text-[13px] font-semibold">&lt;</span>}
              {g.value}
              <span className="ml-0.5 text-[12px] font-semibold text-dim">{g.unit}</span>
            </div>
          </div>
        ))}
      </div>

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
        <LogoutButton />
      </div>
    </div>
  );
}
