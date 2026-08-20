"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Scale, Plus } from "lucide-react";
import { WeightChart } from "@/components/WeightChart";
import { WeightLogSheet } from "@/components/WeightLogSheet";
import { toDateKey } from "@/lib/date";

export function WeightSection({
  entries,
  currentWeightKg,
}: {
  entries: { date: string; weightKg: number }[];
  currentWeightKg: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(weightKg: number) {
    setSaving(true);
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: toDateKey(new Date()), weightKg }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-3xl border border-line bg-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale size={16} strokeWidth={2} color="var(--accent)" />
          <span className="font-display text-[15px] font-bold">Evolução do peso</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          disabled={saving}
          className="flex items-center gap-1 rounded-full border border-line bg-track px-2.5 py-1 text-[11px] font-semibold text-dim disabled:opacity-60"
        >
          <Plus size={11} strokeWidth={2.4} />
          Registrar
        </button>
      </div>

      <WeightChart entries={entries} />

      <p className="mt-4 text-[12px] leading-relaxed text-dim">
        O ideal é pesar 1x por semana, sempre no mesmo dia e horário (ex: toda segunda de manhã, em jejum) — o peso varia
        bastante dia a dia por água e alimentação, então o que importa é a tendência ao longo das semanas, não o número de
        um dia isolado.
      </p>

      <WeightLogSheet open={open} currentWeightKg={currentWeightKg} onClose={() => setOpen(false)} onSave={handleSave} />
    </div>
  );
}
