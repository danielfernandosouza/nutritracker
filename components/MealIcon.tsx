import { UtensilsCrossed } from "lucide-react";

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
}: {
  photo?: string | null;
  emoji?: string | null;
  size?: number;
  rounded?: string;
}) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" className={`${rounded} shrink-0 object-cover`} style={{ width: size, height: size }} />;
  }

  if (isLikelyEmoji(emoji)) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center ${rounded} bg-track`}
        style={{ width: size, height: size, fontSize: size * 0.44 }}
      >
        {emoji}
      </div>
    );
  }

  return (
    <div className={`flex shrink-0 items-center justify-center ${rounded} bg-track text-dim`} style={{ width: size, height: size }}>
      <UtensilsCrossed size={size * 0.42} strokeWidth={1.8} />
    </div>
  );
}
