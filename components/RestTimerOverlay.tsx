"use client";

import { useEffect, useRef, useState } from "react";
import { SkipForward, Minus, Plus, CheckCircle2 } from "lucide-react";

const RADIUS = 92;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  if (s < 60) return String(s);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function beep() {
  try {
    type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
    const w = window as AudioWindow;
    const AudioCtx = window.AudioContext ?? w.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => ctx.close();
  } catch {
    // som é best-effort — vibração e flash visual já cobrem o aviso
  }
}

type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
};

export function RestTimerOverlay({
  totalSeconds,
  exerciseName,
  color,
  onClose,
}: {
  totalSeconds: number;
  exerciseName: string;
  color: string;
  onClose: () => void;
}) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [total, setTotal] = useState(totalSeconds);
  const [finished, setFinished] = useState(false);
  const [initialEndAt] = useState(() => Date.now() + totalSeconds * 1000);
  const endAtRef = useRef(initialEndAt);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const notifiedRef = useRef(false);

  useEffect(() => {
    async function lock() {
      try {
        const nav = navigator as WakeLockNavigator;
        wakeLockRef.current = (await nav.wakeLock?.request("screen")) ?? null;
      } catch {
        // wake lock indisponível nesse navegador — segue sem travar a tela
      }
    }
    lock();
    return () => {
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const secsLeft = Math.max(0, (endAtRef.current - Date.now()) / 1000);
      setRemaining(secsLeft);
      if (secsLeft <= 0 && !notifiedRef.current) {
        notifiedRef.current = true;
        setFinished(true);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([250, 100, 250, 100, 400]);
        }
        beep();
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  function adjust(delta: number) {
    endAtRef.current += delta * 1000;
    setTotal((t) => Math.max(5, t + delta));
    setRemaining((r) => Math.max(0, r + delta));
    if (remaining + delta > 0) {
      notifiedRef.current = false;
      setFinished(false);
    }
  }

  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const offset = CIRCUMFERENCE * (1 - pct);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-bg px-6"
      style={{ animation: finished ? "restFlashBg 1s ease-in-out 3" : undefined }}
    >
      <div
        className="mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-dim"
        style={{ animation: finished ? "restFlashText 1s ease-in-out infinite" : undefined }}
      >
        {finished ? "Descanso concluído" : "Descansando"}
      </div>
      <div className="mb-8 max-w-[240px] truncate text-center text-[15px] font-semibold text-chalk">{exerciseName}</div>

      <div className="relative flex h-[220px] w-[220px] items-center justify-center">
        <svg width="220" height="220" viewBox="0 0 220 220" className="absolute inset-0 -rotate-90">
          <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="var(--track)" strokeWidth="10" />
          <circle
            cx="110"
            cy="110"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.2s linear",
              filter: finished ? "drop-shadow(0 0 12px var(--accent))" : undefined,
            }}
          />
        </svg>
        <div className="flex flex-col items-center">
          {finished ? (
            <CheckCircle2 size={52} strokeWidth={1.8} color="var(--accent)" />
          ) : (
            <span className="font-display num text-[52px] font-bold leading-none">{formatClock(remaining)}</span>
          )}
        </div>
      </div>

      {!finished ? (
        <div className="mt-9 flex items-center gap-4">
          <button
            onClick={() => adjust(-15)}
            aria-label="Menos 15 segundos"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-panel text-dim"
          >
            <Minus size={16} strokeWidth={2.2} />
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-full bg-panel px-5 py-2.5 text-sm font-semibold text-dim"
          >
            <SkipForward size={15} strokeWidth={2.2} />
            Pular
          </button>
          <button
            onClick={() => adjust(15)}
            aria-label="Mais 15 segundos"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-panel text-dim"
          >
            <Plus size={16} strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        <button
          onClick={onClose}
          className="font-display mt-9 rounded-2xl bg-accent px-8 py-3.5 text-sm font-bold text-[#0B0B0C]"
        >
          Continuar treino
        </button>
      )}
    </div>
  );
}
