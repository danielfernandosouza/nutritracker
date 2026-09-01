"use client";

import { useState } from "react";
import { useLockBodyScroll } from "@/lib/hooks/useLockBodyScroll";
import { VoiceMealButton } from "@/components/VoiceMealButton";
import { EMPTY_MEAL_INPUT, type MealInput } from "@/lib/types";

function Field({
  label,
  value,
  onChange,
  type = "number",
  placeholder = "0",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-dim">{label}</label>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-track px-3 py-2.5 text-sm text-chalk outline-none focus:border-accent"
      />
    </div>
  );
}

export function MealFormSheet({
  open,
  initial,
  onClose,
  onSave,
  error,
  saving,
}: {
  open: boolean;
  initial: MealInput | null;
  onClose: () => void;
  onSave: (input: MealInput) => void;
  /** Mensagem de falha ao salvar — mantém a sheet aberta para o usuário não perder o que digitou. */
  error?: string | null;
  saving?: boolean;
}) {
  const [form, setForm] = useState<
    Record<Exclude<keyof MealInput, "items" | "explanation" | "photo" | "healthScore" | "healthScoreReason">, string>
  >({
    name: "",
    emoji: "🍽️",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    sodium: "",
    sugar: "",
  });
  const [photo, setPhoto] = useState<string | null>(null);
  useLockBodyScroll(open);

  // Reset the form fields whenever the sheet transitions from closed to open,
  // following React's "adjust state during render" pattern instead of an effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const base = initial ?? EMPTY_MEAL_INPUT;
      setForm({
        name: base.name,
        emoji: base.emoji || "🍽️",
        calories: base.calories ? String(base.calories) : "",
        protein: base.protein ? String(base.protein) : "",
        carbs: base.carbs ? String(base.carbs) : "",
        fat: base.fat ? String(base.fat) : "",
        sodium: base.sodium ? String(base.sodium) : "",
        sugar: base.sugar ? String(base.sugar) : "",
      });
      setPhoto(base.photo ?? null);
    }
  }

  if (!open) return null;

  function set(key: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [key]: v }));
  }

  function applyVoiceResult(data: Partial<MealInput>) {
    setForm((f) => ({
      name: data.name ?? f.name,
      emoji: data.emoji ?? f.emoji,
      calories: data.calories !== undefined ? String(data.calories) : f.calories,
      protein: data.protein !== undefined ? String(data.protein) : f.protein,
      carbs: data.carbs !== undefined ? String(data.carbs) : f.carbs,
      fat: data.fat !== undefined ? String(data.fat) : f.fat,
      sodium: data.sodium !== undefined ? String(data.sodium) : f.sodium,
      sugar: data.sugar !== undefined ? String(data.sugar) : f.sugar,
    }));
  }

  function handleSave() {
    if (!form.name || !form.calories) return;
    onSave({
      name: form.name,
      emoji: form.emoji || "🍽️",
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      sodium: parseFloat(form.sodium) || 0,
      sugar: parseFloat(form.sugar) || 0,
      photo,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-[420px] overflow-y-auto rounded-t-2xl border-t border-line bg-panel p-5">
        <h3 className="font-display mb-3.5 text-base font-bold">{initial ? "Editar refeição" : "Adicionar refeição"}</h3>
        {!initial && <VoiceMealButton onResult={applyVoiceResult} />}
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Foto da refeição" className="mb-3.5 h-40 w-full rounded-2xl object-cover" />
        )}
        <div className="mb-3 flex gap-2.5">
          <div className="w-16">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-dim">Emoji</label>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => set("emoji", e.target.value)}
              className="w-full rounded-xl border border-line bg-track px-3 py-2.5 text-center text-lg outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <Field label="Nome da refeição" type="text" placeholder="Ex: Arroz, feijão e frango" value={form.name} onChange={(v) => set("name", v)} />
          </div>
        </div>
        <Field label="Calorias (kcal)" value={form.calories} onChange={(v) => set("calories", v)} />
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Proteína (g)" value={form.protein} onChange={(v) => set("protein", v)} />
          <Field label="Carboidrato (g)" value={form.carbs} onChange={(v) => set("carbs", v)} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Gordura (g)" value={form.fat} onChange={(v) => set("fat", v)} />
          <Field label="Sódio (mg)" value={form.sodium} onChange={(v) => set("sodium", v)} />
        </div>
        <Field label="Açúcar (g)" value={form.sugar} onChange={(v) => set("sugar", v)} />
        {error && <p className="mt-2 text-center text-[13px] font-semibold text-sodium">{error}</p>}
        <div className="mt-2 flex gap-2.5">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-line py-3 text-sm font-bold text-dim disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-display flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-[#0B0B0C] disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
