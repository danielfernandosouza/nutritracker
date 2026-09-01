import { UtensilsCrossed } from "lucide-react";
import { HealthScoreMedal } from "@/components/HealthScoreMedal";

const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

function isLikelyEmoji(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 8) return false;
  return EMOJI_PATTERN.test(trimmed);
}

export function MealIcon({
  photo,
  emoji,
  size = 48,
  rounded = "rounded-xl",
  healthScore,
}: {
  photo?: string | null;
  emoji?: string | null;
  size?: number;
  rounded?: string;
  /** Selo de nota no canto do ícone — omitido quando a refeição não tem avaliação da IA. */
  healthScore?: number | null;
}) {
  const icon = photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt="" className={`${rounded} shrink-0 object-cover`} style={{ width: size, height: size }} />
  ) : isLikelyEmoji(emoji) ? (
    <div
      className={`flex shrink-0 items-center justify-center ${rounded} bg-track`}
      style={{ width: size, height: size, fontSize: size * 0.44 }}
    >
      {emoji}
    </div>
  ) : (
    <div className={`flex shrink-0 items-center justify-center ${rounded} bg-track text-dim`} style={{ width: size, height: size }}>
      <UtensilsCrossed size={size * 0.42} strokeWidth={1.8} />
    </div>
  );

  if (healthScore == null) return icon;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {icon}
      <div
        className="absolute drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
        style={{ bottom: -size * 0.08, right: -size * 0.08 }}
      >
        <HealthScoreMedal score={healthScore} size={size * 0.46} />
      </div>
    </div>
  );
}
