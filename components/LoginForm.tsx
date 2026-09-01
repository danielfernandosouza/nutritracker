"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Fingerprint } from "lucide-react";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { BIOMETRIC_EMAIL_KEY, BIOMETRIC_NAME_KEY, REMEMBERED_EMAIL_KEY } from "@/lib/biometric-storage";
import { markUnlocked } from "@/lib/session-lock";
import { PasswordInput } from "@/components/PasswordInput";
import { BiometricEnrollPrompt } from "@/components/BiometricEnrollPrompt";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [biometricEmail, setBiometricEmail] = useState<string | null>(null);
  const [biometricName, setBiometricName] = useState<string | null>(null);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const [webauthnSupported, setWebauthnSupported] = useState(false);
  const [enrollPromptFor, setEnrollPromptFor] = useState<{ email: string; name: string | null } | null>(null);
  const autoTriedRef = useRef(false);

  useEffect(() => {
    // One-time browser/localStorage read — no SSR-safe way to compute this during render.
    const supported = browserSupportsWebAuthn();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebauthnSupported(supported);
    if (supported) {
      const storedEmail = localStorage.getItem(BIOMETRIC_EMAIL_KEY);
      setBiometricEmail(storedEmail);
      setBiometricName(localStorage.getItem(BIOMETRIC_NAME_KEY));
      if (storedEmail) {
        setEmail(storedEmail);
        return;
      }
    }
    // Sem biometria neste dispositivo: só o e-mail é lembrado, a senha é sempre exigida.
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (rememberedEmail) setEmail(rememberedEmail);
  }, []);

  /**
   * Para onde ir depois de autenticar. Quando a trava por inatividade manda o usuário pra cá
   * (ver AppLockWatcher), ela guarda a tela em que ele estava em `?next=` — assim a biometria o
   * devolve ao mesmo lugar. Só caminhos internos são aceitos: um valor externo viraria um
   * redirecionamento aberto, e voltar para /login faria laço.
   */
  function safeNextPath(): string {
    try {
      const next = new URLSearchParams(window.location.search).get("next");
      if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) {
        return "/home";
      }
      return next;
    } catch {
      return "/home";
    }
  }

  function finishLogin() {
    markUnlocked();
    router.push(safeNextPath());
    router.refresh();
  }

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
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      setLoading(false);
      // Oferece ativar biometria só quando faz sentido: suportado neste navegador e ainda não
      // ativado para essa conta neste aparelho. Senão, seria oferecido de novo a cada login.
      if (webauthnSupported && localStorage.getItem(BIOMETRIC_EMAIL_KEY) !== email) {
        setEnrollPromptFor({ email, name: null });
        return;
      }
      finishLogin();
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
        setBiometricBusy(false);
        setGreetingDismissed(true);
        setError("Não encontrei biometria cadastrada. Entre com sua senha.");
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
        setBiometricBusy(false);
        setGreetingDismissed(true);
        setError("Não consegui confirmar a biometria. Tente com sua senha.");
        return;
      }
      finishLogin();
    } catch {
      setBiometricBusy(false);
      setGreetingDismissed(true);
    }
  }

  useEffect(() => {
    // One-shot: try biometric login automatically as soon as we know this device has it set up.
    if (autoTriedRef.current) return;
    if (!biometricEmail) return;
    autoTriedRef.current = true;
    // Kicks off the native WebAuthn prompt as soon as we know this device has biometrics set up —
    // not a state sync, so the cascading-render rule doesn't apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleBiometricLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricEmail]);

  const showGreeting = !!biometricEmail && !greetingDismissed;

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

        {showGreeting ? (
          <>
            <div className="font-display text-center text-[24px] font-bold">
              Bem-vindo de volta{biometricName ? `, ${biometricName}` : ""} 👋
            </div>
            <div className="mt-1 flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/40 bg-panel">
                <Fingerprint size={26} strokeWidth={1.8} color="var(--accent)" />
              </div>
              <p className="text-[13px] text-dim">{biometricBusy ? "Confirmando biometria..." : "Aguardando biometria..."}</p>
            </div>
            <button
              onClick={() => setGreetingDismissed(true)}
              className="mt-2 text-[13px] font-semibold text-dim underline"
            >
              Usar senha em vez disso
            </button>
          </>
        ) : (
          <>
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
              <PasswordInput
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                placeholder="Senha"
                autoFocus={!!biometricEmail}
              />

              {error && <p className="text-center text-[13px] font-semibold text-sodium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="font-display mt-1.5 rounded-2xl bg-accent py-4 text-center text-base font-bold text-[#0B0B0C] disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
              <Link href="/forgot-password" className="text-center text-[13px] font-semibold text-dim">
                Esqueci minha senha
              </Link>
            </form>
          </>
        )}
      </div>

      <div className="text-center text-[13px] text-dim">
        Não tem conta?{" "}
        <Link href="/signup" className="font-semibold text-accent">
          Criar conta
        </Link>
      </div>

      {enrollPromptFor && (
        <BiometricEnrollPrompt
          email={enrollPromptFor.email}
          name={enrollPromptFor.name}
          onDone={() => {
            setEnrollPromptFor(null);
            finishLogin();
          }}
        />
      )}
    </div>
  );
}
