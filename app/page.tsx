import Image from "next/image";
import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-between px-7 pb-10 pt-12"
      style={{ background: "radial-gradient(120% 90% at 50% 0%, #1A1D0F 0%, #0B0B0C 60%)" }}
    >
      <div />
      <div className="flex flex-col items-center gap-4.5 text-center">
        <Image
          src="/icons/icon-512.png"
          alt="NutriTracker"
          width={96}
          height={96}
          priority
          className="rounded-[22px] shadow-[0_0_40px_rgba(198,255,61,0.35)]"
        />
        <div className="font-display text-[30px] font-bold tracking-tight">NutriTracker</div>
        <p className="max-w-[260px] text-[15px] leading-relaxed text-dim">
          Aponte a câmera pro prato. A gente identifica os alimentos e calcula tudo.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/login"
          className="font-display mt-1.5 rounded-2xl bg-accent py-4 text-center text-base font-bold text-[#0B0B0C]"
        >
          Entrar
        </Link>
        <div className="text-center text-[13px] text-dim">
          Não tem conta?{" "}
          <Link href="/signup" className="font-semibold text-accent">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
