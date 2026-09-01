"use client";

import { useEffect, useState } from "react";
import { Fingerprint, Check, X } from "lucide-react";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { BIOMETRIC_EMAIL_KEY, BIOMETRIC_NAME_KEY } from "@/lib/biometric-storage";

export function BiometricSetupButton({ email, name }: { email: string; name?: string | null }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // One-time browser/localStorage read — no SSR-safe way to compute this during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(browserSupportsWebAuthn());
    if (localStorage.getItem(BIOMETRIC_EMAIL_KEY) === email) {
      setEnabled(true);
    }
  }, [email]);

  if (!supported) return null;

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
      setEnabled(true);
    } catch {
      setError("Não consegui ativar a biometria nesse dispositivo. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  // Remove no servidor (não só o toggle local) — sem isso, tentar recadastrar falha, porque o
  // navegador/SO reconhece a credencial antiga e recusa registrar de novo no mesmo autenticador.
  async function handleDisable() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/webauthn/authenticators", { method: "DELETE" });
      if (!res.ok) throw new Error();
      localStorage.removeItem(BIOMETRIC_EMAIL_KEY);
      localStorage.removeItem(BIOMETRIC_NAME_KEY);
      setEnabled(false);
    } catch {
      setError("Não consegui desativar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {enabled ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5 text-sm font-medium">
          <Check size={16} strokeWidth={2} color="var(--accent)" />
          <span className="flex-1" style={{ color: "var(--accent)" }}>
            Login por biometria ativado
          </span>
          <button
            onClick={handleDisable}
            disabled={busy}
            aria-label="Desativar login por biometria"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-track text-dim disabled:opacity-60"
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        </div>
      ) : (
        <button
          onClick={handleEnable}
          disabled={busy}
          className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5 text-sm font-medium disabled:opacity-70"
        >
          <Fingerprint size={16} strokeWidth={2} color="var(--dim)" />
          <span>{busy ? "Ativando..." : "Ativar login por biometria"}</span>
        </button>
      )}
      {error && <p className="px-1 text-[12px] font-semibold text-sodium">{error}</p>}
    </div>
  );
}
