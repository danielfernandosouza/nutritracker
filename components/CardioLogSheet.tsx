"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Footprints, X, Check } from "lucide-react";
import { useLockBodyScroll } from "@/lib/hooks/useLockBodyScroll";
import { toDateKey } from "@/lib/date";

type CardioActivity = "RUN" | "WALK";

const ACTIVITY_LABELS: Record<CardioActivity, string> = {
  RUN: "Corrida",
  WALK: "Caminhada",
};

function formatPace(paceMinPerKm: number | null): string {
  if (paceMinPerKm === null || !Number.isFinite(paceMinPerKm)) return "—";
  const totalSeconds = Math.round(paceMinPerKm * 60);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}

export function CardioLogSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState<CardioActivity>("RUN");
  const [distanceKm, setDistanceKm] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useLockBodyScroll(open);

  const distance = Number(distanceKm.replace(",", "."));
  const duration = Number(durationMinutes.replace(",", "."));
  const hasValidInputs = distance > 0 && duration > 0;
  const pace = hasValidInputs ? duration / distance : null;

  function reset() {
    setActivity("RUN");
    setDistanceKm("");
    setDurationMinutes("");
    setError(null);
  }

  async function handleSubmit() {
    if (!hasValidInputs) {
      setError("Informe distância e duração maiores que zero.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/workout-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: toDateKey(new Date()),
          type: "CARDIO",
          workoutName: ACTIVITY_LABELS[activity],
          cardioActivity: activity,
          distanceKm: distance,
          durationMinutes: duration,
          paceMinPerKm: pace,
          source: "MANUAL",
        }),
      });
      if (!res.ok) {
        setError("Não consegui salvar. Tente de novo.");
        setSaving(false);
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      setError("Não consegui conectar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-[18px] border border-line bg-panel px-4.5 py-3.5 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(198,255,61,0.14)" }}>
          <Footprints size={16} strokeWidth={2.2} color="var(--accent)" />
        </div>
        <div>
          <div className="text-sm font-semibold text-chalk">Corrida ou caminhada</div>
          <div className="text-[12px] text-dim">Registrar uma sessão de cardio</div>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-[420px] rounded-t-3xl border-t border-line bg-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Registrar cardio</h3>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full bg-track text-dim">
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              {(["RUN", "WALK"] as CardioActivity[]).map((key) => {
                const active = activity === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActivity(key)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border px-4 py-3 text-sm font-semibold"
                    style={{
                      borderColor: active ? "var(--accent)" : "var(--line)",
                      background: active ? "rgba(198,255,61,0.08)" : "var(--track)",
                      color: active ? "var(--accent)" : "var(--chalk)",
                    }}
                  >
                    {active && <Check size={14} strokeWidth={2.6} />}
                    {ACTIVITY_LABELS[key]}
                  </button>
                );
              })}
            </div>

            <div className="mb-3 flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-dim">Distância (km)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="5,0"
                  className="w-full rounded-2xl border border-line bg-track px-4 py-3.5 text-[15px] outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-dim">Duração (min)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="30"
                  className="w-full rounded-2xl border border-line bg-track px-4 py-3.5 text-[15px] outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between rounded-2xl border border-line bg-track px-4 py-3">
              <span className="text-[12px] font-semibold text-dim">Ritmo médio</span>
              <span className="font-display text-sm font-bold">{formatPace(pace)}</span>
            </div>

            {error && <p className="mb-3 text-center text-[13px] font-semibold text-sodium">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={saving || !hasValidInputs}
              className="font-display w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-[#0B0B0C] disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
