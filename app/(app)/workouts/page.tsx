import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateWorkoutPlan, type WorkoutPreferences } from "@/lib/workout-generator";
import type { MuscleGroup } from "@/lib/exercises";
import { MUSCLE_GROUP_ICONS, dominantMuscleGroup } from "@/lib/muscle-icons";
import { ChevronLeft, ChevronRight, Dumbbell, Check, Moon, Footprints } from "lucide-react";
import { weekDateKeys, formatWeekdayShort, formatDateLabel, toDateKey } from "@/lib/date";
import { WorkoutSettingsSheet } from "@/components/WorkoutSettingsSheet";
import { CardioLogSheet } from "@/components/CardioLogSheet";

const CARDIO_ACTIVITY_LABELS: Record<string, string> = { RUN: "Corrida", WALK: "Caminhada", HIKE: "Trilha" };

export const dynamic = "force-dynamic";

const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatWeekRangeLabel(weekKeys: string[]): string {
  const first = new Date(`${weekKeys[0]}T00:00:00`);
  const last = new Date(`${weekKeys[6]}T00:00:00`);
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} de ${MONTHS_SHORT[first.getMonth()]}`;
  }
  return `${first.getDate()} ${MONTHS_SHORT[first.getMonth()]} – ${last.getDate()} ${MONTHS_SHORT[last.getMonth()]}`;
}

function formatPace(paceMinPerKm: number | null): string {
  if (paceMinPerKm === null || !Number.isFinite(paceMinPerKm)) return "—";
  const totalSeconds = Math.round(paceMinPerKm * 60);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}

export default async function WorkoutsPage(props: PageProps<"/workouts">) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } });
  if (!profile) redirect("/setup");

  const searchParams = await props.searchParams;
  const tabParam = Array.isArray(searchParams.tab) ? searchParams.tab[0] : searchParams.tab;
  const tab = tabParam === "cardio" ? "cardio" : "strength";

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="font-display text-[22px] font-bold">Treinos</div>
          <div className="text-[13px] text-dim">Seu plano, montado a partir das suas respostas</div>
        </div>
        <WorkoutSettingsSheet
          profile={{
            name: profile.name,
            sex: profile.sex,
            age: profile.age,
            heightCm: profile.heightCm,
            weightKg: profile.weightKg,
            activityLevel: profile.activityLevel,
            goal: profile.goal,
            exerciseNotes: profile.exerciseNotes,
            mealsPerDay: profile.mealsPerDay,
            daysPerWeek: profile.daysPerWeek,
            splitStyle: profile.splitStyle,
            equipmentPreference: profile.equipmentPreference,
            favoriteMuscleGroups: profile.favoriteMuscleGroups,
            restWeekdays: profile.restWeekdays,
          }}
        />
      </div>

      <div className="mb-6 flex gap-2 rounded-2xl border border-line bg-panel p-1">
        <Link
          href="/workouts?tab=strength"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold"
          style={{
            background: tab === "strength" ? "var(--accent)" : "transparent",
            color: tab === "strength" ? "#0B0B0C" : "var(--dim)",
          }}
        >
          <Dumbbell size={14} strokeWidth={2.4} />
          Musculação
        </Link>
        <Link
          href="/workouts?tab=cardio"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold"
          style={{
            background: tab === "cardio" ? "var(--accent)" : "transparent",
            color: tab === "cardio" ? "#0B0B0C" : "var(--dim)",
          }}
        >
          <Footprints size={14} strokeWidth={2.4} />
          Cardio
        </Link>
      </div>

      {tab === "strength" ? (
        <StrengthTab userId={session.user.id} profile={profile} searchParams={searchParams} />
      ) : (
        <CardioTab userId={session.user.id} />
      )}
    </div>
  );
}

async function StrengthTab({
  userId,
  profile,
  searchParams,
}: {
  userId: string;
  profile: NonNullable<Awaited<ReturnType<typeof prisma.profile.findUnique>>>;
  searchParams: Awaited<PageProps<"/workouts">["searchParams"]>;
}) {
  const weekParam = Array.isArray(searchParams.week) ? searchParams.week[0] : searchParams.week;
  const weekOffset = Number.isFinite(Number(weekParam)) ? Math.trunc(Number(weekParam)) : 0;

  const prefs: WorkoutPreferences = {
    daysPerWeek: profile.daysPerWeek ?? 4,
    splitStyle: (profile.splitStyle as WorkoutPreferences["splitStyle"]) ?? "push_pull_legs",
    equipmentPreference: (profile.equipmentPreference as WorkoutPreferences["equipmentPreference"]) ?? "machines",
    favoriteMuscleGroups: (profile.favoriteMuscleGroups as MuscleGroup[]) ?? [],
    goal: profile.goal as WorkoutPreferences["goal"],
    age: profile.age,
    seed: userId,
    restWeekdays: profile.restWeekdays ?? [],
  };
  const workouts = generateWorkoutPlan(prefs);
  const workoutByWeekday = new Map(workouts.map((w) => [w.weekday, w]));

  const weekKeys = weekDateKeys(weekOffset);
  const todayKey = toDateKey(new Date());
  const weekLogs = await prisma.workoutLog.findMany({
    where: { userId, date: { in: weekKeys }, type: "STRENGTH" },
    select: { date: true, planDayId: true },
  });
  // A workout is "done this week" if it was logged on ANY day within the week, not necessarily
  // the exact calendar date its weekday would suggest — users often log a workout on a different
  // day than it was nominally scheduled for (e.g. catching up late), and the card should still
  // show as completed for the week either way.
  const weekPlanDayIds = new Set(weekLogs.map((l) => l.planDayId).filter((id): id is string => !!id));
  // Logging via the watch-photo scan doesn't carry a planDayId (it's "did something", not tied to
  // a specific plan day) — fall back to the exact date so those still show as done on their card.
  const weekLoggedDates = new Set(weekLogs.map((l) => l.date));

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/workouts?week=${weekOffset - 1}`}
          aria-label="Semana anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel"
        >
          <ChevronLeft size={16} strokeWidth={2.2} />
        </Link>
        <div className="text-center">
          <div className="font-display text-[15px] font-bold capitalize">{formatWeekRangeLabel(weekKeys)}</div>
          {weekOffset !== 0 && (
            <Link href="/workouts" className="text-[11px] font-semibold text-accent">
              voltar pra semana atual
            </Link>
          )}
        </div>
        <Link
          href={`/workouts?week=${weekOffset + 1}`}
          aria-label="Próxima semana"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel"
        >
          <ChevronRight size={16} strokeWidth={2.2} />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {weekKeys.map((dateKey) => {
          const d = new Date(`${dateKey}T00:00:00`);
          const weekday = d.getDay();
          const workout = workoutByWeekday.get(weekday);
          const isToday = dateKey === todayKey;
          const dayLabel = `${formatWeekdayShort(d)} · ${d.getDate()}`;

          if (!workout) {
            return (
              <div
                key={dateKey}
                className="flex items-center gap-3 rounded-[18px] border border-dashed border-line px-4.5 py-3.5"
                style={{ opacity: 0.7 }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-track">
                  <Moon size={15} strokeWidth={2} color="var(--dim)" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-dim">{dayLabel}</div>
                  <div className="text-[13px] font-semibold text-dim">Dia de descanso</div>
                </div>
              </div>
            );
          }

          const group = dominantMuscleGroup(workout.exercises.map((e) => e.muscleGroup));
          const Icon = group ? MUSCLE_GROUP_ICONS[group] : Dumbbell;
          const done = weekPlanDayIds.has(workout.id) || weekLoggedDates.has(dateKey);

          return (
            <Link
              key={dateKey}
              href={`/workouts/${workout.id}`}
              className="relative flex flex-col gap-3 rounded-[18px] border p-4.5"
              style={{
                borderColor: done ? "var(--accent)" : isToday ? "var(--accent)" : "var(--line)",
                background: done ? "color-mix(in srgb, var(--accent) 9%, var(--panel))" : "var(--panel)",
              }}
            >
              {done && (
                <span
                  className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                  style={{ background: "var(--accent)", color: "#0B0B0C" }}
                >
                  <Check size={11} strokeWidth={3} />
                  Feito
                </span>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-dim">
                    {dayLabel}
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: "color-mix(in srgb, " + workout.color + " 18%, var(--panel))", color: workout.color }}
                    >
                      {workout.splitLabel}
                    </span>
                  </div>
                  <div
                    className="font-display mt-1 text-[17px] font-bold"
                    style={{ textDecoration: done ? "line-through" : "none", color: done ? "var(--dim)" : "var(--chalk)" }}
                  >
                    {workout.name}
                  </div>
                </div>
                {!done && (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: workout.color }}
                  >
                    <Icon size={18} color="#0B0B0C" strokeWidth={2.3} />
                  </div>
                )}
              </div>
              <div className="flex gap-4 text-xs text-dim" style={{ opacity: done ? 0.75 : 1 }}>
                <span>{workout.duration}</span>
                <span>{workout.exercises.length} exercícios</span>
                <span>{workout.level}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

async function CardioTab({ userId }: { userId: string }) {
  const sessions = await prisma.workoutLog.findMany({
    where: { userId, type: "CARDIO" },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  return (
    <>
      <div className="mb-5">
        <CardioLogSheet />
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[18px] border border-dashed border-line px-4.5 py-8 text-center">
          <Footprints size={22} strokeWidth={1.8} color="var(--dim)" />
          <p className="text-[13px] text-dim">Nenhuma corrida ou caminhada registrada ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sessions.map((s) => {
            const d = new Date(`${s.date}T00:00:00`);
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-[18px] border border-line bg-panel px-4.5 py-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(198,255,61,0.14)" }}>
                  <Footprints size={16} strokeWidth={2.2} color="var(--accent)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-dim">
                    {formatDateLabel(d)}
                  </div>
                  <div className="font-display mt-0.5 text-[15px] font-bold">
                    {CARDIO_ACTIVITY_LABELS[s.cardioActivity ?? "RUN"]}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                  <span className="text-[13px] font-bold text-chalk">
                    {s.distanceKm ? `${s.distanceKm.toFixed(1)} km` : "—"}
                  </span>
                  <span className="text-[11px] text-dim">
                    {formatPace(s.paceMinPerKm)} · {s.durationMinutes ? `${Math.round(s.durationMinutes)} min` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
