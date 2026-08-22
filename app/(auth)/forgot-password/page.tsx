"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Não consegui enviar o e-mail. Tente novamente.");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Não consegui conectar. Tente novamente.");
    } finally {
      setLoading(false);
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
        <div className="font-display text-[24px] font-bold">Esqueci minha senha</div>

        {sent ? (
          <div className="mt-2 flex flex-col items-center gap-3 text-center">
            <p className="text-[14px] leading-relaxed text-dim">
              Se esse e-mail tiver uma conta cadastrada, você vai receber um link pra redefinir a
              senha em instantes. Confira também a caixa de spam.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-2 flex w-full flex-col gap-3">
            <p className="mb-1 text-center text-[13px] text-dim">
              Informe o e-mail da sua conta e mandamos um link pra você escolher uma senha nova.
            </p>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full rounded-2xl border border-line bg-panel px-4 py-4 text-[15px] outline-none focus:border-accent"
            />

            {error && <p className="text-center text-[13px] font-semibold text-sodium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="font-display mt-1.5 rounded-2xl bg-accent py-4 text-center text-base font-bold text-[#0B0B0C] disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-[13px] text-dim">
        <Link href="/login" className="font-semibold text-accent">
          Voltar pro login
        </Link>
      </div>
    </div>
  );
}
