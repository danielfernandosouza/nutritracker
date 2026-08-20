"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Pencil, Repeat2, Trash2, Plus, Info, Flame, CheckCircle2, Watch, Timer } from "lucide-react";
import type { Workout, Exercise } from "@/lib/workouts";
import { ExerciseDemo } from "@/components/ExerciseDemo";
import { ExercisePickerSheet } from "@/components/ExercisePickerSheet";
import { ExerciseDetailModal } from "@/components/ExerciseDetailModal";
import { WorkoutScanFlow } from "@/components/WorkoutScanFlow";
import { RestTimerOverlay } from "@/components/RestTimerOverlay";
import { RestSettingsSheet } from "@/components/RestSettingsSheet";
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS, suggestWorkoutName, type ExerciseDef, type MuscleGroup } from "@/lib/exercises";
import { toDateKey } from "@/lib/date";
import { parseRestSeconds, formatRestSeconds } from "@/lib/rest-timer";
import { useLockBodyScroll } from "@/lib/hooks/useLockBodyScroll";

type StoredOverride = {
  name: string;
  customName: boolean;
  exercises: Exercise[];
  restOverrideSeconds?: number | null;
};

function storageKey(workoutId: string) {
  return `nutritracker:workout:${workoutId}`;
}

function toExercise(def: ExerciseDef): Exercise {
  return { name: def.name, sets: def.sets, reps: def.reps, rest: def.rest, demoName: def.demoName, muscleGroup: def.muscleGroup };
}

function exerciseIdByName(name: string): string | undefined {
  return EXERCISE_LIBRARY.find((e) => e.name === name)?.id;
}

export function WorkoutDetailClient({ workout }: { workout: Workout }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [exercises, setExercises] = useState<Exercise[]>(workout.exercises);
  const [name, setName] = useState(workout.name);
  const [customName, setCustomName] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [loggedToday, setLoggedToday] = useState(false);
  const [logging, setLogging] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [restOverrideSeconds, setRestOverrideSeconds] = useState<number | null>(null);
  const [restSettingsOpen, setRestSettingsOpen] = useState(false);
  const [activeRest, setActiveRest] = useState<{ seconds: number; exerciseName: string } | null>(null);
  useLockBodyScroll(removeIndex !== null);

  async function refreshWorkoutLog() {
    try {
      const res = await fetch("/api/workout-log");
      if (!res.ok) return;
      const json = await res.json();
      setLoggedToday(!!json.loggedToday);
      setStreak(typeof json.streak === "number" ? json.streak : null);
    } catch {
      // não bloqueia a tela de treino se o streak falhar ao carregar
    }
  }

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(storageKey(workout.id));
        if (!raw) return;
        const parsed = JSON.parse(raw) as StoredOverride;
        if (parsed.exercises?.length) setExercises(parsed.exercises);
        if (parsed.customName) {
          setCustomName(true);
          setName(parsed.name);
        }
        if (typeof parsed.restOverrideSeconds === "number") {
          setRestOverrideSeconds(parsed.restOverrideSeconds);
        }
      } catch {
        // ignore corrupt local storage
      }
    }
    load();

    function triggerStreak() {
      refreshWorkoutLog();
    }
    triggerStreak();
  }, [workout.id]);

  async function handleLogWorkout() {
    setLogging(true);
    try {
      await fetch("/api/workout-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: toDateKey(new Date()), workoutName: name, planDayId: workout.id }),
      });
      await refreshWorkoutLog();
    } finally {
      setLogging(false);
    }
  }

  function persist(nextExercises: Exercise[], nextName: string, nextCustomName: boolean, nextRestOverride = restOverrideSeconds) {
    const payload: StoredOverride = {
      name: nextName,
      customName: nextCustomName,
      exercises: nextExercises,
      restOverrideSeconds: nextRestOverride,
    };
    localStorage.setItem(storageKey(workout.id), JSON.stringify(payload));
  }

  function applyRestOverride(seconds: number) {
    setRestOverrideSeconds(seconds);
    persist(exercises, name, customName, seconds);
    setRestSettingsOpen(false);
  }

  function resetRestOverride() {
    setRestOverrideSeconds(null);
    persist(exercises, name, customName, null);
    setRestSettingsOpen(false);
  }

  function handleToggleDone(idx: number, ex: Exercise) {
    const nowDone = !done[idx];
    setDone((d) => ({ ...d, [idx]: nowDone }));
    if (nowDone) {
      const seconds = restOverrideSeconds ?? parseRestSeconds(ex.rest);
      setActiveRest({ seconds, exerciseName: ex.name });
    }
  }

  function applyExercises(next: Exercise[]) {
    setExercises(next);
    const finalName = customName ? name : suggestWorkoutName(next.map((e) => e.muscleGroup));
    if (!customName) setName(finalName);
    persist(next, finalName, customName);
  }

  function handleSwap(def: ExerciseDef) {
    if (swapIndex === null) return;
    const next = exercises.map((ex, i) => (i === swapIndex ? toExercise(def) : ex));
    applyExercises(next);
    setSwapIndex(null);
  }

  function handleAdd(def: ExerciseDef) {
    applyExercises([...exercises, toExercise(def)]);
    setAdding(false);
  }

  function confirmRemove() {
    if (removeIndex === null) return;
    applyExercises(exercises.filter((_, i) => i !== removeIndex));
    setRemoveIndex(null);
  }

  function commitName(value: string) {
    const trimmed = value.trim();
    const finalName = trimmed || suggestWorkoutName(exercises.map((e) => e.muscleGroup));
    const isCustom = trimmed.length > 0;
    setName(finalName);
    setCustomName(isCustom);
    persist(exercises, finalName, isCustom);
    setEditingName(false);
  }

  function resetToAuto() {
    const autoName = suggestWorkoutName(exercises.map((e) => e.muscleGroup));
    setName(autoName);
    setCustomName(false);
    persist(exercises, autoName, false);
  }

  const swapGroup: MuscleGroup | undefined = swapIndex !== null ? exercises[swapIndex]?.muscleGroup : undefined;
  const swapExcludeIds = swapIndex !== null ? [exerciseIdByName(exercises[swapIndex].name)].filter((x): x is string => !!x) : [];
  const addExcludeIds = exercises.map((e) => exerciseIdByName(e.name)).filter((x): x is string => !!x);

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="mb-4.5 flex items-center gap-3">
        <Link
          href="/workouts"
          aria-label="Voltar"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel"
        >
          <ChevronLeft size={17} strokeWidth={2.2} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: workout.color }}>
              {workout.category}
            </span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: "color-mix(in srgb, " + workout.color + " 18%, var(--panel))", color: workout.color }}
            >
              {workout.splitLabel}
            </span>
          </div>
          {editingName ? (
            <input
              autoFocus
              defaultValue={customName ? name : ""}
              placeholder={name}
              onBlur={(e) => commitName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="font-display w-full border-b border-accent bg-transparent text-[18px] font-bold outline-none"
            />
          ) : (
            <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 text-left">
              <span className="font-display text-[18px] font-bold">{name}</span>
              <Pencil size={12} strokeWidth={2} color="var(--dim)" />
            </button>
          )}
        </div>
        {customName && !editingName && (
          <button onClick={resetToAuto} className="text-[11px] font-semibold text-dim underline decoration-dotted">
            auto
          </button>
        )}
        <button
          onClick={() => setRestSettingsOpen(true)}
          aria-label="Configurar tempo de descanso"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-panel"
        >
          <Timer size={15} strokeWidth={2} color={restOverrideSeconds !== null ? "var(--accent)" : "var(--dim)"} />
          {restOverrideSeconds !== null && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
          )}
        </button>
      </div>

      <div className="mb-5 flex gap-2.5">
        <div className="flex-1 rounded-2xl border border-line bg-panel p-3 text-center">
          <div className="font-display text-[17px] font-bold">{workout.duration}</div>
          <div className="mt-0.5 text-[11px] text-dim">duração</div>
        </div>
        <div className="flex-1 rounded-2xl border border-line bg-panel p-3 text-center">
          <div className="font-display text-[17px] font-bold">{exercises.length}</div>
          <div className="mt-0.5 text-[11px] text-dim">exercícios</div>
        </div>
        <div className="flex-1 rounded-2xl border border-line bg-panel p-3 text-center">
          <div className="font-display text-[17px] font-bold">{workout.level}</div>
          <div className="mt-0.5 text-[11px] text-dim">nível</div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {exercises.map((ex, idx) => {
          const isDone = !!done[idx];
          return (
            <div key={idx} className="flex items-center gap-3.5 rounded-2xl border border-line bg-panel px-4 py-3.5">
              <button
                onClick={() => handleToggleDone(idx, ex)}
                aria-label={isDone ? "Desmarcar exercício" : "Marcar exercício concluído"}
                className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: isDone ? workout.color : "#3A3C3F",
                  background: isDone ? workout.color : "transparent",
                }}
              >
                {isDone && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0B0B0C" strokeWidth="3">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setDetailIndex(idx)}
                aria-label="Ver como executar"
                className="relative shrink-0"
              >
                <ExerciseDemo demoName={ex.demoName} />
                <span
                  className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-panel"
                  style={{ background: "var(--accent)" }}
                >
                  <Info size={9} strokeWidth={3} color="#0B0B0C" />
                </span>
              </button>
              <button onClick={() => setDetailIndex(idx)} className="min-w-0 flex-1 text-left">
                <div
                  className="text-sm font-semibold"
                  style={{ textDecoration: isDone ? "line-through" : "none", color: isDone ? "#6A6A70" : "var(--chalk)" }}
                >
                  {ex.name}
                </div>
                <div className="mt-0.5 text-xs text-dim">
                  {ex.sets}x {ex.reps} · descanso {restOverrideSeconds !== null ? formatRestSeconds(restOverrideSeconds) : ex.rest}
                  {ex.muscleGroup && ` · ${MUSCLE_GROUP_LABELS[ex.muscleGroup]}`}
                </div>
              </button>
              <button
                onClick={() => setSwapIndex(idx)}
                aria-label="Trocar exercício"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-track text-dim"
              >
                <Repeat2 size={15} strokeWidth={2} />
              </button>
              <button
                onClick={() => setRemoveIndex(idx)}
                aria-label="Remover exercício"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-track text-dim"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setAdding(true)}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-panel px-4 py-3.5 text-sm font-semibold text-accent"
      >
        <Plus size={16} strokeWidth={2.4} />
        Adicionar exercício
      </button>

      <div className="mt-5 flex gap-2.5">
        <button
          onClick={handleLogWorkout}
          disabled={loggedToday || logging}
          className="font-display flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold disabled:opacity-70"
          style={{ background: loggedToday ? "var(--track)" : "var(--accent)", color: loggedToday ? "var(--accent)" : "#0B0B0C" }}
        >
          {loggedToday ? <CheckCircle2 size={18} strokeWidth={2.2} /> : <Flame size={18} strokeWidth={2.2} />}
          {loggedToday ? "Concluído hoje" : logging ? "Salvando..." : "Concluir treino"}
        </button>
        <button
          onClick={() => setScanOpen(true)}
          aria-label="Registrar com foto do relógio"
          className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl border border-line bg-panel text-dim"
        >
          <Watch size={19} strokeWidth={2} />
        </button>
      </div>
      {streak !== null && streak > 0 && (
        <p className="mt-2 text-center text-[12px] font-semibold text-dim">
          🔥 {streak} {streak === 1 ? "dia seguido" : "dias seguidos"} treinando
        </p>
      )}

      <WorkoutScanFlow open={scanOpen} onClose={() => setScanOpen(false)} onSaved={refreshWorkoutLog} />

      <RestSettingsSheet
        open={restSettingsOpen}
        current={restOverrideSeconds}
        onClose={() => setRestSettingsOpen(false)}
        onApply={applyRestOverride}
        onReset={resetRestOverride}
      />

      {activeRest && (
        <RestTimerOverlay
          totalSeconds={activeRest.seconds}
          exerciseName={activeRest.exerciseName}
          color="var(--accent)"
          onClose={() => setActiveRest(null)}
        />
      )}

      {swapIndex !== null && swapGroup && (
        <ExercisePickerSheet
          open
          onClose={() => setSwapIndex(null)}
          onSelect={handleSwap}
          title={`Trocar por outro de ${MUSCLE_GROUP_LABELS[swapGroup]}`}
          initialGroup={swapGroup}
          lockGroup
          excludeIds={swapExcludeIds}
        />
      )}

      {adding && (
        <ExercisePickerSheet
          open
          onClose={() => setAdding(false)}
          onSelect={handleAdd}
          title="Adicionar exercício"
          initialGroup={exercises[0]?.muscleGroup ?? "chest"}
          excludeIds={addExcludeIds}
        />
      )}

      {detailIndex !== null && (
        <ExerciseDetailModal
          exercise={exercises[detailIndex]}
          color={workout.color}
          onClose={() => setDetailIndex(null)}
        />
      )}

      {removeIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
          <button
            aria-label="Fechar"
            onClick={() => setRemoveIndex(null)}
            className="absolute inset-0 bg-black/70"
            style={{ backdropFilter: "blur(2px)" }}
          />
          <div className="relative w-full max-w-[340px] rounded-3xl border border-line bg-panel p-5">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(255,77,141,0.12)" }}>
              <Trash2 size={19} strokeWidth={2} color="var(--sodium)" />
            </div>
            <div className="text-center font-display text-[16px] font-bold">Remover exercício?</div>
            <p className="mt-1.5 text-center text-[13px] text-dim">
              &ldquo;{exercises[removeIndex].name}&rdquo; será removido deste treino. Você pode adicioná-lo de volta depois.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setRemoveIndex(null)}
                className="flex-1 rounded-xl border border-line bg-track py-2.5 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-[#0B0B0C]"
                style={{ background: "var(--sodium)" }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
