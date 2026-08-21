export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "abs";

export type Equipment = "machine" | "free_weight" | "cable" | "bodyweight";

export type ExerciseDef = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  sets: string;
  reps: string;
  rest: string;
  /** Exact exercise name in the free-exercise-db dataset (yuhonas/free-exercise-db), used to fetch demo images. */
  demoName?: string;
};

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Peito",
  back: "Costas",
  shoulders: "Ombro",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quads: "Quadríceps",
  hamstrings: "Posterior de coxa",
  glutes: "Glúteo",
  calves: "Panturrilha",
  abs: "Abdômen",
};

export const EXERCISE_LIBRARY: ExerciseDef[] = [
  // Peito
  { id: "peck-deck", name: "Peck Deck (voador máquina)", muscleGroup: "chest", equipment: "machine", sets: "3", reps: "10-12", rest: "60s", demoName: "Butterfly" },
  { id: "chest-press", name: "Supino máquina (chest press)", muscleGroup: "chest", equipment: "machine", sets: "4", reps: "8-10", rest: "90s", demoName: "Machine Bench Press" },
  { id: "incline-chest-press", name: "Supino inclinado máquina", muscleGroup: "chest", equipment: "machine", sets: "3", reps: "10-12", rest: "75s", demoName: "Smith Machine Incline Bench Press" },
  { id: "barbell-bench", name: "Supino reto com barra", muscleGroup: "chest", equipment: "free_weight", sets: "4", reps: "8-10", rest: "90s", demoName: "Barbell Bench Press - Medium Grip" },
  { id: "dumbbell-incline-bench", name: "Supino inclinado com halteres", muscleGroup: "chest", equipment: "free_weight", sets: "3", reps: "10-12", rest: "75s", demoName: "Incline Dumbbell Press" },
  { id: "dumbbell-flat-bench", name: "Supino reto com halteres", muscleGroup: "chest", equipment: "free_weight", sets: "3", reps: "10-12", rest: "75s", demoName: "Dumbbell Bench Press" },
  { id: "dumbbell-fly", name: "Crucifixo com halteres", muscleGroup: "chest", equipment: "free_weight", sets: "3", reps: "12-15", rest: "60s", demoName: "Dumbbell Flyes" },
  { id: "cable-crossover", name: "Crucifixo no cabo", muscleGroup: "chest", equipment: "cable", sets: "3", reps: "12-15", rest: "60s", demoName: "Cable Crossover" },
  { id: "low-cable-fly", name: "Crucifixo no cabo (baixo pro alto)", muscleGroup: "chest", equipment: "cable", sets: "3", reps: "12-15", rest: "60s", demoName: "Low Cable Crossover" },
  { id: "pushup", name: "Flexão de braço", muscleGroup: "chest", equipment: "bodyweight", sets: "3", reps: "12-20", rest: "45s", demoName: "Push-Up Wide" },
  { id: "incline-pushup", name: "Flexão inclinada (apoio elevado)", muscleGroup: "chest", equipment: "bodyweight", sets: "3", reps: "12-20", rest: "45s", demoName: "Incline Push-Up Medium" },

  // Costas
  { id: "pulldown", name: "Puxada frontal (pulldown)", muscleGroup: "back", equipment: "machine", sets: "4", reps: "8-10", rest: "90s", demoName: "Wide-Grip Lat Pulldown" },
  { id: "seated-row-machine", name: "Remada máquina (sentado)", muscleGroup: "back", equipment: "machine", sets: "3", reps: "10-12", rest: "60s", demoName: "Seated Cable Rows" },
  { id: "cable-row", name: "Remada baixa (cabo, pegada neutra)", muscleGroup: "back", equipment: "cable", sets: "3", reps: "10-12", rest: "60s", demoName: "Seated One-arm Cable Pulley Rows" },
  { id: "pullover", name: "Pull-over (polia/máquina)", muscleGroup: "back", equipment: "machine", sets: "2", reps: "12-15", rest: "45s", demoName: "Bent-Arm Dumbbell Pullover" },
  { id: "barbell-row", name: "Remada curvada com barra", muscleGroup: "back", equipment: "free_weight", sets: "4", reps: "8-10", rest: "90s", demoName: "Bent Over Barbell Row" },
  { id: "one-arm-dumbbell-row", name: "Remada unilateral com halter", muscleGroup: "back", equipment: "free_weight", sets: "3", reps: "10-12 (cada)", rest: "60s", demoName: "One-Arm Dumbbell Row" },
  { id: "lat-pulldown-wide", name: "Puxada aberta na barra", muscleGroup: "back", equipment: "cable", sets: "3", reps: "10-12", rest: "75s", demoName: "Full Range-Of-Motion Lat Pulldown" },
  { id: "straight-arm-pulldown", name: "Puxada com braços estendidos (cabo)", muscleGroup: "back", equipment: "cable", sets: "3", reps: "12-15", rest: "45s", demoName: "Straight-Arm Pulldown" },
  { id: "pullup", name: "Barra fixa (ou assistida)", muscleGroup: "back", equipment: "bodyweight", sets: "3", reps: "6-10", rest: "90s", demoName: "Pullups" },

  // Ombro
  { id: "shoulder-press-machine", name: "Desenvolvimento de ombro máquina", muscleGroup: "shoulders", equipment: "machine", sets: "3", reps: "10-12", rest: "60s", demoName: "Smith Machine Overhead Shoulder Press" },
  { id: "lateral-raise-cable", name: "Elevação lateral (cabo/halteres)", muscleGroup: "shoulders", equipment: "cable", sets: "3", reps: "12-15", rest: "45s", demoName: "Cable Seated Lateral Raise" },
  { id: "dumbbell-shoulder-press", name: "Desenvolvimento com halteres (sentado)", muscleGroup: "shoulders", equipment: "free_weight", sets: "3", reps: "10-12", rest: "75s", demoName: "Dumbbell Shoulder Press" },
  { id: "arnold-press", name: "Desenvolvimento Arnold", muscleGroup: "shoulders", equipment: "free_weight", sets: "3", reps: "10-12", rest: "75s", demoName: "Arnold Dumbbell Press" },
  { id: "lateral-raise-dumbbell", name: "Elevação lateral com halteres", muscleGroup: "shoulders", equipment: "free_weight", sets: "3", reps: "12-15", rest: "45s", demoName: "Side Lateral Raise" },
  { id: "front-raise", name: "Elevação frontal com halteres", muscleGroup: "shoulders", equipment: "free_weight", sets: "3", reps: "12-15", rest: "45s", demoName: "Front Dumbbell Raise" },
  { id: "rear-delt-fly", name: "Crucifixo invertido (posterior de ombro)", muscleGroup: "shoulders", equipment: "machine", sets: "3", reps: "12-15", rest: "45s", demoName: "Dumbbell Lying Rear Lateral Raise" },
  { id: "face-pull", name: "Face pull no cabo", muscleGroup: "shoulders", equipment: "cable", sets: "3", reps: "12-15", rest: "45s", demoName: "Face Pull" },

  // Bíceps
  { id: "biceps-machine", name: "Rosca direta (máquina/scott)", muscleGroup: "biceps", equipment: "machine", sets: "3", reps: "10-12", rest: "45s", demoName: "Cable Preacher Curl" },
  { id: "hammer-curl", name: "Rosca martelo (halteres)", muscleGroup: "biceps", equipment: "free_weight", sets: "2", reps: "12-15", rest: "45s", demoName: "Alternate Hammer Curl" },
  { id: "barbell-curl", name: "Rosca direta com barra", muscleGroup: "biceps", equipment: "free_weight", sets: "3", reps: "10-12", rest: "45s", demoName: "Barbell Curl" },
  { id: "concentration-curl", name: "Rosca concentrada", muscleGroup: "biceps", equipment: "free_weight", sets: "3", reps: "10-12 (cada)", rest: "45s", demoName: "Concentration Curls" },
  { id: "incline-dumbbell-curl", name: "Rosca inclinada com halteres", muscleGroup: "biceps", equipment: "free_weight", sets: "3", reps: "10-12", rest: "45s", demoName: "Incline Dumbbell Curl" },
  { id: "cable-curl", name: "Rosca no cabo", muscleGroup: "biceps", equipment: "cable", sets: "3", reps: "12-15", rest: "45s", demoName: "Standing Biceps Cable Curl" },

  // Tríceps
  { id: "triceps-cable", name: "Tríceps na polia (corda)", muscleGroup: "triceps", equipment: "cable", sets: "3", reps: "12-15", rest: "45s", demoName: "Triceps Pushdown - Rope Attachment" },
  { id: "triceps-machine", name: "Tríceps na máquina (extensão)", muscleGroup: "triceps", equipment: "machine", sets: "2", reps: "12-15", rest: "45s", demoName: "Triceps Pushdown" },
  { id: "french-press", name: "Tríceps francês (halteres)", muscleGroup: "triceps", equipment: "free_weight", sets: "3", reps: "10-12", rest: "45s", demoName: "Decline Dumbbell Triceps Extension" },
  { id: "skullcrusher", name: "Tríceps testa com barra", muscleGroup: "triceps", equipment: "free_weight", sets: "3", reps: "10-12", rest: "45s", demoName: "Lying Triceps Press" },
  { id: "overhead-triceps-cable", name: "Tríceps francês no cabo", muscleGroup: "triceps", equipment: "cable", sets: "3", reps: "12-15", rest: "45s", demoName: "Cable Rope Overhead Triceps Extension" },
  { id: "dips", name: "Mergulho (dips) no banco", muscleGroup: "triceps", equipment: "bodyweight", sets: "3", reps: "10-15", rest: "45s", demoName: "Dips - Triceps Version" },
  { id: "diamond-pushup", name: "Flexão diamante (fecha mãos)", muscleGroup: "triceps", equipment: "bodyweight", sets: "3", reps: "10-15", rest: "45s", demoName: "Close-Grip Push-Up off of a Dumbbell" },

  // Quadríceps
  { id: "leg-press", name: "Leg press 45°", muscleGroup: "quads", equipment: "machine", sets: "4", reps: "10-12", rest: "90s", demoName: "Leg Press" },
  { id: "leg-extension", name: "Cadeira extensora", muscleGroup: "quads", equipment: "machine", sets: "3", reps: "12-15", rest: "60s", demoName: "Leg Extensions" },
  { id: "smith-squat", name: "Agachamento no Smith", muscleGroup: "quads", equipment: "machine", sets: "3", reps: "10", rest: "90s", demoName: "Smith Machine Squat" },
  { id: "hack-squat", name: "Agachamento hack na máquina", muscleGroup: "quads", equipment: "machine", sets: "3", reps: "10-12", rest: "90s", demoName: "Hack Squat" },
  { id: "barbell-squat", name: "Agachamento livre com barra", muscleGroup: "quads", equipment: "free_weight", sets: "4", reps: "6-10", rest: "120s", demoName: "Barbell Full Squat" },
  { id: "goblet-squat", name: "Agachamento goblet com halter", muscleGroup: "quads", equipment: "free_weight", sets: "3", reps: "10-12", rest: "75s", demoName: "Dumbbell Squat" },
  { id: "bulgarian-split-squat", name: "Afundo búlgaro (pé elevado)", muscleGroup: "quads", equipment: "free_weight", sets: "3", reps: "8-10 (cada)", rest: "75s", demoName: "Split Squats" },
  { id: "lunge", name: "Afundo com halteres", muscleGroup: "quads", equipment: "free_weight", sets: "3", reps: "10-12 (cada)", rest: "60s", demoName: "Dumbbell Lunges" },
  { id: "bodyweight-squat", name: "Agachamento livre (peso corporal)", muscleGroup: "quads", equipment: "bodyweight", sets: "3", reps: "15-20", rest: "45s", demoName: "Bodyweight Squat" },

  // Posterior de coxa
  { id: "leg-curl", name: "Mesa flexora", muscleGroup: "hamstrings", equipment: "machine", sets: "3", reps: "12-15", rest: "60s", demoName: "Lying Leg Curls" },
  { id: "seated-leg-curl", name: "Cadeira flexora (sentado)", muscleGroup: "hamstrings", equipment: "machine", sets: "3", reps: "12-15", rest: "60s", demoName: "Seated Leg Curl" },
  { id: "romanian-deadlift", name: "Levantamento terra romeno", muscleGroup: "hamstrings", equipment: "free_weight", sets: "3", reps: "8-10", rest: "90s", demoName: "Romanian Deadlift" },
  { id: "dumbbell-stiff-leg-deadlift", name: "Terra rígido com halteres", muscleGroup: "hamstrings", equipment: "free_weight", sets: "3", reps: "10-12", rest: "75s", demoName: "Stiff-Legged Dumbbell Deadlift" },
  { id: "cable-pull-through", name: "Pull-through no cabo", muscleGroup: "hamstrings", equipment: "cable", sets: "3", reps: "12-15", rest: "60s", demoName: "Pull Through" },

  // Glúteo
  { id: "hip-thrust-machine", name: "Cadeira adutora/abdutora", muscleGroup: "glutes", equipment: "machine", sets: "2", reps: "15 (cada)", rest: "45s", demoName: "Thigh Abductor" },
  { id: "hip-thrust", name: "Elevação de quadril (hip thrust) com barra", muscleGroup: "glutes", equipment: "free_weight", sets: "3", reps: "10-12", rest: "75s", demoName: "Barbell Hip Thrust" },
  { id: "glute-bridge", name: "Ponte de glúteo (peso corporal)", muscleGroup: "glutes", equipment: "bodyweight", sets: "3", reps: "15-20", rest: "45s", demoName: "Single Leg Glute Bridge" },
  { id: "cable-kickback", name: "Glúteo no cabo (coice)", muscleGroup: "glutes", equipment: "cable", sets: "3", reps: "12-15", rest: "45s", demoName: "Glute Kickback" },
  { id: "step-up", name: "Step-up no banco com halteres", muscleGroup: "glutes", equipment: "free_weight", sets: "3", reps: "10-12 (cada)", rest: "60s", demoName: "Dumbbell Step Ups" },

  // Panturrilha
  { id: "calf-machine", name: "Panturrilha (leg press/máquina)", muscleGroup: "calves", equipment: "machine", sets: "4", reps: "15-20", rest: "45s", demoName: "Calf Press On The Leg Press Machine" },
  { id: "seated-calf-raise", name: "Panturrilha sentado na máquina", muscleGroup: "calves", equipment: "machine", sets: "4", reps: "15-20", rest: "45s", demoName: "Seated Calf Raise" },
  { id: "calf-raise-standing", name: "Panturrilha em pé com halteres", muscleGroup: "calves", equipment: "free_weight", sets: "4", reps: "15-20", rest: "45s", demoName: "Standing Calf Raises" },
  { id: "calf-raise-bodyweight", name: "Panturrilha em pé (peso corporal)", muscleGroup: "calves", equipment: "bodyweight", sets: "4", reps: "20-25", rest: "30s", demoName: "Rocking Standing Calf Raise" },

  // Abdômen
  { id: "cable-crunch", name: "Abdominal na polia (crunch)", muscleGroup: "abs", equipment: "cable", sets: "3", reps: "15-20", rest: "45s", demoName: "Cable Crunch" },
  { id: "ab-machine-crunch", name: "Abdominal na máquina", muscleGroup: "abs", equipment: "machine", sets: "3", reps: "15-20", rest: "45s", demoName: "Ab Crunch Machine" },
  { id: "plank", name: "Prancha abdominal", muscleGroup: "abs", equipment: "bodyweight", sets: "3", reps: "30-45s", rest: "30s", demoName: "Plank" },
  { id: "hanging-leg-raise", name: "Elevação de pernas (na barra)", muscleGroup: "abs", equipment: "bodyweight", sets: "3", reps: "10-15", rest: "45s", demoName: "Hanging Leg Raise" },
  { id: "bicycle-crunch", name: "Abdominal bicicleta", muscleGroup: "abs", equipment: "bodyweight", sets: "3", reps: "15-20 (cada)", rest: "30s", demoName: "Air Bike" },
  { id: "russian-twist", name: "Rotação russa (russian twist)", muscleGroup: "abs", equipment: "bodyweight", sets: "3", reps: "15-20 (cada)", rest: "30s", demoName: "Russian Twist" },
];

const DEMO_BASE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

/** Two still frames (start/end position) for a demoName, meant to be cross-faded to simulate motion. */
export function getExerciseDemoImages(demoName: string): [string, string] {
  const slug = demoName.replace(/ /g, "_");
  return [`${DEMO_BASE_URL}/${slug}/0.jpg`, `${DEMO_BASE_URL}/${slug}/1.jpg`];
}

export function getExercisesForGroup(group: MuscleGroup): ExerciseDef[] {
  return EXERCISE_LIBRARY.filter((e) => e.muscleGroup === group);
}

/** Auto-names a workout day based on which muscle groups its current exercises hit most. */
export function suggestWorkoutName(groups: (MuscleGroup | undefined)[]): string {
  const counts = new Map<MuscleGroup, number>();
  for (const g of groups) {
    if (!g) continue;
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  if (top.length === 0) return "Treino livre";
  return top.slice(0, 2).map((g) => MUSCLE_GROUP_LABELS[g]).join(" & ");
}
