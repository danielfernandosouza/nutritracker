"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Settings, X, Minus, Plus, Check } from "lucide-react";
import { useLockBodyScroll } from "@/lib/hooks/useLockBodyScroll";
import { SPLIT_STYLE_LABELS, EQUIPMENT_PREFERENCE_LABELS, type SplitStyle, type EquipmentPreference } from "@/lib/workout-generator";
import { WEEKDAY_LABELS_FULL, formatWeekdayShort } from "@/lib/date";

type ProfileForSettings = {
  name: string | null;
  sex: string;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  goal: string;
  exerciseNotes: string | null;
  mealsPerDay: number | null;
  daysPerWeek: number | null;
  splitStyle: string | null;
  equipmentPreference: string | null;
  favoriteMuscleGroups: string[];
  restWeekdays: number[];
};

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

export function WorkoutSettingsSheet({ profile }: { profile: ProfileForSettings }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(profile.daysPerWeek ?? 4);
  const [splitStyle, setSplitStyle] = useState<SplitStyle>((profile.splitStyle as SplitStyle) ?? "push_pull_legs");
  const [equipmentPreference, setEquipmentPreference] = useState<EquipmentPreference>(
    (profile.equipmentPreference as EquipmentPreference) ?? "machines",
  );
  const [restWeekdays, setRestWeekdays] = useState<number[]>(profile.restWeekdays ?? []);
  useLockBodyScroll(open);

  const availableDays = 7 - restWeekdays.length;
  const cappedDaysPerWeek = Math.min(daysPerWeek, Math.max(availableDays, 1));

  function toggleRestDay(day: number) {
    setRestWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          daysPerWeek: cappedDaysPerWeek,
          splitStyle,
          equipmentPreference,
          restWeekdays,
        }),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Configurar treino"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel"
      >
        <Settings size={16} strokeWidth={2} color="var(--dim)" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="max-h-[88vh] w-full max-w-[420px] overflow-y-auto rounded-t-3xl border-t border-line bg-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Configurar treino</h3>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="flex h-8 w-8 items-center justify-center rounded-full bg-track text-dim">
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>

            <div className="mb-5">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dim">Dias por semana</div>
              <div className="flex items-center justify-center gap-5 rounded-2xl border border-line bg-track py-3.5">
                <button
                  onClick={() => setDaysPerWeek((d) => Math.max(1, d - 1))}
                  aria-label="Diminuir dias"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-panel"
                >
                  <Minus size={15} strokeWidth={2.4} />
                </button>
                <span className="font-display w-8 text-center text-2xl font-bold">{cappedDaysPerWeek}</span>
                <button
                  onClick={() => setDaysPerWeek((d) => Math.min(7, d + 1))}
                  aria-label="Aumentar dias"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-panel"
                >
                  <Plus size={15} strokeWidth={2.4} />
                </button>
              </div>
              {daysPerWeek > availableDays && (
                <p className="mt-1.5 text-center text-[11px] text-dim">
                  Limitado a {availableDays} {availableDays === 1 ? "dia disponível" : "dias disponíveis"} pelos dias de descanso marcados abaixo.
                </p>
              )}
            </div>

            <div className="mb-5">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dim">Divisão de treino</div>
              <div className="flex flex-col gap-2">
                {(Object.keys(SPLIT_STYLE_LABELS) as SplitStyle[]).map((key) => {
                  const active = splitStyle === key;
                  const info = SPLIT_STYLE_LABELS[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setSplitStyle(key)}
                      className="flex items-center justify-between rounded-2xl border px-4 py-3 text-left"
                      style={{
                        borderColor: active ? "var(--accent)" : "var(--line)",
                        background: active ? "rgba(198,255,61,0.08)" : "var(--track)",
                      }}
                    >
                      <div>
                        <div className="text-sm font-semibold" style={{ color: active ? "var(--accent)" : "var(--chalk)" }}>
                          {info.label}
                        </div>
                        <div className="mt-0.5 text-[11px] text-dim">{info.description}</div>
                      </div>
                      {active && <Check size={16} strokeWidth={2.4} color="var(--accent)" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dim">Equipamento</div>
              <div className="flex flex-col gap-2">
                {(Object.keys(EQUIPMENT_PREFERENCE_LABELS) as EquipmentPreference[]).map((key) => {
                  const active = equipmentPreference === key;
                  const info = EQUIPMENT_PREFERENCE_LABELS[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setEquipmentPreference(key)}
                      className="flex items-center justify-between rounded-2xl border px-4 py-3 text-left"
                      style={{
                        borderColor: active ? "var(--accent)" : "var(--line)",
                        background: active ? "rgba(198,255,61,0.08)" : "var(--track)",
                      }}
                    >
                      <div>
                        <div className="text-sm font-semibold" style={{ color: active ? "var(--accent)" : "var(--chalk)" }}>
                          {info.label}
                        </div>
                        <div className="mt-0.5 text-[11px] text-dim">{info.description}</div>
                      </div>
                      {active && <Check size={16} strokeWidth={2.4} color="var(--accent)" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dim">Dias de descanso fixos</div>
              <p className="mb-2.5 text-[12px] text-dim">Esses dias nunca recebem treino, mesmo que caibam na distribuição automática.</p>
              <div className="flex items-center justify-between gap-1.5">
                {WEEKDAYS.map((day) => {
                  const active = restWeekdays.includes(day);
                  const d = new Date();
                  d.setDate(d.getDate() - d.getDay() + day);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleRestDay(day)}
                      aria-label={WEEKDAY_LABELS_FULL[day]}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-[12px] font-bold"
                      style={{
                        background: active ? "var(--sodium)" : "var(--track)",
                        color: active ? "#0B0B0C" : "var(--dim)",
                        border: active ? "none" : "1.5px solid var(--line)",
                      }}
                    >
                      {formatWeekdayShort(d)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="font-display w-full rounded-xl bg-accent py-3.5 text-sm font-bold text-[#0B0B0C] disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar e atualizar plano"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
