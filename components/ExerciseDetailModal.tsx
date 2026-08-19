"use client";

import { X } from "lucide-react";
import { ExerciseDemo } from "@/components/ExerciseDemo";
import { EXERCISE_INSTRUCTIONS } from "@/lib/exercise-instructions";
import { MUSCLE_GROUP_LABELS } from "@/lib/exercises";
import type { Exercise } from "@/lib/workouts";

export function ExerciseDetailModal({
  exercise,
  color,
  onClose,
}: {
  exercise: Exercise;
  color: string;
  onClose: () => void;
}) {
  const steps = exercise.demoName ? EXERCISE_INSTRUCTIONS[exercise.demoName] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
        style={{ backdropFilter: "blur(2px)" }}
      />
      <div className="relative flex max-h-[86vh] w-full max-w-[480px] flex-col overflow-y-auto rounded-t-3xl border-t border-line bg-panel">
        <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-track" />

        <div className="flex items-center justify-between px-5 pb-3 pt-3">
          <div className="min-w-0 pr-3">
            <div className="font-display truncate text-[17px] font-bold">{exercise.name}</div>
            <div className="mt-0.5 text-xs text-dim">
              {exercise.sets}x {exercise.reps} · descanso {exercise.rest}
              {exercise.muscleGroup && ` · ${MUSCLE_GROUP_LABELS[exercise.muscleGroup]}`}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-track text-dim"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>

        <div className="px-5">
          <div className="overflow-hidden rounded-2xl bg-track" style={{ aspectRatio: "1 / 1" }}>
            <ExerciseDemo demoName={exercise.demoName} size={"100%" as unknown as number} />
          </div>
        </div>

        <div className="px-5 pb-6 pt-5">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            <span className="text-[13px] font-bold">Como executar</span>
          </div>
          {steps && steps.length > 0 ? (
            <ol className="flex flex-col gap-2.5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-snug text-dim">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: "rgba(255,255,255,0.06)", color: "var(--chalk)" }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[13px] text-dim">Instruções detalhadas ainda não disponíveis para este exercício.</p>
          )}
        </div>
      </div>
    </div>
  );
}
