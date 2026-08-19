import { EXERCISE_LIBRARY, type ExerciseDef, type MuscleGroup, type Equipment } from "@/lib/exercises";
import type { Workout, Exercise } from "@/lib/workouts";

export type SplitStyle = "full_body" | "upper_lower" | "push_pull_legs" | "bro_split";
export type EquipmentPreference = "machines" | "free_weights" | "mixed";

export type WorkoutPreferences = {
  daysPerWeek: number;
  splitStyle: SplitStyle;
  equipmentPreference: EquipmentPreference;
  favoriteMuscleGroups: MuscleGroup[];
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

function rotate<T>(arr: T[], by: number): T[] {
  if (arr.length === 0) return arr;
  const n = ((by % arr.length) + arr.length) % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
}

function pickExercisesForGroup(group: MuscleGroup, prefs: WorkoutPreferences, occurrence: number): Exercise[] {
  const count = prefs.favoriteMuscleGroups.includes(group) ? 2 : 1;
  const candidates = EXERCISE_LIBRARY.filter((e) => e.muscleGroup === group);
  const filtered = filterByEquipment(candidates, prefs.equipmentPreference);
  const pool = filtered.length > 0 ? filtered : candidates;
  const rotated = rotate(pool, occurrence * count);
  return rotated
    .slice(0, count)
    .map(({ name, sets, reps, rest, demoName }) => ({ name, sets, reps, rest, demoName, muscleGroup: group }));
}

export function generateWorkoutPlan(prefs: WorkoutPreferences): Workout[] {
  const templates = DAY_TEMPLATES[prefs.splitStyle];
  const labelCounts: Record<string, number> = {};
  const workouts: Workout[] = [];

  for (let i = 0; i < prefs.daysPerWeek; i++) {
    const template = templates[i % templates.length];
    const occurrence = Math.floor(i / templates.length);
    labelCounts[template.label] = (labelCounts[template.label] ?? 0) + 1;
    const occurrenceForLabel = labelCounts[template.label];
    const suffix = occurrenceForLabel > 1 ? ` ${String.fromCharCode(64 + occurrenceForLabel)}` : "";

    const exercises = template.groups.flatMap((group) => pickExercisesForGroup(group, prefs, occurrence));

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
