"use client";

import { useEffect, useState } from "react";
import { Fingerprint, Check } from "lucide-react";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { BIOMETRIC_EMAIL_KEY } from "@/lib/biometric-storage";

export function BiometricSetupButton({ email }: { email: string }) {
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
      setEnabled(true);
    } catch {
      setError("Não consegui ativar a biometria nesse dispositivo. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleEnable}
        disabled={busy || enabled}
        className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3.5 text-sm font-medium disabled:opacity-70"
      >
        {enabled ? <Check size={16} strokeWidth={2} color="var(--accent)" /> : <Fingerprint size={16} strokeWidth={2} color="var(--dim)" />}
        <span style={{ color: enabled ? "var(--accent)" : undefined }}>
          {enabled ? "Login por biometria ativado" : busy ? "Ativando..." : "Ativar login por biometria"}
        </span>
      </button>
      {error && <p className="px-1 text-[12px] font-semibold text-sodium">{error}</p>}
    </div>
  );
}
