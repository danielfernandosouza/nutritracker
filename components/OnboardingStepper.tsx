"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ring } from "@/components/Ring";
import { StepIllustration } from "@/components/StepIllustration";
import { MultiChoiceChips } from "@/components/MultiChoiceChips";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  computeTargets,
  computeBMI,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/calculations";
import { MUSCLE_GROUP_LABELS, type MuscleGroup } from "@/lib/exercises";
import { SPLIT_STYLE_LABELS, EQUIPMENT_PREFERENCE_LABELS, type SplitStyle, type EquipmentPreference } from "@/lib/workout-generator";

type FormState = {
  name: string;
  sex: Sex | null;
  age: string;
  heightCm: string;
  weightKg: string;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
  daysPerWeek: string;
  splitStyle: SplitStyle | null;
  equipmentPreference: EquipmentPreference | null;
  favoriteMuscleGroups: MuscleGroup[];
  exerciseNotes: string;
  mealsPerDay: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  sex: null,
  age: "",
  heightCm: "",
  weightKg: "",
  activityLevel: null,
  goal: null,
  daysPerWeek: "",
  splitStyle: null,
  equipmentPreference: null,
  favoriteMuscleGroups: [],
  exerciseNotes: "",
  mealsPerDay: "",
};

const STEP_COUNT = 13; // 0..12 are questions, 13 is the result

function ChoiceCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border px-5 py-4 text-left transition-colors"
      style={{
        borderColor: selected ? "var(--accent)" : "var(--line)",
        background: selected ? "color-mix(in srgb, var(--accent) 14%, var(--panel))" : "var(--panel)",
      }}
    >
      <div className="font-display text-[15px] font-bold">{title}</div>
      {description && <div className="mt-0.5 text-[13px] text-dim">{description}</div>}
    </button>
  );
}

function NumberQuestion({
  unit,
  value,
  onChange,
  placeholder,
  step = 1,
  min = 0,
  onEnter,
}: {
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  step?: number;
  min?: number;
  onEnter?: () => void;
}) {
  function bump(delta: number) {
    const current = parseFloat(value) || 0;
    const next = Math.max(min, Math.round((current + delta) * 10) / 10);
    onChange(String(next));
  }

  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-line bg-panel px-4 py-5">
      <button
        onClick={() => bump(-step)}
        aria-label="Diminuir"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-track text-xl font-bold text-dim"
      >
        −
      </button>
      <div className="flex flex-col items-center">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter?.();
            }
          }}
          placeholder={placeholder}
          autoFocus
          className="font-display w-24 bg-transparent text-center text-3xl font-bold outline-none placeholder:text-dim placeholder:text-xl"
        />
        <span className="mt-0.5 text-xs text-dim">{unit}</span>
      </div>
      <button
        onClick={() => bump(step)}
        aria-label="Aumentar"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-track text-xl font-bold text-accent"
      >
        +
      </button>
    </div>
  );
}

export function OnboardingStepper() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    async function loadExisting() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const json = await res.json();
          const p = json.profile;
          setForm({
            name: p.name ?? "",
            sex: p.sex,
            age: String(p.age),
            heightCm: String(p.heightCm),
            weightKg: String(p.weightKg),
            activityLevel: p.activityLevel,
            goal: p.goal,
            daysPerWeek: p.daysPerWeek ? String(p.daysPerWeek) : "",
            splitStyle: p.splitStyle ?? null,
            equipmentPreference: p.equipmentPreference ?? null,
            favoriteMuscleGroups: p.favoriteMuscleGroups ?? [],
            exerciseNotes: p.exerciseNotes ?? "",
            mealsPerDay: p.mealsPerDay ? String(p.mealsPerDay) : "",
          });
        }
      } catch {
        // sem perfil existente para pré-preencher — segue com o formulário vazio
      } finally {
        setLoadingExisting(false);
      }
    }
    loadExisting();
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function goNext() {
    if (canAdvance[step]) setStep((s) => s + 1);
  }

  const canAdvance: boolean[] = [
    true, // welcome
    form.name.trim().length > 0,
    form.sex !== null,
    Number(form.age) > 0,
    Number(form.heightCm) > 0,
    Number(form.weightKg) > 0,
    form.activityLevel !== null,
    form.goal !== null,
    Number(form.daysPerWeek) > 0,
    form.splitStyle !== null,
    form.equipmentPreference !== null,
    true, // favorite muscle groups optional
    true, // extras optional
  ];

  const profileInput =
    form.sex && form.activityLevel && form.goal && Number(form.age) > 0 && Number(form.heightCm) > 0 && Number(form.weightKg) > 0
      ? {
          sex: form.sex,
          age: Number(form.age),
          heightCm: Number(form.heightCm),
          weightKg: Number(form.weightKg),
          activityLevel: form.activityLevel,
          goal: form.goal,
        }
      : null;

  const targets = profileInput ? computeTargets(profileInput) : null;
  const bmi = profileInput ? computeBMI(profileInput.weightKg, profileInput.heightCm) : null;

  async function handleFinish() {
    if (!profileInput) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileInput,
          name: form.name.trim(),
          exerciseNotes: form.exerciseNotes || undefined,
          mealsPerDay: form.mealsPerDay || undefined,
          daysPerWeek: form.daysPerWeek || undefined,
          splitStyle: form.splitStyle || undefined,
          equipmentPreference: form.equipmentPreference || undefined,
          favoriteMuscleGroups: form.favoriteMuscleGroups,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      router.push("/home");
    } catch {
      setSaving(false);
    }
  }

  if (loadingExisting) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-dim">Carregando...</div>;
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col px-6 pt-8">
      {step < STEP_COUNT && (
        <div className="mb-8 flex shrink-0 gap-1.5">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= step ? "var(--accent)" : "var(--line)" }}
            />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {step === 0 && (
          <div className="flex h-full flex-col justify-center gap-3">
            <StepIllustration variant="welcome" />
            <div className="font-display text-center text-[26px] font-bold">Vamos montar seu perfil</div>
            <p className="text-center text-[15px] leading-relaxed text-dim">
              Algumas perguntas rápidas sobre você — com isso a gente calcula suas metas diárias de calorias e macros,
              personalizadas de verdade, e mostra seu IMC.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Qual seu nome?</div>
            <p className="text-sm text-dim">É assim que a gente vai te chamar dentro do app.</p>
            <StepIllustration variant="name" />
            <input
              type="text"
              inputMode="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  goNext();
                }
              }}
              placeholder="Seu nome"
              autoFocus
              className="w-full rounded-2xl border border-line bg-panel px-5 py-4 text-center text-lg font-semibold outline-none focus:border-accent"
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Qual seu sexo biológico?</div>
            <p className="text-sm text-dim">Usado no cálculo da taxa metabólica basal (fórmula de Mifflin-St Jeor).</p>
            <StepIllustration variant="sex" />
            <div className="flex flex-col gap-3">
              <ChoiceCard selected={form.sex === "M"} title="Masculino" onClick={() => set("sex", "M")} />
              <ChoiceCard selected={form.sex === "F"} title="Feminino" onClick={() => set("sex", "F")} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Qual sua idade?</div>
            <StepIllustration variant="age" />
            <NumberQuestion unit="anos" value={form.age} onChange={(v) => set("age", v)} placeholder="idade" step={1} min={1} onEnter={goNext} />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Qual sua altura?</div>
            <StepIllustration variant="height" />
            <NumberQuestion unit="cm" value={form.heightCm} onChange={(v) => set("heightCm", v)} placeholder="altura" step={1} min={50} onEnter={goNext} />
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Qual seu peso atual?</div>
            <StepIllustration variant="weight" />
            <NumberQuestion unit="kg" value={form.weightKg} onChange={(v) => set("weightKg", v)} placeholder="peso" step={0.5} min={20} onEnter={goNext} />
          </div>
        )}

        {step === 6 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Nível de atividade</div>
            <p className="text-sm text-dim">Conte também treino de academia e esportes, não só o dia a dia.</p>
            <StepIllustration variant="activity" />
            <div className="flex flex-col gap-2.5">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((key) => (
                <ChoiceCard
                  key={key}
                  selected={form.activityLevel === key}
                  title={ACTIVITY_LABELS[key].label}
                  description={ACTIVITY_LABELS[key].description}
                  onClick={() => set("activityLevel", key)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Qual seu objetivo?</div>
            <StepIllustration variant="goal" />
            <div className="flex flex-col gap-2.5">
              {(Object.keys(GOAL_LABELS) as Goal[]).map((key) => (
                <ChoiceCard
                  key={key}
                  selected={form.goal === key}
                  title={GOAL_LABELS[key].label}
                  description={GOAL_LABELS[key].description}
                  onClick={() => set("goal", key)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Quantos dias por semana você quer treinar?</div>
            <StepIllustration variant="days" />
            <NumberQuestion
              unit="dias/semana"
              value={form.daysPerWeek}
              onChange={(v) => set("daysPerWeek", v)}
              placeholder="dias"
              step={1}
              min={1}
              onEnter={goNext}
            />
          </div>
        )}

        {step === 9 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Que estilo de divisão você prefere?</div>
            <StepIllustration variant="split" />
            <div className="flex flex-col gap-2.5">
              {(Object.keys(SPLIT_STYLE_LABELS) as SplitStyle[]).map((key) => (
                <ChoiceCard
                  key={key}
                  selected={form.splitStyle === key}
                  title={SPLIT_STYLE_LABELS[key].label}
                  description={SPLIT_STYLE_LABELS[key].description}
                  onClick={() => set("splitStyle", key)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 10 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Qual equipamento você prefere?</div>
            <StepIllustration variant="equipment" />
            <div className="flex flex-col gap-2.5">
              {(Object.keys(EQUIPMENT_PREFERENCE_LABELS) as EquipmentPreference[]).map((key) => (
                <ChoiceCard
                  key={key}
                  selected={form.equipmentPreference === key}
                  title={EQUIPMENT_PREFERENCE_LABELS[key].label}
                  description={EQUIPMENT_PREFERENCE_LABELS[key].description}
                  onClick={() => set("equipmentPreference", key)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 11 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Algum grupo muscular favorito? (opcional)</div>
            <p className="text-sm text-dim">Esses grupos ganham um exercício extra no seu plano de treino.</p>
            <StepIllustration variant="favorites" />
            <MultiChoiceChips
              options={(Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]).map((key) => ({ value: key, label: MUSCLE_GROUP_LABELS[key] }))}
              selected={form.favoriteMuscleGroups}
              onToggle={(value) =>
                setForm((f) => ({
                  ...f,
                  favoriteMuscleGroups: f.favoriteMuscleGroups.includes(value)
                    ? f.favoriteMuscleGroups.filter((v) => v !== value)
                    : [...f.favoriteMuscleGroups, value],
                }))
              }
            />
          </div>
        )}

        {step === 12 && (
          <div className="flex flex-col gap-4">
            <div className="font-display text-2xl font-bold">Mais alguns detalhes (opcional)</div>
            <StepIllustration variant="extras" />
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-dim">
                Refeições por dia
              </label>
              <input
                type="number"
                value={form.mealsPerDay}
                onChange={(e) => set("mealsPerDay", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    goNext();
                  }
                }}
                placeholder="Quantidade de refeições"
                className="w-full rounded-xl border border-line bg-panel px-3.5 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-dim">
                Restrições ou preferências de treino
              </label>
              <textarea
                value={form.exerciseNotes}
                onChange={(e) => set("exerciseNotes", e.target.value)}
                placeholder="Descreva o que você gosta ou prefere evitar no treino"
                rows={3}
                className="w-full resize-none rounded-xl border border-line bg-panel px-3.5 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
        )}

        {step === 13 && targets && bmi && (
          <div className="flex flex-col gap-5 pb-4">
            <div className="font-display text-2xl font-bold">Suas metas, calculadas</div>

            <div className="flex items-center gap-5 rounded-3xl border border-line bg-panel p-6">
              <Ring value={targets.calories} target={targets.calories} color="var(--accent)" />
              <div>
                <div className="font-display text-[26px] font-bold leading-none">{targets.calories}</div>
                <div className="mt-1 text-[13px] text-dim">kcal por dia</div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-panel p-4">
              <div className="mb-2 text-[13px] font-bold text-dim">Como chegamos nesse número</div>
              <p className="text-[13px] leading-relaxed text-dim">
                Taxa metabólica basal (BMR): <span className="font-semibold text-chalk">{targets.bmr} kcal</span> — energia que
                seu corpo gasta em repouso. Multiplicando pelo seu nível de atividade, o gasto total estimado (TDEE) é{" "}
                <span className="font-semibold text-chalk">{targets.tdee} kcal</span>. Como seu objetivo é{" "}
                <span className="font-semibold text-chalk">{form.goal ? GOAL_LABELS[form.goal].label.toLowerCase() : ""}</span>,
                ajustamos esse valor pra <span className="font-semibold text-accent">{targets.calories} kcal</span>.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="rounded-2xl border border-line bg-panel px-4 py-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Proteína</span>
                  <span className="num font-bold" style={{ color: "var(--protein)" }}>
                    {targets.protein}g
                  </span>
                </div>
                <p className="mt-1 text-xs text-dim">2,2g por kg de peso — prioridade máxima pra preservar músculo</p>
              </div>
              <div className="rounded-2xl border border-line bg-panel px-4 py-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Gordura</span>
                  <span className="num font-bold" style={{ color: "var(--fat)" }}>
                    {targets.fat}g
                  </span>
                </div>
                <p className="mt-1 text-xs text-dim">~25% das calorias diárias</p>
              </div>
              <div className="rounded-2xl border border-line bg-panel px-4 py-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Carboidrato</span>
                  <span className="num font-bold" style={{ color: "var(--carb)" }}>
                    {targets.carbs}g
                  </span>
                </div>
                <p className="mt-1 text-xs text-dim">o restante das calorias, depois de proteína e gordura</p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-panel p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Seu IMC</div>
                  <div className="text-xs text-dim">{bmi.category}</div>
                </div>
                <div className="font-display text-2xl font-bold text-accent">{bmi.value}</div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={saving}
              className="font-display mt-1 rounded-2xl bg-accent py-4 text-center text-base font-bold text-[#0B0B0C] disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Concluir e ir pro app"}
            </button>
          </div>
        )}
      </div>

      {step < STEP_COUNT && (
        <div className="mt-4 flex shrink-0 gap-3 pb-6 pt-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-2xl border border-line py-3.5 text-sm font-bold text-dim"
            >
              Voltar
            </button>
          )}
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance[step]}
            className="font-display flex-[2] rounded-2xl bg-accent py-3.5 text-sm font-bold text-[#0B0B0C] disabled:opacity-40"
          >
            {step === 0 ? "Começar" : "Continuar"}
          </button>
        </div>
      )}
    </div>
  );
}
