"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraShot = { dataUrl: string; data: string; mediaType: "image/jpeg" };

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
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
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
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const data = dataUrl.split(",")[1] ?? "";
    return { dataUrl, data, mediaType: "image/jpeg" };
  }, []);

  return { videoRef, ready, error, capture };
}
