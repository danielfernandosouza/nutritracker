"use client";

import { useCallback, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { CameraFlow } from "@/components/CameraFlow";
import { AppLockWatcher } from "@/components/AppLockWatcher";
import { SpotifyMiniPlayer } from "@/components/SpotifyMiniPlayer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  // O mini-player só existe para quem tem o recurso liberado e conectado; o espaço extra no fim da
  // página só é reservado quando ele realmente aparece, para não sobrar um vão pros demais.
  const [spotifyActive, setSpotifyActive] = useState(false);
  const handleSpotifyActive = useCallback((active: boolean) => setSpotifyActive(active), []);

  return (
    <div className={`mx-auto min-h-screen w-full max-w-[480px] bg-bg ${spotifyActive ? "pb-[168px]" : "pb-[104px]"}`}>
      <AppLockWatcher />
      {children}
      <SpotifyMiniPlayer onActiveChange={handleSpotifyActive} />
      <BottomNav onOpenCamera={() => setCameraOpen(true)} />
      <CameraFlow open={cameraOpen} onClose={() => setCameraOpen(false)} />
    </div>
  );
}
