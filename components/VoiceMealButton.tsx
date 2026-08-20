"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { EMPTY_TOTALS } from "@/lib/targets";
import type { MealInput } from "@/lib/types";

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function VoiceMealButton({ onResult }: { onResult: (data: Partial<MealInput>) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    // One-time browser capability check — no SSR-safe way to compute this during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  if (!supported) return null;

  async function analyzeTranscript(transcript: string) {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcript, dayTotals: EMPTY_TOTALS, mode: "meal", forceTool: true }),
      });
      const json = await res.json();
      if (!res.ok || json.type !== "estimate") {
        setError("Não consegui entender essa refeição. Tente falar de novo ou preencha manualmente.");
        return;
      }
      onResult(json.data);
    } catch {
      setError("Não consegui conectar. Tente de novo.");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleClick() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const lastResult = e.results[e.results.length - 1];
      const transcript = lastResult[0].transcript;
      analyzeTranscript(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setError(null);
    setListening(true);
    recognition.start();
  }

  return (
    <div className="mb-4 flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-track py-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={analyzing}
        aria-label={listening ? "Parar gravação" : "Descrever refeição por voz"}
        className="flex h-14 w-14 items-center justify-center rounded-full disabled:opacity-60"
        style={{
          background: listening ? "var(--sodium)" : "var(--accent)",
          boxShadow: listening ? "0 0 0 8px rgba(255,77,141,0.15)" : "0 0 0 8px rgba(198,255,61,0.12)",
        }}
      >
        {analyzing ? (
          <Loader2 size={22} strokeWidth={2.2} color="#0B0B0C" className="animate-spin" />
        ) : (
          <Mic size={22} strokeWidth={2.2} color="#0B0B0C" />
        )}
      </button>
      <p className="text-[12px] text-dim">
        {analyzing ? "Analisando..." : listening ? "Ouvindo... toque pra parar" : "Toque e descreva a refeição em voz alta"}
      </p>
      {error && <p className="px-4 text-center text-[11px] font-semibold text-sodium">{error}</p>}
    </div>
  );
}
