export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function formatDateLabel(date: Date): string {
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function isToday(date: Date): boolean {
  const t = new Date();
  return date.toDateString() === t.toDateString();
}

const DAYS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

export function formatWeekdayShort(date: Date): string {
  return DAYS_SHORT[date.getDay()];
}

/** Last `count` date keys ending today (inclusive), oldest first. */
export function lastDateKeys(count: number, from: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}
