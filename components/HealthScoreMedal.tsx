export type MedalTier = "ouro" | "prata" | "bronze";

type TierStyle = {
  label: string;
  /** Do brilho à sombra, na diagonal — é o que dá a leitura de metal em vez de disco chapado. */
  light: string;
  mid: string;
  deep: string;
  shadow: string;
  ribbon: string;
  /** Cor do número, escura o bastante para ler sobre o metal claro. */
  ink: string;
};

const TIERS: Record<MedalTier, TierStyle> = {
  ouro: {
    label: "Ouro",
    light: "#FFF6C9",
    mid: "#FFD24A",
    deep: "#D2960F",
    shadow: "#8A5D04",
    ribbon: "#8A5D04",
    ink: "#5A3C02",
  },
  prata: {
    label: "Prata",
    light: "#FFFFFF",
    mid: "#DCE4EE",
    deep: "#9BA7B6",
    shadow: "#6A7684",
    ribbon: "#6A7684",
    ink: "#3E4855",
  },
  bronze: {
    label: "Bronze",
    light: "#FBDDBE",
    mid: "#E0A063",
    deep: "#AC6630",
    shadow: "#77441C",
    ribbon: "#77441C",
    ink: "#4E2B0F",
  },
};

export function medalTierForScore(score: number): MedalTier {
  if (score >= 8) return "ouro";
  if (score >= 6) return "prata";
  return "bronze";
}

export function medalTierLabel(tier: MedalTier): string {
  return TIERS[tier].label;
}

/** Mostra "8" em vez de "8.0", mas mantém o meio ponto quando existe: "7.5". */
function formatScore(score: number): string {
  return (Math.round(score * 10) / 10).toString().replace(".", ",");
}

export function HealthScoreMedal({ score, size = 72 }: { score: number; size?: number }) {
  const tier = medalTierForScore(score);
  const style = TIERS[tier];
  // Ids únicos por nota: dois medalhões na mesma tela não podem compartilhar gradiente.
  const uid = `medal-${tier}-${String(score).replace(".", "-")}`;

  return (
    <svg
      width={size}
      height={size * (88 / 72)}
      viewBox="0 0 72 88"
      fill="none"
      role="img"
      aria-label={`Medalha de ${style.label}, nota ${formatScore(score)} de 10`}
    >
      <defs>
        <linearGradient id={`${uid}-metal`} x1="14" y1="26" x2="58" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={style.light} />
          <stop offset="0.38" stopColor={style.mid} />
          <stop offset="0.72" stopColor={style.deep} />
          <stop offset="1" stopColor={style.shadow} />
        </linearGradient>
        <linearGradient id={`${uid}-face`} x1="52" y1="30" x2="20" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={style.deep} />
          <stop offset="0.45" stopColor={style.mid} />
          <stop offset="1" stopColor={style.light} />
        </linearGradient>
        <radialGradient id={`${uid}-shine`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
          gradientTransform="translate(26 34) rotate(38) scale(20 12)">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Fitas, atrás do medalhão */}
      <path d="M22 4 L34 40 L22 46 L10 24 Z" fill={style.ribbon} />
      <path d="M50 4 L38 40 L50 46 L62 24 Z" fill={style.ribbon} opacity="0.78" />

      {/* Aro externo */}
      <circle cx="36" cy="56" r="26" fill={`url(#${uid}-metal)`} />
      {/* Face interna, com o gradiente invertido pra criar o degrau do relevo */}
      <circle cx="36" cy="56" r="21" fill={`url(#${uid}-face)`} />
      <circle cx="36" cy="56" r="21" fill="none" stroke={style.shadow} strokeOpacity="0.35" strokeWidth="1" />

      {/* Brilho */}
      <ellipse cx="26" cy="46" rx="13" ry="8" fill={`url(#${uid}-shine)`} transform="rotate(-32 26 46)" />

      <text
        x="36"
        y="57"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-space-grotesk), system-ui, sans-serif"
        fontSize="21"
        fontWeight="700"
        fill={style.ink}
      >
        {formatScore(score)}
      </text>
    </svg>
  );
}
