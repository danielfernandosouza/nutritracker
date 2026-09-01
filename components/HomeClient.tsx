"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Plus } from "lucide-react";
import { MacroRows } from "@/components/MacroRows";
import { MealList } from "@/components/MealList";
import { MealFormSheet } from "@/components/MealFormSheet";
import { WeeklySummaryCard } from "@/components/WeeklySummaryCard";
import { DaySummaryModal } from "@/components/DaySummaryModal";
import { WeightLogSheet } from "@/components/WeightLogSheet";
import { HomeCarousel } from "@/components/HomeCarousel";
import { WaterCard } from "@/components/WaterCard";
import { SleepCard } from "@/components/SleepCard";
import { SleepLogSheet } from "@/components/SleepLogSheet";
import { MetricInfoSheet } from "@/components/MetricInfoSheet";
import { ChatPanel } from "@/components/ChatPanel";
import { SplashScreen } from "@/components/SplashScreen";
import { toDateKey, formatDateLabel, lastDateKeys } from "@/lib/date";
import { EMPTY_TOTALS, type MealTotals } from "@/lib/targets";
import { computeWeeklySummary } from "@/lib/weekly-summary";
import { estimateBaselineBurnKcal } from "@/lib/calorie-burn";
import { computeSleepFeedback, type SleepFeedback } from "@/lib/wellness";
import type { MetricKey } from "@/lib/metric-info";
import type { Goal } from "@/lib/calculations";
import type { Meal, MealInput } from "@/lib/types";

export type HomeInitialData = {
  meals: Meal[];
  weekMeals: Meal[];
  weightEntries: { date: string; weightKg: number }[];
  profileName: string | null;
  goal: Goal | null;
  currentWeightKg: number | null;
  targets: MealTotals;
  tdee: number | null;
  workoutStreak: number;
  workoutLoggedToday: boolean;
  workoutToday: { durationMinutes: number | null; caloriesBurned: number | null } | null;
  waterTotalMl: number;
  waterTargetMl: number;
  sleepFeedback: SleepFeedback | null;
  sleepEntry: { bedTime: string; wakeTime: string } | null;
};

export function HomeClient({ initial }: { initial: HomeInitialData }) {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>(initial.meals);
  const [weekMeals, setWeekMeals] = useState<Meal[]>(initial.weekMeals);
  const [weightEntries, setWeightEntries] = useState<{ date: string; weightKg: number }[]>(initial.weightEntries);
  const [profileName, setProfileName] = useState<string | null>(initial.profileName);
  const [goal, setGoal] = useState<Goal | null>(initial.goal);
  const [currentWeightKg, setCurrentWeightKg] = useState<number | null>(initial.currentWeightKg);
  const [targets, setTargets] = useState<MealTotals | null>(initial.targets);
  const [tdee, setTdee] = useState<number | null>(initial.tdee);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [savingMeal, setSavingMeal] = useState(false);
  const [mealSaveError, setMealSaveError] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [workoutStreak, setWorkoutStreak] = useState(initial.workoutStreak);
  const [workoutLoggedToday, setWorkoutLoggedToday] = useState(initial.workoutLoggedToday);
  const [workoutToday, setWorkoutToday] = useState<{ durationMinutes: number | null; caloriesBurned: number | null } | null>(
    initial.workoutToday,
  );
  const [waterTotalMl, setWaterTotalMl] = useState(initial.waterTotalMl);
  const [waterTargetMl, setWaterTargetMl] = useState(initial.waterTargetMl);
  const [sleepFeedback, setSleepFeedback] = useState<SleepFeedback | null>(initial.sleepFeedback);
  const [sleepEntry, setSleepEntry] = useState<{ bedTime: string; wakeTime: string } | null>(initial.sleepEntry);
  const [sleepSheetOpen, setSleepSheetOpen] = useState(false);
  const [openMetric, setOpenMetric] = useState<MetricKey | null>(null);

  const today = new Date();
  const dateKey = toDateKey(today);
  const weekStart = lastDateKeys(7, today)[0];
  const weightHistoryStart = lastDateKeys(21, today)[0];

  async function loadAll() {
    setLoadError(false);
    try {
      const profileRes = await fetch("/api/profile");
      if (!profileRes.ok) throw new Error("profile request failed");
      const profileJson = await profileRes.json();

      const [weekRes, weightRes, workoutLogRes, waterRes, sleepRes] = await Promise.all([
        fetch(`/api/meals?from=${weekStart}&to=${dateKey}`),
        fetch(`/api/weight?from=${weightHistoryStart}`),
        fetch("/api/workout-log"),
        fetch(`/api/water?date=${dateKey}`),
        fetch(`/api/sleep?date=${dateKey}`),
      ]);
      if (!weekRes.ok) throw new Error("meals request failed");
      const weekJson = await weekRes.json();
      const weightJson = weightRes.ok ? await weightRes.json() : { entries: [] };
      const workoutLogJson = workoutLogRes.ok ? await workoutLogRes.json() : { streak: 0, loggedToday: false };
      const waterJson = waterRes.ok ? await waterRes.json() : { totalMl: 0 };
      const sleepJson = sleepRes.ok ? await sleepRes.json() : { entry: null };

      setWaterTotalMl(waterJson.totalMl ?? 0);
      setWaterTargetMl(profileJson.wellness?.waterTargetMl ?? 2000);
      if (sleepJson.entry) {
        const { bedTime, wakeTime } = sleepJson.entry;
        setSleepEntry({ bedTime, wakeTime });
        setSleepFeedback(
          computeSleepFeedback(bedTime, wakeTime, {
            minHours: profileJson.wellness?.sleepTargetMinHours ?? 7,
            maxHours: profileJson.wellness?.sleepTargetMaxHours ?? 9,
          }),
        );
      } else {
        setSleepEntry(null);
        setSleepFeedback(null);
      }

      setTargets(profileJson.targets);
      setTdee(typeof profileJson.targets?.tdee === "number" ? profileJson.targets.tdee : null);
      setProfileName(profileJson.profile.name ?? null);
      setGoal(profileJson.profile.goal ?? null);
      const weightEntriesJson: { date: string; weightKg: number }[] = weightJson.entries ?? [];
      const latestLoggedWeightKg =
        weightEntriesJson.length > 0 ? weightEntriesJson[weightEntriesJson.length - 1].weightKg : null;
      setCurrentWeightKg(latestLoggedWeightKg ?? profileJson.profile.weightKg ?? null);
      setWeekMeals(weekJson.meals ?? []);
      setMeals((weekJson.meals ?? []).filter((m: Meal) => m.date === dateKey));
      setWeightEntries((weightJson.entries ?? []).map((e: { date: string; weightKg: number }) => ({ date: e.date, weightKg: e.weightKg })));
      setWorkoutStreak(workoutLogJson.streak ?? 0);
      setWorkoutLoggedToday(!!workoutLogJson.loggedToday);
      const strengthToday = workoutLogJson.today;
      const cardioToday = workoutLogJson.todayCardio;
      setWorkoutToday(
        strengthToday || cardioToday
          ? {
              durationMinutes: (strengthToday?.durationMinutes ?? 0) + (cardioToday?.durationMinutes ?? 0) || null,
              caloriesBurned: (strengthToday?.caloriesBurned ?? 0) + (cardioToday?.caloriesBurned ?? 0) || null,
            }
          : null,
      );
      setLoading(false);
    } catch {
      setLoadError(true);
      setLoading(false);
    }
  }

  /**
   * Depois de gravar qualquer coisa: recarrega o estado local (para a tela responder na hora) e
   * invalida o cache do roteador. Sem o refresh, com o cache de 30s ligado (next.config.ts), voltar
   * para esta tela — ou ir para Histórico/Treinos — mostraria o dado de antes da alteração.
   */
  async function reloadAfterMutation() {
    await loadAll();
    router.refresh();
  }

  useEffect(() => {
    // Dados iniciais já vêm prontos do servidor (ver app/(app)/home/page.tsx) — só precisa
    // recarregar quando algo muda (evento disparado pelo CameraFlow após escanear refeição).
    window.addEventListener("nutritracker:meal-saved", loadAll);
    return () => window.removeEventListener("nutritracker:meal-saved", loadAll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // A sheet só fecha depois que a gravação confirma. Antes, qualquer falha (foto grande demais,
    // sem conexão, sessão expirada) fechava o formulário como se tivesse salvo — e a refeição
    // simplesmente sumia, sem o usuário entender por quê.
    setSavingMeal(true);
    setMealSaveError(null);
    try {
      const res = editingMeal
        ? await fetch("/api/meals", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingMeal.id, ...input }),
          })
        : await fetch("/api/meals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: dateKey, ...input }),
          });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setMealSaveError(json?.error ?? "Não consegui salvar. Tente de novo.");
        return;
      }

      setFormOpen(false);
      setEditingMeal(null);
      await reloadAfterMutation();
    } catch {
      setMealSaveError("Não consegui conectar. Verifique sua internet e tente de novo.");
    } finally {
      setSavingMeal(false);
    }
  }

  function openEdit(meal: Meal) {
    setEditingMeal(meal);
    setMealSaveError(null);
    setFormOpen(true);
  }

  function openCreate() {
    setEditingMeal(null);
    setMealSaveError(null);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    await reloadAfterMutation();
  }

  async function handleLogWeight(weightKg: number) {
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey, weightKg }),
    });
    setWeightSheetOpen(false);
    await reloadAfterMutation();
  }

  async function handleAddWater(amountMl: number) {
    setWaterTotalMl((t) => t + amountMl);
    const res = await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey, amountMl }),
    }).catch(() => null);

    // Desfaz o incremento otimista se a gravação não foi aceita — senão a tela mostraria uma água
    // que o servidor não registrou, e ela "sumiria" sozinha na próxima vez que a Home carregasse.
    if (!res?.ok) {
      setWaterTotalMl((t) => Math.max(0, t - amountMl));
      return;
    }
    router.refresh();
  }

  async function handleSaveSleep(bedTime: string, wakeTime: string) {
    await fetch("/api/sleep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey, bedTime, wakeTime }),
    });
    setSleepSheetOpen(false);
    await reloadAfterMutation();
  }

  const baselineBurnKcal = tdee ? estimateBaselineBurnKcal(tdee, today) : 0;
  const workoutBurnKcal = workoutToday?.caloriesBurned ?? 0;
  const burnedTodayKcal = Math.round(baselineBurnKcal + workoutBurnKcal);
  const netConsumed = Math.max(0, totals.calories - burnedTodayKcal);
  const kcalRemaining = targets ? Math.max(0, targets.calories - netConsumed) : 0;

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(true)}
            aria-label="Perguntar ao assistente"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-lg"
          >
            <MessageCircle size={18} strokeWidth={2} color="var(--accent)" />
          </button>
          <button
            onClick={openCreate}
            aria-label="Adicionar refeição"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent shadow-[0_0_14px_rgba(198,255,61,0.35)]"
          >
            <Plus size={20} strokeWidth={2.4} color="#0B0B0C" />
          </button>
        </div>
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
          <HomeCarousel
            totalsCalories={totals.calories}
            targetCalories={targets.calories}
            kcalRemaining={kcalRemaining}
            burnedTodayKcal={burnedTodayKcal}
            workoutBurnKcal={workoutBurnKcal}
            onOpenCaloriesInfo={() => setOpenMetric("calories")}
            workoutStreak={workoutStreak}
            workoutLoggedToday={workoutLoggedToday}
            workoutToday={workoutToday}
            goal={goal ?? "maintain"}
          />

          <WaterCard totalMl={waterTotalMl} targetMl={waterTargetMl} onAdd={handleAddWater} onOpenInfo={() => setOpenMetric("water")} />
          <SleepCard feedback={sleepFeedback} onOpenInfo={() => setOpenMetric("sleep")} />

          <div className="mb-6">
            <MacroRows totals={totals} targets={targets} onSelect={setOpenMetric} />
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
        error={mealSaveError}
        saving={savingMeal}
        onClose={() => {
          setFormOpen(false);
          setEditingMeal(null);
          setMealSaveError(null);
        }}
        onSave={handleSave}
      />
      <WeightLogSheet
        open={weightSheetOpen}
        currentWeightKg={currentWeightKg}
        onClose={() => setWeightSheetOpen(false)}
        onSave={handleLogWeight}
      />
      <SleepLogSheet
        open={sleepSheetOpen}
        initialBedTime={sleepEntry?.bedTime ?? null}
        initialWakeTime={sleepEntry?.wakeTime ?? null}
        onClose={() => setSleepSheetOpen(false)}
        onSave={handleSaveSleep}
      />
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} dayTotals={totals} />
      {targets && (
        <MetricInfoSheet
          metric={openMetric}
          onClose={() => setOpenMetric(null)}
          today={
            openMetric && openMetric !== "sleep" && openMetric !== "water"
              ? { value: totals[openMetric], target: targets[openMetric] }
              : openMetric === "water"
                ? { value: waterTotalMl, target: waterTargetMl }
                : undefined
          }
          sleepFeedback={openMetric === "sleep" ? sleepFeedback : undefined}
          footerAction={
            openMetric === "water" ? (
              <div className="flex gap-2.5">
                <button
                  onClick={() => handleAddWater(250)}
                  className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-[#0B0B0C]"
                >
                  +250ml
                </button>
                <button
                  onClick={() => handleAddWater(500)}
                  className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-[#0B0B0C]"
                >
                  +500ml
                </button>
              </div>
            ) : openMetric === "sleep" ? (
              <button
                onClick={() => {
                  setOpenMetric(null);
                  setSleepSheetOpen(true);
                }}
                className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-[#0B0B0C]"
              >
                Registrar sono
              </button>
            ) : undefined
          }
        />
      )}
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
