import { EXERCISE_LIBRARY, type ExerciseDef, type MuscleGroup, type Equipment } from "@/lib/exercises";
import type { Goal } from "@/lib/calculations";
import type { Workout, Exercise } from "@/lib/workouts";

export type SplitStyle = "full_body" | "upper_lower" | "push_pull_legs" | "bro_split";
export type EquipmentPreference = "machines" | "free_weights" | "mixed";

export type WorkoutPreferences = {
  daysPerWeek: number;
  splitStyle: SplitStyle;
  equipmentPreference: EquipmentPreference;
  favoriteMuscleGroups: MuscleGroup[];
  /** Objetivo do usuário — ajusta faixa de repetições e descanso prescritos. */
  goal: Goal;
  /** Idade — acima de 55 anos, prioriza variações de menor impacto pros exercícios mais pesados. */
  age: number;
  /**
   * Identificador estável (ex: userId) usado só pra distribuir a rotação de exercícios.
   * Sem isso, duas contas com as mesmas preferências (dias/divisão/equipamento) recebem
   * exatamente os mesmos exercícios — o que é o comportamento que estamos corrigindo aqui.
   */
  seed: string;
};

export const SPLIT_STYLE_LABELS: Record<SplitStyle, { label: string; description: string }> = {
  full_body: { label: "Full Body", description: "Corpo inteiro em cada sessão — ideal pra 2-3 dias/semana" },
  upper_lower: { label: "Superior / Inferior", description: "Alterna parte de cima e de baixo do corpo — ideal pra 4 dias/semana" },
  push_pull_legs: { label: "Push / Pull / Legs", description: "Empurrar, puxar e perna — ideal pra 3 ou 6 dias/semana" },
  bro_split: { label: "Divisão por grupo (ABC)", description: "Um grupo muscular por dia — ideal pra 5 dias/semana" },
};

export const EQUIPMENT_PREFERENCE_LABELS: Record<EquipmentPreference, { label: string; description: string }> = {
  machines: { label: "Máquinas", description: "Prefiro máquinas e cabos" },
  free_weights: { label: "Pesos livres", description: "Prefiro barra e halteres" },
  mixed: { label: "Sem preferência", description: "Tanto faz, pode misturar" },
};

type DayTemplate = { label: string; color: string; groups: MuscleGroup[] };

const DAY_TEMPLATES: Record<SplitStyle, DayTemplate[]> = {
  full_body: [
    { label: "Full Body", color: "var(--accent)", groups: ["chest", "back", "shoulders", "quads", "hamstrings", "abs"] },
  ],
  upper_lower: [
    { label: "Superior", color: "var(--protein)", groups: ["chest", "back", "shoulders", "biceps", "triceps"] },
    { label: "Inferior", color: "var(--carb)", groups: ["quads", "hamstrings", "glutes", "calves", "abs"] },
  ],
  push_pull_legs: [
    { label: "Empurrar", color: "var(--protein)", groups: ["chest", "shoulders", "triceps"] },
    { label: "Puxar", color: "var(--fat)", groups: ["back", "biceps"] },
    { label: "Perna", color: "var(--sugar)", groups: ["quads", "hamstrings", "glutes", "calves"] },
  ],
  bro_split: [
    { label: "Peito", color: "var(--protein)", groups: ["chest"] },
    { label: "Costas", color: "var(--fat)", groups: ["back"] },
    { label: "Ombro", color: "var(--sodium)", groups: ["shoulders"] },
    { label: "Perna", color: "var(--sugar)", groups: ["quads", "hamstrings", "glutes", "calves"] },
    { label: "Braço", color: "var(--carb)", groups: ["biceps", "triceps"] },
  ],
};

function filterByEquipment(list: ExerciseDef[], pref: EquipmentPreference): ExerciseDef[] {
  const allow: Record<EquipmentPreference, Equipment[]> = {
    machines: ["machine", "cable", "bodyweight"],
    free_weights: ["free_weight", "bodyweight"],
    mixed: ["machine", "cable", "bodyweight", "free_weight"],
  };
  return list.filter((e) => allow[pref].includes(e.equipment));
}

/** Levantamentos pesados/de maior impacto — evitados como primeira escolha depois dos 55 anos. */
const HIGH_LOAD_IDS = new Set([
  "barbell-squat",
  "barbell-bench",
  "barbell-row",
  "hip-thrust",
  "romanian-deadlift",
  "dumbbell-stiff-leg-deadlift",
  "barbell-curl",
  "pullup",
  "dips",
  "hanging-leg-raise",
]);

function filterByAge(list: ExerciseDef[], age: number): ExerciseDef[] {
  if (age < 55) return list;
  const gentler = list.filter((e) => !HIGH_LOAD_IDS.has(e.id));
  return gentler.length > 0 ? gentler : list;
}

function rotate<T>(arr: T[], by: number): T[] {
  if (arr.length === 0) return arr;
  const n = ((by % arr.length) + arr.length) % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

type GoalRepScheme = { repsCompound: string; restCompound: string; repsIsolation: string; restIsolation: string };

const GOAL_REP_OVERRIDES: Record<Goal, GoalRepScheme | null> = {
  lose_fat: { repsCompound: "12-15", restCompound: "45s", repsIsolation: "15-20", restIsolation: "30s" },
  recomposition: null,
  maintain: null,
  gain_muscle: { repsCompound: "6-10", restCompound: "90s", repsIsolation: "8-12", restIsolation: "60s" },
};

function prescriptionFor(def: ExerciseDef, goal: Goal): Pick<Exercise, "sets" | "reps" | "rest"> {
  const overrides = GOAL_REP_OVERRIDES[goal];
  if (!overrides) return { sets: def.sets, reps: def.reps, rest: def.rest };
  const isCompound = parseInt(def.rest, 10) >= 75;
  return isCompound
    ? { sets: def.sets, reps: overrides.repsCompound, rest: overrides.restCompound }
    : { sets: def.sets, reps: overrides.repsIsolation, rest: overrides.restIsolation };
}

/** Hard ceiling per session — even with every group favorited, a workout must stay practical (ACSM: ~4-6, up to ~8 for extra emphasis). */
const MAX_EXERCISES_PER_DAY = 8;

function pickExercisesForGroup(group: MuscleGroup, prefs: WorkoutPreferences, occurrence: number, seedNum: number, count: number): Exercise[] {
  const candidates = EXERCISE_LIBRARY.filter((e) => e.muscleGroup === group);
  const equipmentFiltered = filterByEquipment(candidates, prefs.equipmentPreference);
  const ageFiltered = filterByAge(equipmentFiltered.length > 0 ? equipmentFiltered : candidates, prefs.age);
  const pool = ageFiltered.length > 0 ? ageFiltered : candidates;
  const rotated = rotate(pool, occurrence * count + seedNum);
  return rotated.slice(0, count).map((def) => ({
    name: def.name,
    ...prescriptionFor(def, prefs.goal),
    demoName: def.demoName,
    muscleGroup: group,
  }));
}

export function generateWorkoutPlan(prefs: WorkoutPreferences): Workout[] {
  const templates = DAY_TEMPLATES[prefs.splitStyle];
  const labelCounts: Record<string, number> = {};
  const workouts: Workout[] = [];
  const seedNum = hashSeed(prefs.seed);

  for (let i = 0; i < prefs.daysPerWeek; i++) {
    const template = templates[i % templates.length];
    const occurrence = Math.floor(i / templates.length);
    labelCounts[template.label] = (labelCounts[template.label] ?? 0) + 1;
    const occurrenceForLabel = labelCounts[template.label];
    const suffix = occurrenceForLabel > 1 ? ` ${String.fromCharCode(64 + occurrenceForLabel)}` : "";

    // Baseline: one exercise per group, so every muscle group is always hit. Favorited groups
    // get a bonus second exercise, but only while there's still room under the session cap —
    // otherwise marking many groups as favorite could blow the session back up to 12+.
    let bonusBudget = MAX_EXERCISES_PER_DAY - template.groups.length;
    const exercises = template.groups.flatMap((group) => {
      const wantsBonus = prefs.favoriteMuscleGroups.includes(group) && bonusBudget > 0;
      if (wantsBonus) bonusBudget--;
      return pickExercisesForGroup(group, prefs, occurrence, seedNum, wantsBonus ? 2 : 1);
    });

    workouts.push({
      id: `dia-${i + 1}`,
      name: `${template.label}${suffix}`,
      category: `Dia ${i + 1}`,
      color: template.color,
      day: `Dia ${i + 1}`,
      duration: "45 min",
      level: "Intermediário",
      exercises,
    });
  }

  return workouts;
}
