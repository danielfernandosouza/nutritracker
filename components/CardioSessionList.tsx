"use client";

import { useState } from "react";
import { Footprints } from "lucide-react";
import { formatDateLabel } from "@/lib/date";
import { CardioSessionSheet } from "@/components/CardioSessionSheet";

const CARDIO_ACTIVITY_LABELS: Record<string, string> = { RUN: "Corrida", WALK: "Caminhada", HIKE: "Trilha" };

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

function formatPace(paceMinPerKm: number | null): string {
  if (paceMinPerKm === null || !Number.isFinite(paceMinPerKm)) return "—";
  const totalSeconds = Math.round(paceMinPerKm * 60);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}

export function CardioSessionList({ sessions }: { sessions: CardioSession[] }) {
  const [selected, setSelected] = useState<CardioSession | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[18px] border border-dashed border-line px-4.5 py-8 text-center">
        <Footprints size={22} strokeWidth={1.8} color="var(--dim)" />
        <p className="text-[13px] text-dim">Nenhuma corrida ou caminhada registrada ainda.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {sessions.map((s) => {
          const d = new Date(`${s.date}T00:00:00`);
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="flex items-center gap-3 rounded-[18px] border border-line bg-panel px-4.5 py-3.5 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(198,255,61,0.14)" }}>
                <Footprints size={16} strokeWidth={2.2} color="var(--accent)" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-dim">
                  {formatDateLabel(d)}
                </div>
                <div className="font-display mt-0.5 text-[15px] font-bold">
                  {CARDIO_ACTIVITY_LABELS[s.cardioActivity ?? "RUN"]}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                <span className="text-[13px] font-bold text-chalk">
                  {s.distanceKm ? `${s.distanceKm.toFixed(1)} km` : "—"}
                </span>
                <span className="text-[11px] text-dim">
                  {formatPace(s.paceMinPerKm)} · {s.durationMinutes ? `${Math.round(s.durationMinutes)} min` : "—"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selected && <CardioSessionSheet session={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
