"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawScaled, type CameraShot } from "@/lib/image";

export type { CameraShot };

/** Live camera preview via getUserMedia, with an instant in-page still capture (no OS camera roundtrip). */
export function useCameraStream(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      // One-time browser capability check — nothing async follows to hang this off of.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    setError(false);

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active]);

  const capture = useCallback((): CameraShot | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;
    return drawScaled(video, video.videoWidth, video.videoHeight);
  }, []);

  return { videoRef, ready, error, capture };
}
