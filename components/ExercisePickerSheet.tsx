"use client";

import { useState } from "react";
import {
  EXERCISE_LIBRARY,
  MUSCLE_GROUP_LABELS,
  type ExerciseDef,
  type MuscleGroup,
} from "@/lib/exercises";
import { MUSCLE_GROUP_ICONS } from "@/lib/muscle-icons";
import { useLockBodyScroll } from "@/lib/hooks/useLockBodyScroll";
import { ExerciseDemo } from "@/components/ExerciseDemo";

const GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];

export function ExercisePickerSheet({
  open,
  onClose,
  onSelect,
  title,
  initialGroup,
  lockGroup = false,
  excludeIds = [],
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseDef) => void;
  title: string;
  initialGroup: MuscleGroup;
  lockGroup?: boolean;
  excludeIds?: string[];
}) {
  const [activeGroup, setActiveGroup] = useState<MuscleGroup>(initialGroup);
  useLockBodyScroll(open);

  if (!open) return null;

  const list = EXERCISE_LIBRARY.filter((e) => e.muscleGroup === activeGroup && !excludeIds.includes(e.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
        style={{ backdropFilter: "blur(2px)" }}
      />
      <div className="relative flex max-h-[80vh] w-full max-w-[480px] flex-col rounded-t-3xl border-t border-line bg-panel">
        <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-track" />
        <div className="flex items-center justify-between px-5 pb-3 pt-3">
          <div className="font-display text-[16px] font-bold">{title}</div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-track text-dim"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {!lockGroup && (
          <div className="grid grid-cols-4 gap-2 px-5 pb-4">
            {GROUPS.map((g) => {
              const Icon = MUSCLE_GROUP_ICONS[g];
              const active = g === activeGroup;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border py-2.5"
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--line)",
                    background: active ? "rgba(198,255,61,0.08)" : "var(--track)",
                  }}
                >
                  <Icon size={17} strokeWidth={2} color={active ? "var(--accent)" : "var(--dim)"} />
                  <span
                    className="text-[10px] font-semibold leading-none"
                    style={{ color: active ? "var(--accent)" : "var(--dim)" }}
                  >
                    {MUSCLE_GROUP_LABELS[g]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2 overflow-y-auto px-5 pb-6">
          {list.length === 0 && (
            <div className="py-8 text-center text-sm text-dim">Nenhum exercício disponível nesse grupo.</div>
          )}
          {list.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                onSelect(ex);
                onClose();
              }}
              className="flex items-center gap-3.5 rounded-2xl border border-line bg-track px-3.5 py-3 text-left active:opacity-70"
            >
              <ExerciseDemo demoName={ex.demoName} imageUrl={ex.imageUrl} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{ex.name}</div>
                <div className="mt-0.5 text-xs text-dim">
                  {ex.sets}x {ex.reps} · descanso {ex.rest}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
