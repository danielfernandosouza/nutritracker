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
  color: string;
  day: string;
  duration: string;
  level: string;
  exercises: Exercise[];
};
