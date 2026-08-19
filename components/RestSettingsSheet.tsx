"use client";

import { useState } from "react";
import { X, Timer } from "lucide-react";
import { REST_PRESETS } from "@/lib/rest-timer";

export function RestSettingsSheet({
  open,
  current,
  onClose,
  onApply,
  onReset,
}: {
  open: boolean;
  current: number | null;
  onClose: () => void;
  onApply: (seconds: number) => void;
  onReset: () => void;
}) {
  const [custom, setCustom] = useState(current ? String(current) : "");

  if (!open) return null;

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
            <Timer size={16} strokeWidth={2} color="var(--accent)" />
            <h3 className="font-display text-base font-bold">Tempo de descanso</h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full bg-track text-dim">
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        <p className="mb-3.5 text-[13px] text-dim">
          Escolha um tempo padrão pra usar em todos os exercícios desse treino. Se não escolher nada, cada exercício mantém o próprio tempo de descanso.
        </p>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {REST_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setCustom(String(preset));
                onApply(preset);
              }}
              className="rounded-xl border py-3 text-center text-sm font-bold"
              style={{
                borderColor: current === preset ? "var(--accent)" : "var(--line)",
                background: current === preset ? "rgba(198,255,61,0.08)" : "var(--track)",
                color: current === preset ? "var(--accent)" : "var(--chalk)",
              }}
            >
              {preset}s
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-2.5">
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Tempo personalizado (s)"
            className="flex-1 rounded-xl border border-line bg-track px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={() => {
              const value = parseInt(custom, 10);
              if (value > 0) onApply(value);
            }}
            className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-[#0B0B0C]"
          >
            Usar
          </button>
        </div>

        <button
          onClick={() => {
            setCustom("");
            onReset();
          }}
          disabled={current === null}
          className="w-full rounded-xl border border-line py-3 text-sm font-semibold text-dim disabled:opacity-40"
        >
          Usar o padrão de cada exercício
        </button>
      </div>
    </div>
  );
}
