"use client";

import { useEffect, useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";

export function BootSplash({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 3500);
    const removeTimer = setTimeout(() => setVisible(false), 3900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {children}
      {visible && (
        <div
          className={`fixed inset-0 z-[100] transition-opacity duration-[400ms] ${fading ? "pointer-events-none opacity-0" : "opacity-100"}`}
        >
          <SplashScreen mode="boot" />
        </div>
      )}
    </>
  );
}
