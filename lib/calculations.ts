export type Sex = "M" | "F";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose_fat" | "recomposition" | "maintain" | "gain_muscle";

export type ProfileInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
};

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; description: string }> = {
  sedentary: { label: "Sedentário", description: "Pouco ou nenhum exercício, trabalho sentado" },
  light: { label: "Leve", description: "Exercício leve 1-3x/semana" },
  moderate: { label: "Moderado", description: "Exercício moderado 3-5x/semana" },
  active: { label: "Alto", description: "Exercício intenso 4-5x/semana, ou esporte extra" },
  very_active: { label: "Muito alto", description: "Exercício intenso diário ou trabalho físico" },
};

export const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose_fat: -0.18,
  recomposition: -0.12,
  maintain: 0,
  gain_muscle: 0.12,
};

export const GOAL_LABELS: Record<Goal, { label: string; description: string }> = {
  lose_fat: { label: "Perder gordura", description: "Déficit calórico focado em emagrecimento" },
  recomposition: { label: "Recomposição corporal", description: "Perder gordura e ganhar músculo ao mesmo tempo" },
  maintain: { label: "Manter peso", description: "Manutenção, sem déficit ou superávit" },
  gain_muscle: { label: "Ganhar massa", description: "Superávit calórico focado em hipertrofia" },
};

export function computeBMR(profile: Pick<ProfileInput, "sex" | "age" | "heightCm" | "weightKg">): number {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return profile.sex === "M" ? base + 5 : base - 161;
}

export function computeTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export type ComputedTargets = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  sodium: number;
  sugar: number;
  bmr: number;
  tdee: number;
};

export function computeTargets(profile: ProfileInput): ComputedTargets {
  const bmr = computeBMR(profile);
  const tdee = computeTDEE(bmr, profile.activityLevel);
  const calories = tdee * (1 + GOAL_ADJUSTMENTS[profile.goal]);

  const protein = 2.2 * profile.weightKg;
  const fat = (calories * 0.25) / 9;
  const carbs = Math.max(0, (calories - protein * 4 - fat * 9) / 4);

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
    sodium: 2300,
    sugar: 50,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
}

export type BMIResult = {
  value: number;
  category: string;
};

export function computeBMI(weightKg: number, heightCm: number): BMIResult {
  const heightM = heightCm / 100;
  const value = weightKg / (heightM * heightM);

  let category: string;
  if (value < 18.5) category = "Abaixo do peso";
  else if (value < 25) category = "Peso normal";
  else if (value < 30) category = "Sobrepeso";
  else category = "Obesidade";

  return { value: Math.round(value * 10) / 10, category };
}
