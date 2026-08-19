"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Dumbbell, User, Camera } from "lucide-react";

type IconName = "home" | "history" | "workouts" | "profile";

const ICONS = { home: Home, history: History, workouts: Dumbbell, profile: User };

export function BottomNav({ onOpenCamera }: { onOpenCamera: () => void }) {
  const pathname = usePathname();

  const items: { href: string; label: string; icon: IconName }[] = [
    { href: "/home", label: "Início", icon: "home" },
    { href: "/history", label: "Histórico", icon: "history" },
    { href: "/workouts", label: "Treinos", icon: "workouts" },
    { href: "/profile", label: "Perfil", icon: "profile" },
  ];

  function renderItem(item: (typeof items)[number]) {
    const active = pathname.startsWith(item.href);
    const Icon = ICONS[item.icon];
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors"
        style={{ background: active ? "var(--accent)" : "transparent" }}
      >
        <Icon size={20} strokeWidth={2} color={active ? "#0B0B0C" : "var(--dim)"} />
      </Link>
    );
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-5">
      <div
        className="mx-auto flex w-fit items-center gap-1 rounded-full border border-line px-1.5 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
        style={{ background: "rgba(23,24,26,0.92)", backdropFilter: "blur(16px)" }}
      >
        {items.slice(0, 2).map(renderItem)}
        <button
          onClick={onOpenCamera}
          aria-label="Escanear refeição"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent shadow-[0_0_18px_rgba(198,255,61,0.45)]"
        >
          <Camera size={20} strokeWidth={2} color="#0B0B0C" />
        </button>
        {items.slice(2).map(renderItem)}
      </div>
    </div>
  );
}
