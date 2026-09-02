"use client";

import { Mic } from "lucide-react";
import { useSpeechToText } from "@/lib/useSpeechToText";

/**
 * Botão compacto de ditado por voz para encaixar dentro/ao lado de um campo de texto. Anexa a fala
 * transcrita ao texto já existente (não substitui), então dá pra falar em mais de uma vez.
 */
export function MicButton({
  value,
  onChange,
  label,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
  className?: string;
}) {
  const { supported, listening, toggle } = useSpeechToText((transcript) => {
    onChange(value.trim() ? `${value.trim()} ${transcript}` : transcript);
  });

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Parar ditado" : label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${className ?? ""}`}
      style={{
        background: listening ? "var(--sodium)" : "var(--track)",
        color: listening ? "#0B0B0C" : "var(--dim)",
      }}
    >
      <Mic size={14} strokeWidth={2.2} className={listening ? "animate-pulse" : undefined} />
    </button>
  );
}
