"use client";

import { useState } from "react";
import { X, Scale } from "lucide-react";

export function WeightLogSheet({
  open,
  currentWeightKg,
  onClose,
  onSave,
}: {
  open: boolean;
  currentWeightKg: number | null;
  onClose: () => void;
  onSave: (weightKg: number) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setValue(currentWeightKg ? String(currentWeightKg) : "");
  }

  if (!open) return null;

  async function handleSave() {
    const parsed = parseFloat(value.replace(",", "."));
    if (!parsed || parsed <= 0) return;
    setSaving(true);
    await onSave(parsed);
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[420px] rounded-t-2xl border-t border-line bg-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={16} strokeWidth={2} color="var(--accent)" />
            <h3 className="font-display text-base font-bold">Registrar peso de hoje</h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full bg-track text-dim">
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-line bg-track px-4 py-5">
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="peso"
            className="font-display w-24 bg-transparent text-center text-3xl font-bold outline-none placeholder:text-dim placeholder:text-xl"
          />
          <span className="text-sm text-dim">kg</span>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="font-display w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-[#0B0B0C] disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
