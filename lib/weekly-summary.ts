import { lastDateKeys, formatWeekdayShort } from "@/lib/date";
import type { Goal } from "@/lib/calculations";

export type DailyCalorieBar = {
  date: string;
  label: string;
  calories: number;
  target: number;
  hasData: boolean;
  isToday: boolean;
};

export type WeightVerdict = "good" | "neutral" | "watch" | "no_data";

export type WeeklySummaryResult = {
  bars: DailyCalorieBar[];
  daysLogged: number;
  daysOnTarget: number;
  avgCalories: number | null;
  latestWeightKg: number | null;
  weightDeltaKg: number | null;
  weightVerdict: WeightVerdict;
  verdictText: string;
};

export type WeeklySummaryInput = {
  dailyCalories: { date: string; calories: number }[];
  targetCalories: number;
  weightEntries: { date: string; weightKg: number }[];
  fallbackWeightKg: number;
  goal: Goal;
  today?: Date;
};

const ON_TARGET_TOLERANCE = 0.15; // ±15% of target counts as "on target"

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
}

export function computeWeeklySummary(input: WeeklySummaryInput): WeeklySummaryResult {
  const today = input.today ?? new Date();
  const dateKeys = lastDateKeys(7, today);
  const caloriesByDate = new Map(input.dailyCalories.map((d) => [d.date, d.calories]));

  const bars: DailyCalorieBar[] = dateKeys.map((date, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const calories = caloriesByDate.get(date) ?? 0;
    return {
      date,
      label: formatWeekdayShort(d),
      calories,
      target: input.targetCalories,
      hasData: caloriesByDate.has(date),
      isToday: i === 6,
    };
  });

  const loggedBars = bars.filter((b) => b.hasData);
  const daysLogged = loggedBars.length;
  const daysOnTarget = loggedBars.filter(
    (b) => Math.abs(b.calories - b.target) <= b.target * ON_TARGET_TOLERANCE,
  ).length;
  const avgCalories = daysLogged > 0 ? Math.round(loggedBars.reduce((s, b) => s + b.calories, 0) / daysLogged) : null;

  // Weight: sort entries by date desc, latest = most recent entry (or fallback to profile weight).
  const sorted = [...input.weightEntries].sort((a, b) => (a.date < b.date ? 1 : -1));
  const latest = sorted[0] ?? null;
  const latestWeightKg = latest ? latest.weightKg : input.fallbackWeightKg;

  // Baseline: most recent entry at least 6 days older than the latest one.
  const baseline = latest
    ? sorted.find((e) => e !== latest && daysBetween(latest.date, e.date) >= 6) ?? null
    : null;

  const weightDeltaKg = baseline ? Math.round((latest!.weightKg - baseline.weightKg) * 10) / 10 : null;

  let weightVerdict: WeightVerdict = "no_data";
  if (weightDeltaKg !== null) {
    const wantsDown = input.goal === "lose_fat" || input.goal === "recomposition";
    const wantsUp = input.goal === "gain_muscle";
    if (wantsDown) {
      weightVerdict = weightDeltaKg <= -0.1 ? "good" : weightDeltaKg > 0.3 ? "watch" : "neutral";
    } else if (wantsUp) {
      weightVerdict = weightDeltaKg >= 0.1 ? "good" : weightDeltaKg < -0.3 ? "watch" : "neutral";
    } else {
      weightVerdict = Math.abs(weightDeltaKg) <= 0.5 ? "good" : Math.abs(weightDeltaKg) > 1 ? "watch" : "neutral";
    }
  }

  const verdictText = buildVerdictText({
    daysLogged,
    daysOnTarget,
    weightDeltaKg,
    weightVerdict,
    goal: input.goal,
  });

  return { bars, daysLogged, daysOnTarget, avgCalories, latestWeightKg, weightDeltaKg, weightVerdict, verdictText };
}

function buildVerdictText(args: {
  daysLogged: number;
  daysOnTarget: number;
  weightDeltaKg: number | null;
  weightVerdict: WeightVerdict;
  goal: Goal;
}): string {
  const { daysLogged, daysOnTarget, weightDeltaKg, weightVerdict } = args;

  if (daysLogged === 0) {
    return "Ainda não há refeições registradas essa semana. Comece escaneando ou adicionando uma refeição pra acompanhar seu progresso.";
  }

  const foodPart =
    daysOnTarget === daysLogged
      ? `Você ficou dentro da meta de calorias em todos os ${daysLogged} dias registrados`
      : daysOnTarget === 0
        ? `Você fugiu bastante da meta de calorias nos ${daysLogged} dias registrados`
        : `Você ficou dentro da meta de calorias em ${daysOnTarget} de ${daysLogged} dias registrados`;

  if (weightDeltaKg === null) {
    return `${foodPart}. Registre seu peso ao longo da semana pra também acompanhar a tendência de peso.`;
  }

  const direction = weightDeltaKg > 0 ? "subiu" : weightDeltaKg < 0 ? "desceu" : "ficou estável";
  const weightPart = `seu peso ${direction}${weightDeltaKg !== 0 ? ` ${Math.abs(weightDeltaKg)}kg` : ""} nos últimos dias`;

  if (weightVerdict === "good") return `${foodPart}, e ${weightPart} — alinhado com seu objetivo. Continue assim!`;
  if (weightVerdict === "watch") return `${foodPart}, mas ${weightPart}, na direção contrária ao seu objetivo. Vale revisar a semana.`;
  return `${foodPart}, e ${weightPart}.`;
}
