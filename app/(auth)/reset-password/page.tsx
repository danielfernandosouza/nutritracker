"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/PasswordInput";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Link inválido. Peça um novo em \"Esqueci minha senha\".");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Não consegui redefinir a senha.");
        setLoading(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Não consegui conectar. Tente novamente.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-2 flex flex-col items-center gap-3 text-center">
        <Image
          src="/icons/icon-512.png"
          alt="NutriTracker"
          width={72}
          height={72}
          className="rounded-[18px] shadow-[0_0_32px_rgba(198,255,61,0.3)]"
        />
        <p className="text-[14px] leading-relaxed text-dim">Senha redefinida! Levando você pro login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex w-full flex-col gap-3">
      {!token && (
        <p className="text-center text-[13px] font-semibold text-sodium">
          Esse link parece inválido. Peça um novo na tela de login.
        </p>
      )}
      <PasswordInput
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        placeholder="Senha nova (mín. 8 caracteres)"
      />
      <PasswordInput
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        placeholder="Confirmar senha nova"
      />

      {error && <p className="text-center text-[13px] font-semibold text-sodium">{error}</p>}

      <button
        type="submit"
        disabled={loading || !token}
        className="font-display mt-1.5 rounded-2xl bg-accent py-4 text-center text-base font-bold text-[#0B0B0C] disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Redefinir senha"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
        <div className="font-display text-[24px] font-bold">Nova senha</div>

        <Suspense fallback={<p className="mt-2 text-center text-[13px] text-dim">Carregando...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>

      <div className="text-center text-[13px] text-dim">
        <Link href="/login" className="font-semibold text-accent">
          Voltar pro login
        </Link>
      </div>
    </div>
  );
}
