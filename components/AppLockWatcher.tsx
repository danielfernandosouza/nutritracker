"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearUnlock, shouldLock, touchActive } from "@/lib/session-lock";

/**
 * Trava o app quando ele volta de um período em segundo plano (ou é reaberto depois de fechado).
 * O proxy.ts já barra no servidor quem não tem o cookie de destravado, mas o cookie sozinho não
 * detecta "fechei o app" — o Chrome no Android restaura cookies de sessão ao reabrir o PWA. Quem
 * de fato distingue os dois casos é o carimbo de última atividade (ver lib/session-lock.ts).
 */
export function AppLockWatcher() {
  const router = useRouter();

  useEffect(() => {
    function lock() {
      clearUnlock();
      router.replace("/login");
    }

    // Reabertura do app: o componente monta de novo e o carimbo ainda é o de quando saiu.
    if (shouldLock()) {
      lock();
      return;
    }
    touchActive();

    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        // Guarda o instante de saída para a volta saber quanto tempo passou.
        touchActive();
        return;
      }
      if (shouldLock()) lock();
      else touchActive();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", touchActive);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", touchActive);
    };
  }, [router]);

  return null;
}
