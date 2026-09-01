"use client";

import { useEffect, useRef, useState } from "react";

/** Velocidade do vai e volta. Textos maiores levam proporcionalmente mais tempo, para a leitura não acelerar. */
const PIXELS_PER_SECOND = 32;
const MIN_DURATION_S = 6;

/**
 * Mostra o texto normalmente quando ele cabe, e o faz deslizar de um lado para o outro quando não
 * cabe — o caso de nomes longos de música. A medição é feita depois da renderização porque só aí
 * dá para comparar a largura real do texto com a do espaço disponível.
 */
export function MarqueeText({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const overflow = textEl.scrollWidth - container.clientWidth;
    setShift(overflow > 0 ? overflow : 0);
  }, [text]);

  const animated = shift > 0;

  return (
    <div ref={containerRef} className={`overflow-hidden ${className ?? ""}`}>
      <span
        ref={textRef}
        className={animated ? "marquee-text" : "block truncate"}
        style={
          animated
            ? ({
                "--marquee-shift": `-${shift}px`,
                "--marquee-duration": `${Math.max(MIN_DURATION_S, (shift / PIXELS_PER_SECOND) * 2)}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
}
