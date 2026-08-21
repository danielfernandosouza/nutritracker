import { EXERCISE_LIBRARY, suggestWorkoutName, type ExerciseDef, type MuscleGroup, type Equipment } from "@/lib/exercises";
import { WEEKDAY_LABELS_FULL } from "@/lib/date";
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
  /** Dias da semana (0-6, domingo-sábado) marcados manualmente como descanso, nunca recebem treino. */
  restWeekdays: number[];
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

/**
 * Superior/Inferior combinado — usado em baixa frequência (≤3x/semana), onde não dá pra fracionar
 * mais sem deixar um grupo muscular sem treinar nenhuma vez na semana.
 */
const UPPER_LOWER_COMBINED: DayTemplate[] = [
  { label: "Superior", color: "var(--protein)", groups: ["chest", "back", "shoulders", "biceps", "triceps"] },
  { label: "Inferior", color: "var(--carb)", groups: ["quads", "hamstrings", "glutes", "calves", "abs"] },
];

/**
 * Superior/Inferior fracionado por padrão push/pull (empurrar/puxar) e quadríceps/posterior —
 * o clássico split de 4 dias/semana (Renaissance Periodization, Jeff Nippard, etc): em vez de
 * repetir "Superior" batendo nos mesmos grupos duas vezes, cada sessão tem uma ênfase distinta.
 */
const UPPER_LOWER_SPLIT: DayTemplate[] = [
  { label: "Superior — Empurrar", color: "var(--protein)", groups: ["chest", "shoulders", "triceps"] },
  { label: "Inferior — Quadríceps", color: "var(--carb)", groups: ["quads", "glutes", "calves", "abs"] },
  { label: "Superior — Puxar", color: "var(--fat)", groups: ["back", "biceps"] },
  { label: "Inferior — Posterior", color: "var(--sugar)", groups: ["hamstrings", "glutes", "calves", "abs"] },
];

const DAY_TEMPLATES: Record<SplitStyle, DayTemplate[]> = {
  full_body: [
    { label: "Full Body", color: "var(--accent)", groups: ["chest", "back", "shoulders", "quads", "hamstrings", "abs"] },
  ],
  upper_lower: UPPER_LOWER_COMBINED,
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

function resolveDayTemplates(splitStyle: SplitStyle, daysPerWeek: number): DayTemplate[] {
  if (splitStyle === "upper_lower" && daysPerWeek >= 4) return UPPER_LOWER_SPLIT;
  return DAY_TEMPLATES[splitStyle];
}

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
  "deadlift",
  "sumo-deadlift",
  "barbell-step-back-lunge",
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

/**
 * Distribuição fixa de dias de treino pela semana, por `daysPerWeek` (0 = domingo .. 6 = sábado,
 * igual `Date.getDay()`). Determinística — o mesmo `daysPerWeek` sempre cai nos mesmos dias, sem
 * precisar de um campo novo no perfil pra guardar isso.
 */
const WEEKDAY_SPREAD: Record<number, number[]> = {
  1: [3],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

/** Segunda→domingo, usado como ordem de preenchimento quando dias de descanso manuais forçam desvios da tabela acima. */
const WEEK_ORDER_MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

/**
 * Distribui `daysPerWeek` dias de treino pela semana, respeitando dias marcados manualmente como
 * descanso (`restWeekdays`). Parte da distribuição padrão (que já reflete convenções reais de
 * treino) e, se algum dia preferido cair num dia de descanso, troca pelo próximo dia disponível.
 * Se sobrarem menos dias do que `daysPerWeek` pede, o plano fica com menos sessões do que o
 * configurado — não dá pra treinar mais dias do que os disponíveis na semana.
 */
function assignWeekdays(daysPerWeek: number, restWeekdays: number[]): number[] {
  const excluded = new Set(restWeekdays);
  const available = WEEK_ORDER_MON_FIRST.filter((d) => !excluded.has(d));
  const n = Math.min(daysPerWeek, available.length);
  if (n <= 0) return [];

  const preferred = WEEKDAY_SPREAD[daysPerWeek] ?? WEEKDAY_SPREAD[4];
  const chosen = preferred.filter((d) => available.includes(d)).slice(0, n);
  for (const d of available) {
    if (chosen.length >= n) break;
    if (!chosen.includes(d)) chosen.push(d);
  }

  return chosen.sort((a, b) => WEEK_ORDER_MON_FIRST.indexOf(a) - WEEK_ORDER_MON_FIRST.indexOf(b));
}

/** Hard ceiling per session — even with every group favorited, a workout must stay practical (ACSM: ~4-6, up to ~8 for extra emphasis). */
const MAX_EXERCISES_PER_DAY = 8;

/** Grupos "grandes" — ganham exercícios extra primeiro quando sobra orçamento na sessão. */
const MAJOR_GROUPS = new Set<MuscleGroup>(["chest", "back", "shoulders", "quads", "hamstrings"]);

/**
 * Quantos exercícios uma sessão de treino de verdade costuma ter, independente de quantos grupos
 * musculares ela toca naquele dia — um dia de "Puxar" (só costas+bíceps) precisa de mais exercícios
 * por grupo que um full-body (6 grupos de uma vez), senão vira um treino de 2-3 exercícios, curto
 * demais pra estimular hipertrofia de verdade (~5-7 exercícios/sessão é a faixa comum em programas
 * de hipertrofia reais).
 */
const SESSION_TARGET_EXERCISES = 6;

/**
 * Decide quantos exercícios cada grupo muscular do dia recebe. Parte de 1 por grupo (cobertura
 * garantida) e distribui o resto do "orçamento" da sessão — priorizando grupos favoritados, depois
 * grupos grandes — até bater a meta da sessão ou o teto por grupo (que se ajusta conforme quantos
 * grupos existem naquele dia: um dia de um grupo só, tipo bro-split, pode concentrar bem mais).
 */
function allocateExerciseCounts(groups: MuscleGroup[], favoriteMuscleGroups: MuscleGroup[]): Map<MuscleGroup, number> {
  const counts = new Map<MuscleGroup, number>(groups.map((g) => [g, 1]));
  const target = Math.min(SESSION_TARGET_EXERCISES, MAX_EXERCISES_PER_DAY);
  const perGroupCap = Math.min(4, Math.ceil(target / groups.length) + 1);
  let remaining = Math.max(0, target - groups.length);

  const favorites = groups.filter((g) => favoriteMuscleGroups.includes(g));
  const majors = groups.filter((g) => MAJOR_GROUPS.has(g));
  const priorityOrder = [...favorites, ...favorites, ...majors, ...groups];

  let i = 0;
  let stalled = 0;
  while (remaining > 0 && priorityOrder.length > 0 && stalled < priorityOrder.length * 2) {
    const g = priorityOrder[i % priorityOrder.length];
    const current = counts.get(g) ?? 1;
    if (current < perGroupCap) {
      counts.set(g, current + 1);
      remaining--;
      stalled = 0;
    } else {
      stalled++;
    }
    i++;
  }

  // Bônus extra pros grupos favoritados, além da meta da sessão, dentro do teto máximo — preserva
  // a ênfase pedida explicitamente pelo usuário mesmo depois que a sessão já bateu o alvo geral.
  let bonusBudget = MAX_EXERCISES_PER_DAY - [...counts.values()].reduce((a, b) => a + b, 0);
  for (const g of favorites) {
    if (bonusBudget <= 0) break;
    counts.set(g, (counts.get(g) ?? 1) + 1);
    bonusBudget--;
  }

  return counts;
}

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
    imageUrl: def.imageUrl,
    muscleGroup: group,
  }));
}

export function generateWorkoutPlan(prefs: WorkoutPreferences): Workout[] {
  const weekdaySpread = assignWeekdays(prefs.daysPerWeek, prefs.restWeekdays);
  const effectiveDays = weekdaySpread.length;
  const templates = resolveDayTemplates(prefs.splitStyle, effectiveDays);
  const labelCounts: Record<string, number> = {};
  const workouts: Workout[] = [];
  const seedNum = hashSeed(prefs.seed);

  for (let i = 0; i < effectiveDays; i++) {
    const template = templates[i % templates.length];
    const occurrence = Math.floor(i / templates.length);
    labelCounts[template.label] = (labelCounts[template.label] ?? 0) + 1;
    const occurrenceForLabel = labelCounts[template.label];
    const suffix = occurrenceForLabel > 1 ? ` ${String.fromCharCode(64 + occurrenceForLabel)}` : "";

    const groupCounts = allocateExerciseCounts(template.groups, prefs.favoriteMuscleGroups);
    const exercises = template.groups.flatMap((group) =>
      pickExercisesForGroup(group, prefs, occurrence, seedNum, groupCounts.get(group) ?? 1),
    );

    const weekday = weekdaySpread[i % weekdaySpread.length];

    workouts.push({
      id: `dia-${i + 1}`,
      name: suggestWorkoutName(exercises.map((e) => e.muscleGroup)),
      category: WEEKDAY_LABELS_FULL[weekday],
      splitLabel: `${template.label}${suffix}`,
      color: template.color,
      day: `Dia ${i + 1}`,
      weekday,
      duration: "45 min",
      level: "Intermediário",
      exercises,
    });
  }

  return workouts;
}
