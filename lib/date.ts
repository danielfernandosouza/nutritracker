export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Nomes completos dos dias da semana, indexados como `Date.getDay()` (0 = domingo). */
export const WEEKDAY_LABELS_FULL = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

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

/** Domingo da semana de calendário (domingo-sábado) que contém `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

/** As 7 chaves de data (domingo→sábado) da semana de calendário deslocada `weekOffset` semanas a partir de hoje. */
export function weekDateKeys(weekOffset: number, from: Date = new Date()): string[] {
  const sunday = startOfWeek(from);
  sunday.setDate(sunday.getDate() + weekOffset * 7);
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(d.getDate() + i);
    keys.push(toDateKey(d));
  }
  return keys;
}
