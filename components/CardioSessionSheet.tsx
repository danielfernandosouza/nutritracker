"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Footprints, X, Check, Pencil, Trash2, Flame } from "lucide-react";
import { useLockBodyScroll } from "@/lib/hooks/useLockBodyScroll";
import { classifyCardioIntensity, type CardioActivity, type CardioIntensity } from "@/lib/cardio-burn";
import { formatDateLabel } from "@/lib/date";

type CardioSession = {
  id: string;
  date: string;
  cardioActivity: string | null;
  distanceKm: number | null;
  durationMinutes: number | null;
  paceMinPerKm: number | null;
  caloriesBurned: number | null;
  routePolyline: string | null;
};

const ACTIVITY_LABELS: Record<string, string> = { RUN: "Corrida", WALK: "Caminhada", HIKE: "Trilha" };

const INTENSITY_LABELS: Record<CardioIntensity, string> = { leve: "Leve", moderada: "Moderada", intensa: "Intensa" };
const INTENSITY_COLORS: Record<CardioIntensity, string> = {
  leve: "var(--dim)",
  moderada: "var(--accent)",
  intensa: "var(--sodium)",
};

function formatPace(paceMinPerKm: number | null): string {
  if (paceMinPerKm === null || !Number.isFinite(paceMinPerKm)) return "—";
  const totalSeconds = Math.round(paceMinPerKm * 60);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}

export function CardioSessionSheet({ session, onClose }: { session: CardioSession; onClose: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [activity, setActivity] = useState<CardioActivity>((session.cardioActivity as CardioActivity) || "RUN");
  const [distanceKm, setDistanceKm] = useState(session.distanceKm != null ? String(session.distanceKm) : "");
  const [durationMinutes, setDurationMinutes] = useState(session.durationMinutes != null ? String(session.durationMinutes) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useLockBodyScroll(true);

  const distance = Number(distanceKm.replace(",", "."));
  const duration = Number(durationMinutes.replace(",", "."));
  const hasValidInputs = distance > 0 && duration > 0;
  const editedPace = hasValidInputs ? duration / distance : null;

  const intensity = session.paceMinPerKm != null ? classifyCardioIntensity((session.cardioActivity as CardioActivity) || "RUN", session.paceMinPerKm) : null;

  async function handleSave() {
    if (!hasValidInputs) {
      setError("Informe distância e duração maiores que zero.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workout-log/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutName: ACTIVITY_LABELS[activity],
          cardioActivity: activity,
          distanceKm: distance,
          durationMinutes: duration,
        }),
      });
      if (!res.ok) {
        setError("Não consegui salvar. Tente de novo.");
        setSaving(false);
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Não consegui conectar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workout-log/${session.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Não consegui excluir. Tente de novo.");
        setSaving(false);
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Não consegui conectar. Tente de novo.");
      setSaving(false);
    }
  }

  const d = new Date(`${session.date}T00:00:00`);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[420px] rounded-t-3xl border-t border-line bg-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-bold">{editing ? "Editar sessão" : "Detalhes da sessão"}</h3>
          <button onClick={onClose} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full bg-track text-dim">
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        {editing ? (
          <>
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
                  className="w-full rounded-2xl border border-line bg-track px-4 py-3.5 text-[15px] outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between rounded-2xl border border-line bg-track px-4 py-3">
              <span className="text-[12px] font-semibold text-dim">Ritmo médio</span>
              <span className="font-display text-sm font-bold">{formatPace(editedPace)}</span>
            </div>

            {error && <p className="mb-3 text-center text-[13px] font-semibold text-sodium">{error}</p>}

            <div className="flex gap-2.5">
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-line py-3.5 text-sm font-bold text-dim disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasValidInputs}
                className="font-display flex-[2] rounded-xl bg-accent py-3.5 text-sm font-bold text-[#0B0B0C] disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(198,255,61,0.14)" }}>
                <Footprints size={18} strokeWidth={2.2} color="var(--accent)" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-dim">{formatDateLabel(d)}</div>
                <div className="font-display text-[17px] font-bold">{ACTIVITY_LABELS[session.cardioActivity ?? "RUN"]}</div>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-line bg-track px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-dim">Distância</div>
                <div className="font-display mt-0.5 text-base font-bold">{session.distanceKm ? `${session.distanceKm.toFixed(1)} km` : "—"}</div>
              </div>
              <div className="rounded-2xl border border-line bg-track px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-dim">Duração</div>
                <div className="font-display mt-0.5 text-base font-bold">{session.durationMinutes ? `${Math.round(session.durationMinutes)} min` : "—"}</div>
              </div>
              <div className="rounded-2xl border border-line bg-track px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-dim">Ritmo</div>
                <div className="font-display mt-0.5 text-base font-bold">{formatPace(session.paceMinPerKm)}</div>
              </div>
              <div className="rounded-2xl border border-line bg-track px-4 py-3">
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-dim">
                  <Flame size={11} strokeWidth={2.4} />
                  Calorias
                </div>
                <div className="font-display mt-0.5 text-base font-bold">
                  {session.caloriesBurned ? `~${Math.round(session.caloriesBurned)} kcal` : "—"}
                </div>
              </div>
            </div>

            {intensity && (
              <div className="mb-5 flex items-center justify-between rounded-2xl border border-line px-4 py-3" style={{ borderColor: INTENSITY_COLORS[intensity] }}>
                <span className="text-[12px] font-semibold text-dim">Intensidade</span>
                <span className="text-sm font-bold" style={{ color: INTENSITY_COLORS[intensity] }}>
                  {INTENSITY_LABELS[intensity]}
                </span>
              </div>
            )}

            {session.routePolyline && (
              <div className="mb-5 rounded-2xl border border-line bg-track p-4 text-center text-[12px] text-dim">
                Mapa da rota (via Strava) em breve
              </div>
            )}

            {error && <p className="mb-3 text-center text-[13px] font-semibold text-sodium">{error}</p>}

            <div className="flex gap-2.5">
              <button
                onClick={handleDelete}
                disabled={saving}
                aria-label="Excluir"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line text-sodium disabled:opacity-60"
              >
                <Trash2 size={16} strokeWidth={2.2} />
              </button>
              <button
                onClick={() => setEditing(true)}
                disabled={saving}
                className="font-display flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-3.5 text-sm font-bold text-[#0B0B0C] disabled:opacity-60"
              >
                <Pencil size={14} strokeWidth={2.4} />
                Editar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
