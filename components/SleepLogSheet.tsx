"use client";

import { useState } from "react";
import { X, Moon } from "lucide-react";
import { useLockBodyScroll } from "@/lib/hooks/useLockBodyScroll";

export function SleepLogSheet({
  open,
  initialBedTime,
  initialWakeTime,
  onClose,
  onSave,
}: {
  open: boolean;
  initialBedTime: string | null;
  initialWakeTime: string | null;
  onClose: () => void;
  onSave: (bedTime: string, wakeTime: string) => Promise<void> | void;
}) {
  const [bedTime, setBedTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [saving, setSaving] = useState(false);
  useLockBodyScroll(open);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setBedTime(initialBedTime ?? "23:00");
      setWakeTime(initialWakeTime ?? "07:00");
    }
  }

  if (!open) return null;

  async function handleSave() {
    if (!bedTime || !wakeTime) return;
    setSaving(true);
    await onSave(bedTime, wakeTime);
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
            <Moon size={16} strokeWidth={2} color="var(--accent)" />
            <h3 className="font-display text-base font-bold">Registrar sono</h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full bg-track text-dim">
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        <div className="mb-4 flex gap-3">
          <div className="flex-1 rounded-2xl border border-line bg-track px-4 py-3.5">
            <label className="mb-1 block text-[11px] text-dim">Dormi às</label>
            <input
              type="time"
              value={bedTime}
              onChange={(e) => setBedTime(e.target.value)}
              className="font-display w-full bg-transparent text-lg font-bold outline-none"
            />
          </div>
          <div className="flex-1 rounded-2xl border border-line bg-track px-4 py-3.5">
            <label className="mb-1 block text-[11px] text-dim">Acordei às</label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="font-display w-full bg-transparent text-lg font-bold outline-none"
            />
          </div>
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
