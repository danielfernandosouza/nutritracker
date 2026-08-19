import { toDateKey } from "@/lib/date";

/** Consecutive-day streak ending today (or yesterday, so it doesn't zero out before today is logged). */
export function computeStreakFromDates(dates: Set<string>): number {
  const cursor = new Date();
  if (!dates.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dates.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
