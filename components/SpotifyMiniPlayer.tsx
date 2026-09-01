"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { MarqueeText } from "@/components/MarqueeText";

type PlayerStatus = {
  enabled: boolean;
  connected: boolean;
  playing: boolean;
  track: { name: string; artist: string; albumArt: string | null } | null;
  noDevice: boolean;
};

/** De quanto em quanto tempo o player se atualiza sozinho enquanto o app está na frente. */
const POLL_MS = 10_000;
/** O Spotify leva um instante para refletir o comando; esperar um pouco evita ler o estado antigo. */
const AFTER_ACTION_MS = 400;

export function SpotifyMiniPlayer({ onActiveChange }: { onActiveChange: (active: boolean) => void }) {
  const [status, setStatus] = useState<PlayerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Evita avisar o AppShell repetidamente com o mesmo valor a cada atualização do status.
  const lastActiveRef = useRef<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/spotify/player");
      if (!res.ok) return;
      setStatus((await res.json()) as PlayerStatus);
    } catch {
      // Falha de rede: mantém o último estado conhecido em vez de piscar o player pra fora da tela.
    }
  }, []);

  useEffect(() => {
    // Busca inicial do estado do player: o setState acontece depois do await, dentro do callback
    // assíncrono, e não numa cascata de renderização — a regra não distingue os dois casos.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);

    // O caminho normal é sair do app, dar play no Spotify e voltar — atualizar na volta faz o
    // player aparecer na hora, em vez de só na próxima batida do relógio.
    function handleVisibility() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [load]);

  // Só aparece quando há de fato uma música carregada no Spotify (tocando ou pausada). Com o
  // Spotify fechado não há o que controlar, então o player some em vez de ocupar espaço à toa.
  // Continuar visível na pausa é de propósito: se sumisse ao pausar, não haveria como dar play.
  const track = status?.track ?? null;
  const active = !!status?.enabled && !!status.connected && !status.noDevice && !!track;

  useEffect(() => {
    if (lastActiveRef.current === active) return;
    lastActiveRef.current = active;
    onActiveChange(active);
  }, [active, onActiveChange]);

  if (!active || !track) return null;

  async function send(action: "play" | "pause" | "next" | "previous") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/spotify/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Não consegui controlar o Spotify.");
        return;
      }
      // Resposta otimista no play/pause: o botão reage na hora, e a leitura seguinte confirma.
      if (action === "play" || action === "pause") {
        setStatus((s) => (s ? { ...s, playing: action === "play" } : s));
      }
      setTimeout(load, AFTER_ACTION_MS);
    } catch {
      setError("Sem conexão com o Spotify.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-[88px] left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 px-5">
      <div
        className="flex items-center gap-3 rounded-2xl border border-line px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        style={{ background: "rgba(23,24,26,0.94)", backdropFilter: "blur(16px)" }}
      >
        {track.albumArt ? (
          <Image
            src={track.albumArt}
            alt=""
            width={38}
            height={38}
            unoptimized
            className="h-[38px] w-[38px] shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="h-[38px] w-[38px] shrink-0 rounded-lg bg-track" />
        )}

        <div className="min-w-0 flex-1">
          {error ? (
            <div className="truncate text-[12px] font-semibold text-sodium">{error}</div>
          ) : (
            <>
              <MarqueeText text={track.name} className="text-[13px] font-semibold" />
              <MarqueeText text={track.artist} className="text-[11px] text-dim" />
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => send("previous")}
            disabled={busy}
            aria-label="Música anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full text-dim disabled:opacity-50"
          >
            <SkipBack size={16} strokeWidth={2.2} fill="currentColor" />
          </button>
          <button
            onClick={() => send(status?.playing ? "pause" : "play")}
            disabled={busy}
            aria-label={status?.playing ? "Pausar" : "Tocar"}
            className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-50"
            style={{ background: "#1DB954" }}
          >
            {status?.playing ? (
              <Pause size={16} strokeWidth={2.4} color="#0B0B0C" fill="#0B0B0C" />
            ) : (
              <Play size={16} strokeWidth={2.4} color="#0B0B0C" fill="#0B0B0C" />
            )}
          </button>
          <button
            onClick={() => send("next")}
            disabled={busy}
            aria-label="Próxima música"
            className="flex h-9 w-9 items-center justify-center rounded-full text-dim disabled:opacity-50"
          >
            <SkipForward size={16} strokeWidth={2.2} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
