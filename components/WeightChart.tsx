type Entry = { date: string; weightKg: number };

const VIEW_WIDTH = 300;
const VIEW_HEIGHT = 100;
const PADDING_Y = 14;

export function WeightChart({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex h-[120px] flex-col items-center justify-center gap-1 text-center">
        <p className="text-[13px] text-dim">Nenhum peso registrado ainda.</p>
        <p className="text-[12px] text-dim">Registre 1x por semana pra começar a ver sua evolução aqui.</p>
      </div>
    );
  }

  if (entries.length === 1) {
    return (
      <div className="flex h-[120px] flex-col items-center justify-center gap-1 text-center">
        <div className="font-display text-[24px] font-bold text-accent">{entries[0].weightKg}kg</div>
        <p className="text-[12px] text-dim">Peso inicial — a evolução aparece conforme você for se pesando semanalmente.</p>
      </div>
    );
  }

  const weights = entries.map((e) => e.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const points = entries.map((e, i) => {
    const x = (i / (entries.length - 1)) * VIEW_WIDTH;
    const y = PADDING_Y + (1 - (e.weightKg - min) / range) * (VIEW_HEIGHT - PADDING_Y * 2);
    return { x, y, ...e };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const first = entries[0];
  const last = entries[entries.length - 1];
  const deltaKg = Math.round((last.weightKg - first.weightKg) * 10) / 10;
  const trendColor = deltaKg > 0 ? "var(--sodium)" : deltaKg < 0 ? "var(--accent)" : "var(--dim)";

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <span className="font-display text-[24px] font-bold leading-none">{last.weightKg}kg</span>
          <span className="ml-2 text-[12px] font-semibold" style={{ color: trendColor }}>
            {deltaKg > 0 ? "+" : ""}
            {deltaKg}kg desde {first.date.slice(5).split("-").reverse().join("/")}
          </span>
        </div>
        <div className="text-right text-[11px] text-dim">
          <div>máx {max}kg</div>
          <div>mín {min}kg</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="h-[100px] w-full" preserveAspectRatio="none">
        <path d={path} fill="none" stroke={trendColor} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 3.5 : 2} fill={trendColor} />
        ))}
      </svg>
    </div>
  );
}
