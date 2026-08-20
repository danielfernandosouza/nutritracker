import type { MuscleGroup } from "@/lib/exercises";

export type Exercise = {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  demoName?: string;
  muscleGroup?: MuscleGroup;
};

export type Workout = {
  id: string;
  name: string;
  category: string;
  /** Rótulo curto da divisão de treino (ex: "Superior", "Empurrar"), exibido como uma tag no card. */
  splitLabel: string;
  color: string;
  day: string;
  /** Dia da semana fixo desse treino, igual a `Date.getDay()` (0 = domingo). */
  weekday: number;
  duration: string;
  level: string;
  exercises: Exercise[];
};
