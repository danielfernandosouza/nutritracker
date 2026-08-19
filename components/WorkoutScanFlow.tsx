"use client";

import { useRef, useState } from "react";
import { X, FlaskConical, Watch, ImageIcon } from "lucide-react";
import { toDateKey } from "@/lib/date";
import { useCameraStream } from "@/lib/useCameraStream";

type Stage = "idle" | "scanning" | "result" | "error";

type WorkoutResult = {
  workoutType: string;
  durationMinutes: number;
  caloriesBurned: number;
  explanation?: string;
};

const EMPTY_RESULT: WorkoutResult = { workoutType: "", durationMinutes: 0, caloriesBurned: 0 };

const MOCK_PHOTO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#111214" />
  <rect x="90" y="60" width="220" height="280" rx="36" fill="#1c1d20" stroke="#3a3c3f" stroke-width="4" />
  <rect x="112" y="90" width="176" height="220" rx="18" fill="#000000" />
  <text x="200" y="150" font-family="Arial" font-size="20" fill="#8fe36a" text-anchor="middle">Treino finalizado</text>
  <text x="200" y="215" font-family="Arial" font-size="52" font-weight="bold" fill="#ffffff" text-anchor="middle">42:18</text>
  <text x="200" y="245" font-family="Arial" font-size="14" fill="#9a9aa0" text-anchor="middle">DURAÇÃO</text>
  <text x="200" y="290" font-family="Arial" font-size="34" font-weight="bold" fill="#ff6a3d" text-anchor="middle">410 kcal</text>
</svg>`.trim();

const MOCK_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(MOCK_PHOTO_SVG)}`;

const MOCK_RESULT: WorkoutResult = {
  workoutType: "Musculação",
  durationMinutes: 42,
  caloriesBurned: 410,
  explanation: "Valores lidos diretamente da tela de resumo do treino no relógio.",
};

export function WorkoutScanFlow({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [stage, setStage] = useState<Stage>("idle");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [result, setResult] = useState<WorkoutResult>(EMPTY_RESULT);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { videoRef, ready: cameraReady, error: cameraError, capture } = useCameraStream(open && stage === "idle");

  if (!open) return null;

  function reset() {
    setStage("idle");
    setPhotoPreview(null);
    setResult(EMPTY_RESULT);
  }

  function handleCloseAll() {
    reset();
    onClose();
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
        body: JSON.stringify({ image: { data, mediaType }, mode: "workout", dayTotals: {} }),
      });
      const json = await res.json();

      if (!res.ok || json.type !== "estimate") {
        setErrorMessage(json.error ?? "Não consegui ler os dados dessa foto.");
        setStage("error");
        return;
      }

      setResult({ ...EMPTY_RESULT, ...json.data });
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

  async function handleConfirm() {
    setSaving(true);
    await fetch("/api/workout-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: toDateKey(new Date()),
        workoutName: result.workoutType || "Treino",
        durationMinutes: result.durationMinutes,
        caloriesBurned: result.caloriesBurned,
        photo: photoPreview,
      }),
    });
    setSaving(false);
    onSaved();
    handleCloseAll();
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-[480px] flex-col bg-bg">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

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
              <div className="rounded-full bg-black/50 px-4 py-2 text-[13px] font-semibold text-white">Foto da tela do relógio</div>
              <div className="w-10" />
            </div>
            <div className="flex flex-col items-center gap-3.5 pb-6">
              {!cameraError && (
                <button
                  onClick={handleCapture}
                  disabled={!cameraReady}
                  aria-label="Capturar foto"
                  className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-4 border-white disabled:opacity-50"
                >
                  <span className="block h-[60px] w-[60px] rounded-full bg-accent" />
                </button>
              )}
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
            <div className="font-display text-lg font-bold">Treino detectado</div>
          </div>

          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Foto do relógio" className="mb-4 h-40 w-full rounded-2xl object-cover" />
          )}

          <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-panel px-3.5 py-2.5">
            <Watch size={14} strokeWidth={2} color="var(--accent)" />
            <span className="text-xs font-semibold text-accent">Identificado automaticamente — edite se precisar</span>
          </div>

          <label className="mb-1.5 block text-xs text-dim">Tipo de treino</label>
          <input
            type="text"
            value={result.workoutType}
            onChange={(e) => setResult((r) => ({ ...r, workoutType: e.target.value }))}
            placeholder="Ex: Musculação"
            className="mb-4 w-full rounded-xl border border-line bg-panel px-3.5 py-3.5 text-[15px] font-semibold outline-none focus:border-accent"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-line bg-panel px-3.5 py-3">
              <div className="mb-1.5 text-[11px] text-dim">Duração</div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={result.durationMinutes}
                  onChange={(e) => setResult((r) => ({ ...r, durationMinutes: parseFloat(e.target.value) || 0 }))}
                  className="font-display w-16 bg-transparent text-lg font-bold outline-none"
                />
                <span className="text-xs text-dim">min</span>
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-panel px-3.5 py-3">
              <div className="mb-1.5 text-[11px] text-dim">Calorias gastas</div>
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
            </div>
          </div>

          {result.explanation && <p className="mt-4 text-[13px] leading-snug text-dim">{result.explanation}</p>}

          <button
            onClick={handleConfirm}
            disabled={saving}
            className="font-display mt-5 w-full rounded-xl bg-accent py-4 text-[15px] font-bold text-[#0B0B0C] disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Registrar treino"}
          </button>
        </div>
      )}
    </div>
  );
}
