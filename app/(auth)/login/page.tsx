"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Fingerprint } from "lucide-react";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { BIOMETRIC_EMAIL_KEY } from "@/lib/biometric-storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [biometricEmail, setBiometricEmail] = useState<string | null>(null);
  const [biometricBusy, setBiometricBusy] = useState(false);

  useEffect(() => {
    // One-time browser/localStorage read — no SSR-safe way to compute this during render.
    if (browserSupportsWebAuthn()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBiometricEmail(localStorage.getItem(BIOMETRIC_EMAIL_KEY));
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("E-mail ou senha incorretos.");
        setLoading(false);
        return;
      }
      router.push("/home");
      router.refresh();
    } catch {
      setError("Não consegui conectar. Tente novamente.");
      setLoading(false);
    }
  }

  async function handleBiometricLogin() {
    if (!biometricEmail) return;
    setError(null);
    setBiometricBusy(true);
    try {
      const optionsRes = await fetch("/api/auth/webauthn/login-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: biometricEmail }),
      });
      if (!optionsRes.ok) {
        setError("Não encontrei biometria cadastrada. Entre com sua senha.");
        setBiometricBusy(false);
        return;
      }
      const { options, token } = await optionsRes.json();
      const assertion = await startAuthentication(options);

      const res = await signIn("webauthn", {
        token,
        response: JSON.stringify(assertion),
        redirect: false,
      });
      if (res?.error) {
        setError("Não consegui confirmar a biometria. Tente com sua senha.");
        setBiometricBusy(false);
        return;
      }
      router.push("/home");
      router.refresh();
    } catch {
      setBiometricBusy(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col justify-between px-7 pb-10 pt-12"
      style={{ background: "radial-gradient(120% 90% at 50% 0%, #1A1D0F 0%, #0B0B0C 60%)" }}
    >
      <div />
      <div className="flex flex-col items-center gap-4.5">
        <Image
          src="/icons/icon-512.png"
          alt="NutriTracker"
          width={72}
          height={72}
          priority
          className="rounded-[18px] shadow-[0_0_32px_rgba(198,255,61,0.3)]"
        />
        <div className="font-display text-[24px] font-bold">Entrar</div>

        {biometricEmail && (
          <button
            onClick={handleBiometricLogin}
            disabled={biometricBusy}
            className="font-display mt-1 flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-panel py-4 text-[15px] font-bold text-accent disabled:opacity-60"
          >
            <Fingerprint size={18} strokeWidth={2} />
            {biometricBusy ? "Confirmando..." : "Entrar com biometria"}
          </button>
        )}
        {biometricEmail && <div className="flex w-full items-center gap-3 text-[11px] text-dim"><span className="h-px flex-1 bg-line" />ou<span className="h-px flex-1 bg-line" /></div>}

        <form onSubmit={handleSubmit} className="mt-2 flex w-full flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 text-[15px] outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full rounded-2xl border border-line bg-panel px-4 py-4 text-[15px] outline-none focus:border-accent"
          />

          {error && <p className="text-center text-[13px] font-semibold text-sodium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="font-display mt-1.5 rounded-2xl bg-accent py-4 text-center text-base font-bold text-[#0B0B0C] disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>

      <div className="text-center text-[13px] text-dim">
        Não tem conta?{" "}
        <Link href="/signup" className="font-semibold text-accent">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
