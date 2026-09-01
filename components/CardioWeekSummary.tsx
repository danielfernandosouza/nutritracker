import { CARDIO_ACTIVITY_COLORS, type CardioActivity } from "@/lib/cardio-burn";
import { lastDateKeys, formatWeekdayShort } from "@/lib/date";

type CardioSession = {
  date: string;
  cardioActivity: string | null;
  durationMinutes: number | null;
  caloriesBurned: number | null;
};

const VIEW_WIDTH = 280;
const VIEW_HEIGHT = 64;
const BAR_GAP = 6;

function formatDuration(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

export function CardioWeekSummary({ sessions }: { sessions: CardioSession[] }) {
  const weekKeys = lastDateKeys(7);
  const weekSet = new Set(weekKeys);
  const weekSessions = sessions.filter((s) => weekSet.has(s.date));

  const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  const totalCalories = weekSessions.reduce((sum, s) => sum + (s.caloriesBurned ?? 0), 0);

  const byDate = new Map<string, CardioSession[]>();
  for (const s of weekSessions) {
    const list = byDate.get(s.date) ?? [];
    list.push(s);
    byDate.set(s.date, list);
  }

  const dayTotals = weekKeys.map((dateKey) => {
    const daySessions = byDate.get(dateKey) ?? [];
    const minutes = daySessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
    const dominant = (daySessions[0]?.cardioActivity as CardioActivity) || null;
    return { dateKey, minutes, dominant };
  });
  const maxMinutes = Math.max(...dayTotals.map((d) => d.minutes), 1);

  const barWidth = (VIEW_WIDTH - BAR_GAP * 6) / 7;

  if (weekSessions.length === 0) {
    return (
      <div className="rounded-[18px] border border-line bg-panel px-4.5 py-5 text-center">
        <p className="text-[13px] text-dim">Nenhuma sessão de cardio nos últimos 7 dias.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-line bg-panel px-4.5 py-4">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-dim">Últimos 7 dias</div>
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[26px] font-bold leading-none">{formatDuration(totalMinutes)}</span>
        <span className="text-[12px] font-semibold text-dim">
          🔥 {Math.round(totalCalories)} kcal · {weekSessions.length} {weekSessions.length === 1 ? "sessão" : "sessões"}
        </span>
      </div>

      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="mt-3 h-16 w-full" preserveAspectRatio="none">
        {dayTotals.map((d, i) => {
          const x = i * (barWidth + BAR_GAP);
          const h = d.minutes > 0 ? Math.max(4, (d.minutes / maxMinutes) * (VIEW_HEIGHT - 4)) : 3;
          const y = VIEW_HEIGHT - h;
          const color = d.minutes > 0 && d.dominant ? CARDIO_ACTIVITY_COLORS[d.dominant] : "var(--track)";
          return <rect key={d.dateKey} x={x} y={y} width={barWidth} height={h} rx={3} fill={color} />;
        })}
      </svg>
      <div className="mt-1.5 flex justify-between">
        {weekKeys.map((dateKey) => (
          <span key={dateKey} className="text-center text-[10px] text-dim" style={{ width: barWidth }}>
            {formatWeekdayShort(new Date(`${dateKey}T00:00:00`))}
          </span>
        ))}
      </div>
    </div>
  );
}
