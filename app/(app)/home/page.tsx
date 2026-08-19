"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Ring } from "@/components/Ring";
import { MacroRows } from "@/components/MacroRows";
import { MealList } from "@/components/MealList";
import { MealFormSheet } from "@/components/MealFormSheet";
import { WeeklySummaryCard } from "@/components/WeeklySummaryCard";
import { DaySummaryModal } from "@/components/DaySummaryModal";
import { WeightLogSheet } from "@/components/WeightLogSheet";
import { WorkoutStreakCard } from "@/components/WorkoutStreakCard";
import { ChatPanel } from "@/components/ChatPanel";
import { SplashScreen } from "@/components/SplashScreen";
import { toDateKey, formatDateLabel, lastDateKeys } from "@/lib/date";
import { EMPTY_TOTALS, type MealTotals } from "@/lib/targets";
import { computeWeeklySummary } from "@/lib/weekly-summary";
import type { Goal } from "@/lib/calculations";
import type { Meal, MealInput } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weekMeals, setWeekMeals] = useState<Meal[]>([]);
  const [weightEntries, setWeightEntries] = useState<{ date: string; weightKg: number }[]>([]);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [currentWeightKg, setCurrentWeightKg] = useState<number | null>(null);
  const [targets, setTargets] = useState<MealTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [workoutLoggedToday, setWorkoutLoggedToday] = useState(false);
  const [workoutToday, setWorkoutToday] = useState<{ durationMinutes: number | null; caloriesBurned: number | null } | null>(null);

  const today = new Date();
  const dateKey = toDateKey(today);
  const weekStart = lastDateKeys(7, today)[0];
  const weightHistoryStart = lastDateKeys(21, today)[0];

  async function loadAll() {
    setLoadError(false);
    try {
      const profileRes = await fetch("/api/profile");
      if (profileRes.status === 404) {
        router.replace("/setup");
        return;
      }
      if (!profileRes.ok) throw new Error("profile request failed");
      const profileJson = await profileRes.json();

      const [weekRes, weightRes, workoutLogRes] = await Promise.all([
        fetch(`/api/meals?from=${weekStart}&to=${dateKey}`),
        fetch(`/api/weight?from=${weightHistoryStart}`),
        fetch("/api/workout-log"),
      ]);
      if (!weekRes.ok) throw new Error("meals request failed");
      const weekJson = await weekRes.json();
      const weightJson = weightRes.ok ? await weightRes.json() : { entries: [] };
      const workoutLogJson = workoutLogRes.ok ? await workoutLogRes.json() : { streak: 0, loggedToday: false };

      setTargets(profileJson.targets);
      setProfileName(profileJson.profile.name ?? null);
      setGoal(profileJson.profile.goal ?? null);
      setCurrentWeightKg(profileJson.profile.weightKg ?? null);
      setWeekMeals(weekJson.meals ?? []);
      setMeals((weekJson.meals ?? []).filter((m: Meal) => m.date === dateKey));
      setWeightEntries((weightJson.entries ?? []).map((e: { date: string; weightKg: number }) => ({ date: e.date, weightKg: e.weightKg })));
      setWorkoutStreak(workoutLogJson.streak ?? 0);
      setWorkoutLoggedToday(!!workoutLogJson.loggedToday);
      setWorkoutToday(
        workoutLogJson.today
          ? { durationMinutes: workoutLogJson.today.durationMinutes ?? null, caloriesBurned: workoutLogJson.today.caloriesBurned ?? null }
          : null,
      );
      setLoading(false);
    } catch {
      setLoadError(true);
      setLoading(false);
    }
  }

  useEffect(() => {
    function trigger() {
      loadAll();
    }
    trigger();

    window.addEventListener("nutritracker:meal-saved", trigger);
    return () => window.removeEventListener("nutritracker:meal-saved", trigger);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      sodium: acc.sodium + m.sodium,
      sugar: acc.sugar + m.sugar,
    }),
    EMPTY_TOTALS,
  );

  async function handleSave(input: MealInput) {
    if (editingMeal) {
      await fetch("/api/meals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingMeal.id, ...input }),
      });
    } else {
      await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey, ...input }),
      });
    }
    setFormOpen(false);
    setEditingMeal(null);
    await loadAll();
  }

  function openEdit(meal: Meal) {
    setEditingMeal(meal);
    setFormOpen(true);
  }

  function openCreate() {
    setEditingMeal(null);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    await loadAll();
  }

  async function handleLogWeight(weightKg: number) {
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey, weightKg }),
    });
    setWeightSheetOpen(false);
    await loadAll();
  }

  const kcalRemaining = targets ? Math.max(0, targets.calories - totals.calories) : 0;

  const firstName = profileName?.trim().split(/\s+/)[0] ?? null;

  const dailyCalories = Object.entries(
    weekMeals.reduce<Record<string, number>>((acc, m) => {
      acc[m.date] = (acc[m.date] ?? 0) + m.calories;
      return acc;
    }, {}),
  ).map(([date, calories]) => ({ date, calories }));

  const summary =
    targets && goal
      ? computeWeeklySummary({
          dailyCalories,
          targetCalories: targets.calories,
          weightEntries,
          fallbackWeightKg: currentWeightKg ?? 0,
          goal,
          today,
        })
      : null;

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[13px] text-dim">{formatDateLabel(today)}</div>
          <div className="font-display text-[22px] font-bold">Olá{firstName ? `, ${firstName}` : ""} 👋</div>
        </div>
        <button
          onClick={() => setChatOpen(true)}
          aria-label="Perguntar ao assistente"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-lg"
        >
          <MessageCircle size={18} strokeWidth={2} color="var(--accent)" />
        </button>
      </div>

      {loadError ? (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-dim">Não consegui carregar seus dados. Verifique sua conexão e tente de novo.</p>
          <button onClick={loadAll} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-[#0B0B0C]">
            Tentar de novo
          </button>
        </div>
      ) : loading || !targets ? (
        <div className="h-[60vh]">
          <SplashScreen mode="loading" />
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-5 rounded-3xl border border-line bg-panel p-6">
            <Ring value={totals.calories} target={targets.calories} color="var(--accent)" />
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-[28px] font-bold leading-none">{Math.round(totals.calories)}</span>
                <span className="text-[13px] font-semibold text-dim">kcal</span>
              </div>
              <div className="mt-1 text-[13px] text-dim">de {targets.calories} kcal</div>
              <div className="mt-2.5 text-[13px] font-semibold text-accent">{Math.round(kcalRemaining)} kcal restantes</div>
            </div>
          </div>

          <WorkoutStreakCard streak={workoutStreak} loggedToday={workoutLoggedToday} today={workoutToday} />

          <div className="mb-6">
            <MacroRows totals={totals} targets={targets} />
          </div>

          {summary && (
            <div className="mb-6">
              <WeeklySummaryCard summary={summary} onLogWeight={() => setWeightSheetOpen(true)} onSelectDay={setSelectedDay} />
            </div>
          )}

          <MealList meals={meals} onDelete={handleDelete} onEdit={openEdit} />

          <button
            onClick={openCreate}
            className="mt-4 w-full rounded-xl border border-line bg-panel py-3 text-sm font-semibold text-dim"
          >
            + Adicionar refeição manualmente
          </button>
        </>
      )}

      <MealFormSheet
        open={formOpen}
        initial={editingMeal}
        onClose={() => {
          setFormOpen(false);
          setEditingMeal(null);
        }}
        onSave={handleSave}
      />
      <WeightLogSheet
        open={weightSheetOpen}
        currentWeightKg={currentWeightKg}
        onClose={() => setWeightSheetOpen(false)}
        onSave={handleLogWeight}
      />
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} dayTotals={totals} />
      {selectedDay && targets && (
        <DaySummaryModal
          date={selectedDay}
          meals={weekMeals.filter((m) => m.date === selectedDay)}
          targets={targets}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
