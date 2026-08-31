"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, FlaskConical, Watch, ImageIcon, Camera } from "lucide-react";
import { toDateKey } from "@/lib/date";
import { useLockBodyScroll } from "@/lib/hooks/useLockBodyScroll";
import { useCameraStream } from "@/lib/useCameraStream";

type Stage = "idle" | "scanning" | "result" | "error";
type CardioActivity = "RUN" | "WALK";

type CardioResult = {
  activityType: CardioActivity;
  distanceKm: number;
  durationMinutes: number;
  paceMinPerKm: number;
  caloriesBurned: number;
  explanation?: string;
};

const EMPTY_RESULT: CardioResult = { activityType: "RUN", distanceKm: 0, durationMinutes: 0, paceMinPerKm: 0, caloriesBurned: 0 };

const ACTIVITY_LABELS: Record<CardioActivity, string> = { RUN: "Corrida", WALK: "Caminhada" };

const MOCK_PHOTO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#111214" />
  <rect x="90" y="60" width="220" height="280" rx="36" fill="#1c1d20" stroke="#3a3c3f" stroke-width="4" />
  <rect x="112" y="90" width="176" height="220" rx="18" fill="#000000" />
  <text x="200" y="140" font-family="Arial" font-size="20" fill="#8fe36a" text-anchor="middle">Corrida finalizada</text>
  <text x="200" y="195" font-family="Arial" font-size="42" font-weight="bold" fill="#ffffff" text-anchor="middle">5.20 km</text>
  <text x="200" y="245" font-family="Arial" font-size="30" font-weight="bold" fill="#ffffff" text-anchor="middle">28:40</text>
  <text x="200" y="270" font-family="Arial" font-size="14" fill="#9a9aa0" text-anchor="middle">5:30 /km</text>
  <text x="200" y="305" font-family="Arial" font-size="26" font-weight="bold" fill="#ff6a3d" text-anchor="middle">340 kcal</text>
</svg>`.trim();

const MOCK_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(MOCK_PHOTO_SVG)}`;

const MOCK_RESULT: CardioResult = {
  activityType: "RUN",
  distanceKm: 5.2,
  durationMinutes: 28.7,
  paceMinPerKm: 5.5,
  caloriesBurned: 340,
  explanation: "Valores lidos diretamente da tela de resumo do relógio.",
};

function formatPace(paceMinPerKm: number): string {
  if (!Number.isFinite(paceMinPerKm) || paceMinPerKm <= 0) return "—";
  const totalSeconds = Math.round(paceMinPerKm * 60);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}

export function CardioScanFlow() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [result, setResult] = useState<CardioResult>(EMPTY_RESULT);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { videoRef, ready: cameraReady, error: cameraError, capture } = useCameraStream(open && stage === "idle");
  useLockBodyScroll(open);

  function reset() {
    setStage("idle");
    setPhotoPreview(null);
    setResult(EMPTY_RESULT);
  }

  function handleCloseAll() {
    reset();
    setOpen(false);
  }

  function loadMock() {
    setPhotoPreview(MOCK_PHOTO);
    setResult(MOCK_RESULT);
    setStage("result");
  }

  async function analyze(data: string, mediaType: string, preview: string) {
    setPhotoPreview(preview);
    setStage("scanning");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [{ data, mediaType }], mode: "cardio", dayTotals: {} }),
      });
      const json = await res.json();

      if (!res.ok || json.type !== "estimate") {
        setErrorMessage(json.error ?? "Não consegui ler os dados dessa foto.");
        setStage("error");
        return;
      }

      const activityType: CardioActivity = json.data.activityType === "WALK" ? "WALK" : "RUN";
      setResult({ ...EMPTY_RESULT, ...json.data, activityType });
      setStage("result");
    } catch {
      setErrorMessage("Não consegui conectar à API. Tente novamente.");
      setStage("error");
    }
  }

  function handleCapture() {
    const shot = capture();
    if (!shot) return;
    analyze(shot.data, shot.mediaType, shot.dataUrl);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [prefix, data] = result.split(",");
      const mediaType = prefix.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
      analyze(data, mediaType, result);
    };
    reader.readAsDataURL(file);
  }

  function updateNumeric(field: "distanceKm" | "durationMinutes", value: string) {
    const parsed = parseFloat(value) || 0;
    setResult((r) => {
      const next = { ...r, [field]: parsed };
      const pace = next.distanceKm > 0 ? next.durationMinutes / next.distanceKm : 0;
      return { ...next, paceMinPerKm: pace };
    });
  }

  async function handleConfirm() {
    setSaving(true);
    await fetch("/api/workout-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: toDateKey(new Date()),
        type: "CARDIO",
        workoutName: ACTIVITY_LABELS[result.activityType],
        cardioActivity: result.activityType,
        distanceKm: result.distanceKm,
        durationMinutes: result.durationMinutes,
        paceMinPerKm: result.paceMinPerKm,
        caloriesBurned: result.caloriesBurned || undefined,
        source: "PHOTO",
        photo: photoPreview,
      }),
    });
    setSaving(false);
    router.refresh();
    handleCloseAll();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Registrar cardio por foto"
        className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-line bg-panel"
      >
        <Camera size={18} strokeWidth={2.2} color="var(--accent)" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-[480px] flex-col bg-bg">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {stage === "idle" && (
        <div className="relative flex-1 bg-black">
          {!cameraError && (
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          )}
          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-dim">Iniciando câmera...</div>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-sm text-dim">
              <span>Não consegui acessar a câmera. Você pode escolher uma foto da galeria.</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full bg-panel px-4 py-2 text-[13px] font-semibold text-accent"
              >
                <ImageIcon size={14} strokeWidth={2} />
                Escolher foto
              </button>
            </div>
          )}
          <div className="absolute inset-0 flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <button
                onClick={handleCloseAll}
                aria-label="Fechar"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <X size={18} strokeWidth={2} />
              </button>
              <div className="rounded-full bg-black/50 px-4 py-2 text-[13px] font-semibold text-white">Foto do relógio ou Strava</div>
              <div className="w-10" />
            </div>
            <div className="flex flex-col items-center gap-3.5 pb-6">
              {!cameraError && (
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Escolher da galeria"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white"
                  >
                    <ImageIcon size={18} strokeWidth={2} />
                  </button>
                  <button
                    onClick={handleCapture}
                    disabled={!cameraReady}
                    aria-label="Capturar foto"
                    className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-white disabled:opacity-50"
                  >
                    <span className="block h-[60px] w-[60px] rounded-full bg-accent" />
                  </button>
                  <div className="w-11" />
                </div>
              )}
              <p className="text-[11px] font-medium text-white/70">
                Tire uma foto do relógio ou escolha um print do Strava na galeria
              </p>
              {process.env.NODE_ENV !== "production" && (
                <button
                  onClick={loadMock}
                  className="flex items-center gap-1.5 rounded-full bg-black/50 px-3.5 py-1.5 text-[12px] font-semibold text-white"
                >
                  <FlaskConical size={13} strokeWidth={2} />
                  Testar com exemplo (sem foto)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {stage === "scanning" && (
        <div className="relative flex-1 bg-black">
          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Foto do relógio" className="h-full w-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="font-display text-base font-bold text-white">Lendo o relógio...</div>
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
            <div className="font-display text-lg font-bold">Corrida detectada</div>
          </div>

          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Foto do relógio" className="mb-4 h-40 w-full rounded-2xl object-cover" />
          )}

          <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-panel px-3.5 py-2.5">
            <Watch size={14} strokeWidth={2} color="var(--accent)" />
            <span className="text-xs font-semibold text-accent">Identificado automaticamente — edite se precisar</span>
          </div>

          <div className="mb-4 flex gap-2">
            {(["RUN", "WALK"] as CardioActivity[]).map((key) => {
              const active = result.activityType === key;
              return (
                <button
                  key={key}
                  onClick={() => setResult((r) => ({ ...r, activityType: key }))}
                  className="flex-1 rounded-xl border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--line)",
                    background: active ? "rgba(198,255,61,0.08)" : "var(--panel)",
                    color: active ? "var(--accent)" : "var(--chalk)",
                  }}
                >
                  {ACTIVITY_LABELS[key]}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-line bg-panel px-3.5 py-3">
              <div className="mb-1.5 text-[11px] text-dim">Distância</div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={result.distanceKm}
                  onChange={(e) => updateNumeric("distanceKm", e.target.value)}
                  className="font-display w-16 bg-transparent text-lg font-bold outline-none"
                />
                <span className="text-xs text-dim">km</span>
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-panel px-3.5 py-3">
              <div className="mb-1.5 text-[11px] text-dim">Duração</div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={result.durationMinutes}
                  onChange={(e) => updateNumeric("durationMinutes", e.target.value)}
                  className="font-display w-16 bg-transparent text-lg font-bold outline-none"
                />
                <span className="text-xs text-dim">min</span>
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-panel px-3.5 py-3">
              <div className="mb-1.5 text-[11px] text-dim">Ritmo</div>
              <div className="font-display text-lg font-bold">{formatPace(result.paceMinPerKm)}</div>
            </div>
            <div className="rounded-2xl border border-line bg-panel px-3.5 py-3">
              <div className="mb-1.5 text-[11px] text-dim">Calorias</div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={result.caloriesBurned}
                  onChange={(e) => setResult((r) => ({ ...r, caloriesBurned: parseFloat(e.target.value) || 0 }))}
                  className="font-display w-16 bg-transparent text-lg font-bold outline-none"
                  style={{ color: "var(--protein)" }}
                />
                <span className="text-xs text-dim">kcal</span>
              </div>
              {!result.caloriesBurned && <div className="mt-0.5 text-[10px] text-dim">calculamos pra você</div>}
            </div>
          </div>

          {result.explanation && <p className="mt-4 text-[13px] leading-snug text-dim">{result.explanation}</p>}

          <button
            onClick={handleConfirm}
            disabled={saving}
            className="font-display mt-5 w-full rounded-xl bg-accent py-4 text-[15px] font-bold text-[#0B0B0C] disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Registrar cardio"}
          </button>
        </div>
      )}
    </div>
  );
}
