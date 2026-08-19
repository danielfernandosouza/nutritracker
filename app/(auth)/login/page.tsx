"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
