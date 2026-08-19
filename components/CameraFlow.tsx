"use client";

import { useRef, useState } from "react";
import { X, Sparkles, FlaskConical } from "lucide-react";
import { toDateKey } from "@/lib/date";
import { EMPTY_TOTALS } from "@/lib/targets";
import { EMPTY_MEAL_INPUT, type MealInput } from "@/lib/types";

type Stage = "idle" | "scanning" | "result" | "error";

const MOCK_PHOTO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#2a2b2e" />
  <circle cx="200" cy="200" r="170" fill="#eceae4" />
  <circle cx="200" cy="200" r="150" fill="#f7f5f0" />
  <ellipse cx="150" cy="170" rx="70" ry="55" fill="#f3ecd8" />
  <ellipse cx="150" cy="170" rx="70" ry="55" fill="none" stroke="#e2d8b8" stroke-width="2" />
  <ellipse cx="255" cy="185" rx="55" ry="45" fill="#8a5a3c" />
  <ellipse cx="255" cy="185" rx="55" ry="45" fill="none" stroke="#6e4530" stroke-width="2" />
  <ellipse cx="180" cy="270" rx="60" ry="42" fill="#4f7d3a" />
  <ellipse cx="150" cy="258" rx="18" ry="12" fill="#6fae4a" />
  <ellipse cx="195" cy="280" rx="16" ry="11" fill="#6fae4a" />
  <ellipse cx="210" cy="255" rx="14" ry="10" fill="#e2483d" />
  <ellipse cx="270" cy="270" rx="45" ry="32" fill="#c99257" />
  <ellipse cx="270" cy="270" rx="45" ry="32" fill="none" stroke="#a5713a" stroke-width="2" />
</svg>`.trim();

const MOCK_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(MOCK_PHOTO_SVG)}`;

const MOCK_MEAL: MealInput = {
  name: "Arroz, feijão e salada",
  emoji: "🍚",
  calories: 480,
  protein: 18,
  carbs: 72,
  fat: 12,
  sodium: 620,
  sugar: 4,
  photo: MOCK_PHOTO,
  items: [
    { name: "Arroz branco", portion: "150g (1 concha média)", calories: 195 },
    { name: "Feijão carioca", portion: "100g (1 concha)", calories: 130 },
    { name: "Salada verde (alface e tomate)", portion: "80g", calories: 25 },
    { name: "Azeite de tempero", portion: "1 colher de chá", calories: 40 },
    { name: "Frango grelhado", portion: "90g", calories: 90 },
  ],
  explanation:
    "Estimativa baseada em porções médias de um prato feito brasileiro: uma concha de arroz, uma de feijão, salada crua à vontade e uma porção de proteína magra.",
};

const EDITABLE_FIELDS: { key: keyof MealInput; label: string; unit: string; color: string }[] = [
  { key: "calories", label: "Calorias", unit: "kcal", color: "var(--accent)" },
  { key: "protein", label: "Proteína", unit: "g", color: "var(--protein)" },
  { key: "fat", label: "Gordura", unit: "g", color: "var(--fat)" },
  { key: "carbs", label: "Carboidrato", unit: "g", color: "var(--carb)" },
  { key: "sodium", label: "Sódio", unit: "mg", color: "var(--sodium)" },
  { key: "sugar", label: "Açúcar", unit: "g", color: "var(--sugar)" },
];

export function CameraFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [meal, setMeal] = useState<MealInput>(EMPTY_MEAL_INPUT);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function reset() {
    setStage("idle");
    setPhotoPreview(null);
    setMeal(EMPTY_MEAL_INPUT);
  }

  function handleCloseAll() {
    reset();
    onClose();
  }

  function loadMock() {
    setPhotoPreview(MOCK_PHOTO);
    setMeal(MOCK_MEAL);
    setStage("result");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const [prefix, data] = result.split(",");
      const mediaType = prefix.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
      setPhotoPreview(result);
      setStage("scanning");

      try {
        const dateKey = toDateKey(new Date());
        const mealsRes = await fetch(`/api/meals?date=${dateKey}`);
        const mealsJson = await mealsRes.json();
        const dayTotals = (mealsJson.meals ?? []).reduce(
          (acc: typeof EMPTY_TOTALS, m: MealInput) => ({
            calories: acc.calories + m.calories,
            protein: acc.protein + m.protein,
            carbs: acc.carbs + m.carbs,
            fat: acc.fat + m.fat,
            sodium: acc.sodium + m.sodium,
            sugar: acc.sugar + m.sugar,
          }),
          EMPTY_TOTALS,
        );

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: { data, mediaType }, dayTotals }),
        });
        const json = await res.json();

        if (!res.ok || json.type !== "estimate") {
          setErrorMessage(json.error ?? "Não consegui identificar a refeição nessa foto.");
          setStage("error");
          return;
        }

        setMeal({ ...EMPTY_MEAL_INPUT, ...json.data });
        setStage("result");
      } catch {
        setErrorMessage("Não consegui conectar à API. Tente novamente.");
        setStage("error");
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleConfirm() {
    await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: toDateKey(new Date()), ...meal, photo: photoPreview }),
    });
    window.dispatchEvent(new Event("nutritracker:meal-saved"));
    handleCloseAll();
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-[480px] flex-col bg-bg">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {stage === "idle" && (
        <div className="relative flex-1 bg-black">
          <div className="absolute inset-0 flex items-center justify-center text-sm text-dim">Visor da câmera</div>
          <div className="absolute inset-0 flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <button
                onClick={handleCloseAll}
                aria-label="Fechar"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <X size={18} strokeWidth={2} />
              </button>
              <div className="rounded-full bg-black/50 px-4 py-2 text-[13px] font-semibold text-white">Aponte para o prato</div>
              <div className="w-10" />
            </div>
            <div className="flex flex-col items-center gap-3.5 pb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Capturar foto"
                className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-white"
              >
                <span className="block h-[60px] w-[60px] rounded-full bg-accent" />
              </button>
              <button
                onClick={loadMock}
                className="flex items-center gap-1.5 rounded-full bg-black/50 px-3.5 py-1.5 text-[12px] font-semibold text-white"
              >
                <FlaskConical size={13} strokeWidth={2} />
                Testar com exemplo (sem foto)
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === "scanning" && (
        <div className="relative flex-1 bg-black">
          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Foto do prato" className="h-full w-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="font-display text-base font-bold text-white">Analisando refeição...</div>
            <div className="flex gap-1.5">
              <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-accent" />
              <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-accent [animation-delay:0.2s]" />
              <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-accent [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      )}

      {stage === "error" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-sm text-dim">{errorMessage}</p>
          <button onClick={reset} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-[#0B0B0C]">
            Tentar de novo
          </button>
          <button onClick={handleCloseAll} className="text-sm text-dim underline">
            Fechar
          </button>
        </div>
      )}

      {stage === "result" && (
        <div className="flex-1 overflow-y-auto p-5 pb-8">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={reset}
              aria-label="Descartar"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel"
            >
              <X size={16} strokeWidth={2} />
            </button>
            <div className="font-display text-lg font-bold">Refeição detectada</div>
          </div>

          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Prato escaneado" className="mb-4 h-40 w-full rounded-2xl object-cover" />
          ) : (
            <div className="mb-4 flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-panel">
              <span className="text-3xl">{meal.emoji}</span>
              <span className="text-[11px] font-semibold text-dim">Exemplo de teste, sem foto real</span>
            </div>
          )}

          <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-panel px-3.5 py-2.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-xs font-semibold text-accent">Identificado automaticamente — edite se precisar</span>
          </div>

          <label className="mb-1.5 block text-xs text-dim">Nome do prato</label>
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-panel px-3">
            <input
              type="text"
              value={meal.emoji}
              onChange={(e) => setMeal((m) => ({ ...m, emoji: e.target.value }))}
              className="w-10 bg-transparent py-3.5 text-center text-lg outline-none"
            />
            <input
              type="text"
              value={meal.name}
              onChange={(e) => setMeal((m) => ({ ...m, name: e.target.value }))}
              className="flex-1 bg-transparent py-3.5 text-[15px] font-semibold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {EDITABLE_FIELDS.map((f) => (
              <div key={f.key} className="rounded-2xl border border-line bg-panel px-3.5 py-3">
                <div className="mb-1.5 text-[11px] text-dim">{f.label}</div>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={meal[f.key] as number}
                    onChange={(e) => setMeal((m) => ({ ...m, [f.key]: parseFloat(e.target.value) || 0 }))}
                    className="font-display w-16 bg-transparent text-lg font-bold outline-none"
                    style={{ color: f.color }}
                  />
                  <span className="text-xs text-dim">{f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {(meal.explanation || (meal.items && meal.items.length > 0)) && (
            <div className="mt-5 rounded-2xl border border-line bg-panel p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={14} strokeWidth={2} color="var(--accent)" />
                <span className="text-[13px] font-bold">Como identificamos esse prato</span>
              </div>

              {meal.explanation && <p className="mb-3 text-[13px] leading-snug text-dim">{meal.explanation}</p>}

              {meal.items && meal.items.length > 0 && (
                <div className="flex flex-col gap-2">
                  {meal.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-track px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold">{item.name}</div>
                        <div className="mt-0.5 text-[11px] text-dim">{item.portion}</div>
                      </div>
                      <div className="num shrink-0 text-[13px] font-bold text-dim">{Math.round(item.calories)} kcal</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleConfirm}
            className="font-display mt-5 w-full rounded-xl bg-accent py-4 text-[15px] font-bold text-[#0B0B0C]"
          >
            Adicionar à refeição
          </button>
        </div>
      )}
    </div>
  );
}
