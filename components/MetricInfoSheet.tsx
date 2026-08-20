"use client";

import type { ReactNode } from "react";
import { X, TrendingDown, TrendingUp, CheckCircle2, ExternalLink } from "lucide-react";
import { METRIC_INFO, computeMetricStatus, type MetricKey } from "@/lib/metric-info";
import type { SleepFeedback } from "@/lib/wellness";

export function MetricInfoSheet({
  metric,
  onClose,
  today,
  sleepFeedback,
  footerAction,
}: {
  metric: MetricKey | null;
  onClose: () => void;
  today?: { value: number; target: number };
  sleepFeedback?: SleepFeedback | null;
  footerAction?: ReactNode;
}) {
  if (!metric) return null;
  const info = METRIC_INFO[metric];

  const status =
    metric === "sleep"
      ? sleepFeedback
        ? sleepFeedback.quality === "short"
          ? "low"
          : sleepFeedback.quality === "late_bedtime"
            ? "high"
            : "good"
        : null
      : today
        ? computeMetricStatus(metric, today.value, today.target).kind
        : null;

  const statusMessage = metric === "sleep" ? sleepFeedback?.message : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
        style={{ backdropFilter: "blur(2px)" }}
      />
      <div className="relative flex max-h-[88vh] w-full max-w-[480px] flex-col overflow-y-auto rounded-t-3xl border-t border-line bg-panel">
        <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-track" />

        <div className="flex items-center justify-between px-5 pb-3 pt-3">
          <div className="font-display text-[18px] font-bold">{info.title}</div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-track text-dim"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 pb-6">
          {status && (
            <div
              className="flex items-start gap-2.5 rounded-2xl border px-4 py-3.5"
              style={{
                borderColor:
                  status === "high" ? "var(--sodium)" : status === "low" ? "var(--sugar)" : "var(--accent)",
                background:
                  status === "high"
                    ? "color-mix(in srgb, var(--sodium) 12%, var(--panel))"
                    : status === "low"
                      ? "color-mix(in srgb, var(--sugar) 12%, var(--panel))"
                      : "color-mix(in srgb, var(--accent) 12%, var(--panel))",
              }}
            >
              {status === "high" ? (
                <TrendingUp size={17} strokeWidth={2.2} color="var(--sodium)" className="mt-0.5 shrink-0" />
              ) : status === "low" ? (
                <TrendingDown size={17} strokeWidth={2.2} color="var(--sugar)" className="mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 size={17} strokeWidth={2.2} color="var(--accent)" className="mt-0.5 shrink-0" />
              )}
              <div className="text-[13px] leading-snug">
                {statusMessage ??
                  (today &&
                    (status === "high"
                      ? `Hoje: ${Math.round(today.value)}${info.unit} — acima da meta de ${Math.round(today.target)}${info.unit}.`
                      : status === "low"
                        ? `Hoje: ${Math.round(today.value)}${info.unit} — abaixo da meta de ${Math.round(today.target)}${info.unit}.`
                        : `Hoje: ${Math.round(today.value)}${info.unit} — dentro da meta de ${Math.round(today.target)}${info.unit}.`))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-dim">O que é</div>
            <p className="text-[13px] leading-relaxed text-dim">{info.whatItIs}</p>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-dim">Por que essa é sua meta</div>
            <p className="text-[13px] leading-relaxed text-dim">{info.whyThisTarget}</p>
          </div>

          <div className="rounded-2xl border border-line bg-track p-4">
            <div className="mb-1.5 flex items-center gap-2 text-[13px] font-bold">
              <TrendingDown size={14} strokeWidth={2.2} color="var(--sugar)" />
              Se ficar abaixo
            </div>
            <p className="mb-2 text-[13px] leading-relaxed text-dim">{info.tooLow.consequence}</p>
            <p className="text-[13px] font-semibold leading-relaxed text-chalk">{info.tooLow.howToFix}</p>
          </div>

          <div className="rounded-2xl border border-line bg-track p-4">
            <div className="mb-1.5 flex items-center gap-2 text-[13px] font-bold">
              <TrendingUp size={14} strokeWidth={2.2} color="var(--sodium)" />
              Se ficar acima
            </div>
            <p className="mb-2 text-[13px] leading-relaxed text-dim">{info.tooHigh.consequence}</p>
            <p className="text-[13px] font-semibold leading-relaxed text-chalk">{info.tooHigh.howToFix}</p>
          </div>

          {info.sources.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {info.sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-dim underline decoration-dotted"
                >
                  <ExternalLink size={11} strokeWidth={2} />
                  {s.label}
                </a>
              ))}
            </div>
          )}

          {footerAction && <div className="mt-1">{footerAction}</div>}
        </div>
      </div>
    </div>
  );
}
