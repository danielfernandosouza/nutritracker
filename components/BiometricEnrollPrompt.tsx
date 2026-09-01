"use client";

import { useState } from "react";
import { Fingerprint } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { BIOMETRIC_EMAIL_KEY, BIOMETRIC_NAME_KEY } from "@/lib/biometric-storage";

/**
 * Oferecido uma vez, logo após um login por senha bem-sucedido neste dispositivo (sem biometria
 * ainda ativada) — mesma cerimônia de registro do botão em Perfil, só que no momento certo em vez
 * de escondida numa tela que o usuário pode nunca visitar.
 */
export function BiometricEnrollPrompt({
  email,
  name,
  onDone,
}: {
  email: string;
  name?: string | null;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      const optionsRes = await fetch("/api/auth/webauthn/register-options", { method: "POST" });
      if (!optionsRes.ok) throw new Error();
      const { options, token } = await optionsRes.json();

      const response = await startRegistration(options);

      const verifyRes = await fetch("/api/auth/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, response }),
      });
      if (!verifyRes.ok) throw new Error();

      localStorage.setItem(BIOMETRIC_EMAIL_KEY, email);
      if (name) localStorage.setItem(BIOMETRIC_NAME_KEY, name.split(" ")[0]);
      onDone();
    } catch {
      setError("Não consegui ativar. Você pode tentar de novo depois em Perfil.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <div className="w-full max-w-[420px] rounded-t-3xl border-t border-line bg-panel p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-track">
          <Fingerprint size={24} strokeWidth={1.8} color="var(--accent)" />
        </div>
        <div className="font-display mb-1.5 text-[18px] font-bold">Ativar login por biometria?</div>
        <p className="mb-5 text-[13px] leading-relaxed text-dim">
          Nas próximas vezes, é só confirmar com sua digital neste aparelho — sem digitar a senha.
        </p>
        {error && <p className="mb-3 text-[12px] font-semibold text-sodium">{error}</p>}
        <div className="flex gap-2.5">
          <button
            onClick={onDone}
            disabled={busy}
            className="flex-1 rounded-xl border border-line py-3.5 text-sm font-bold text-dim disabled:opacity-60"
          >
            Agora não
          </button>
          <button
            onClick={handleEnable}
            disabled={busy}
            className="font-display flex-[2] rounded-xl bg-accent py-3.5 text-sm font-bold text-[#0B0B0C] disabled:opacity-60"
          >
            {busy ? "Ativando..." : "Ativar biometria"}
          </button>
        </div>
      </div>
    </div>
  );
}
