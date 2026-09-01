"use client";

import { useEffect, useState } from "react";
import { Music, Check } from "lucide-react";

/**
 * Só aparece para quem tem a flag `spotifyEnabled` ligada no perfil — o app do Spotify em modo de
 * desenvolvimento aceita no máximo 5 contas, cadastradas à mão no painel deles, então o recurso é
 * liberado pessoa a pessoa.
 */
export function SpotifyConnectCard() {
  const [state, setState] = useState<{ enabled: boolean; connected: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/spotify/account")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setState(json))
      .catch(() => setState(null));
  }, []);

  if (!state?.enabled) return null;

  async function handleDisconnect() {
    setBusy(true);
    try {
      await fetch("/api/spotify/account", { method: "DELETE" });
      setState({ enabled: true, connected: false });
    } finally {
      setBusy(false);
    }
  }

  if (state.connected) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5 text-sm font-medium">
        <Check size={16} strokeWidth={2} color="#1DB954" />
        <span className="flex-1" style={{ color: "#1DB954" }}>
          Spotify conectado
        </span>
        <button
          onClick={handleDisconnect}
          disabled={busy}
          className="rounded-full bg-track px-3 py-1 text-[11px] font-semibold text-dim disabled:opacity-60"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <a
      href="/api/spotify/authorize"
      className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5 text-sm font-medium"
    >
      <Music size={16} strokeWidth={2} color="#1DB954" />
      <span>Conectar Spotify</span>
    </a>
  );
}
