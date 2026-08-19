import { prisma } from "@/lib/db";
import { toDateKey } from "@/lib/date";
import { MealIcon } from "@/components/MealIcon";

export const dynamic = "force-dynamic";

function formatHistoryDate(dateKey: string, todayKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (dateKey === todayKey) return "Hoje";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === toDateKey(yesterday)) return "Ontem";

  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${days[date.getDay()]}, ${d} ${months[m - 1]}`;
}

export default async function HistoryPage() {
  const meals = await prisma.meal.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "asc" }],
    take: 300,
  });

  const todayKey = toDateKey(new Date());

  const byDate = new Map<string, typeof meals>();
  for (const meal of meals) {
    const list = byDate.get(meal.date) ?? [];
    list.push(meal);
    byDate.set(meal.date, list);
  }

  const days = Array.from(byDate.entries()).slice(0, 30);

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="font-display mb-5 text-[22px] font-bold">Histórico</div>

      {days.length === 0 && <p className="text-sm text-dim">Nenhuma refeição registrada ainda.</p>}

      {days.map(([dateKey, dayMeals]) => {
        const totalKcal = dayMeals.reduce((acc, m) => acc + m.calories, 0);
        return (
          <div key={dateKey} className="mb-6">
            <div className="mb-2.5 flex items-baseline justify-between">
              <div className="text-[15px] font-bold">{formatHistoryDate(dateKey, todayKey)}</div>
              <div className="num text-[13px] text-dim">{Math.round(totalKcal)} kcal</div>
            </div>
            <div className="flex flex-col gap-2">
              {dayMeals.map((meal) => (
                <div key={meal.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-3.5 py-2.5">
                  <MealIcon photo={meal.photo} emoji={meal.emoji} size={34} rounded="rounded-lg" />
                  <div className="min-w-0 flex-1 truncate text-[13px] font-medium">{meal.name}</div>
                  <div className="num min-w-[44px] text-right text-[13px] font-bold">{Math.round(meal.calories)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
