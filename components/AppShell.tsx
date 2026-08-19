"use client";

import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { CameraFlow } from "@/components/CameraFlow";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [cameraOpen, setCameraOpen] = useState(false);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-bg pb-[104px]">
      {children}
      <BottomNav onOpenCamera={() => setCameraOpen(true)} />
      <CameraFlow open={cameraOpen} onClose={() => setCameraOpen(false)} />
    </div>
  );
}
