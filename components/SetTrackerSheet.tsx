"use client";

import { useState } from "react";
import { X, Plus, Check } from "lucide-react";
import { useLockBodyScroll } from "@/lib/hooks/useLockBodyScroll";

export function SetTrackerSheet({
  open,
  exerciseName,
  setNumber,
  totalSets,
  suggestedReps,
  lastWeightKg,
  color,
  onClose,
  onIncreaseSets,
  onSave,
}: {
  open: boolean;
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  suggestedReps: string;
  lastWeightKg: number | null;
  color: string;
  onClose: () => void;
  onIncreaseSets: () => void;
  onSave: (weightKg: number | null, reps: number | null) => Promise<void> | void;
}) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [saving, setSaving] = useState(false);

  const [prevKey, setPrevKey] = useState(`${open}-${setNumber}`);
  const key = `${open}-${setNumber}`;
  if (key !== prevKey) {
    setPrevKey(key);
    if (open) {
      setWeight(lastWeightKg ? String(lastWeightKg) : "");
      setReps("");
    }
  }

  useLockBodyScroll(open);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(weight ? parseFloat(weight.replace(",", ".")) : null, reps ? parseInt(reps, 10) : null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[420px] rounded-t-3xl border-t border-line bg-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-dim">{exerciseName}</div>
            <h3 className="font-display text-[17px] font-bold">
              Série {setNumber} de {totalSets}
            </h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full bg-track text-dim">
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        <div className="mb-3 flex gap-2.5">
          <div className="flex-1 rounded-2xl border border-line bg-track px-4 py-3.5">
            <label className="mb-1 block text-[11px] text-dim">Carga (kg)</label>
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="0"
              className="font-display w-full bg-transparent text-2xl font-bold outline-none placeholder:text-dim"
            />
          </div>
          <div className="flex-1 rounded-2xl border border-line bg-track px-4 py-3.5">
            <label className="mb-1 block text-[11px] text-dim">Reps ({suggestedReps})</label>
            <input
              type="text"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="—"
              className="font-display w-full bg-transparent text-2xl font-bold outline-none placeholder:text-dim"
            />
          </div>
        </div>

        <button
          onClick={onIncreaseSets}
          className="mb-4 flex items-center gap-1.5 text-[12px] font-semibold text-dim"
        >
          <Plus size={13} strokeWidth={2.4} />
          Adicionar mais uma série a esse exercício
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="font-display flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-[#0B0B0C] disabled:opacity-60"
          style={{ background: color }}
        >
          <Check size={16} strokeWidth={2.6} />
          {saving ? "Salvando..." : setNumber >= totalSets ? "Concluir última série" : "Concluir série"}
        </button>
      </div>
    </div>
  );
}
