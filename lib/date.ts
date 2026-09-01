// O Brasil não tem mais horário de verão desde 2019, então São Paulo é sempre UTC-3, sem
// transições de DST para se preocupar. Isso permite extrair ano/mês/dia/dia-da-semana de
// qualquer instante de forma determinística, não importa em qual fuso o processo está rodando
// — sem isso, os getters locais de `Date` divergiam entre o navegador (BRT) e o servidor da
// Vercel (UTC), fazendo o app achar que já era "amanhã" toda noite entre ~21h e meia-noite BRT.
const SAO_PAULO_OFFSET_MS = -3 * 60 * 60 * 1000;

function saoPauloParts(date: Date) {
  const shifted = new Date(date.getTime() + SAO_PAULO_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
  };
}

export function toDateKey(date: Date): string {
  const { year, month, day } = saoPauloParts(date);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
  const { weekday, day, month } = saoPauloParts(date);
  return `${DAYS[weekday]}, ${day} ${MONTHS[month]}`;
}

export function isToday(date: Date): boolean {
  return toDateKey(date) === toDateKey(new Date());
}

const DAYS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];
const DAY_MS = 24 * 60 * 60 * 1000;

export function formatWeekdayShort(date: Date): string {
  return DAYS_SHORT[saoPauloParts(date).weekday];
}

/** Last `count` date keys ending today (inclusive), oldest first. */
export function lastDateKeys(count: number, from: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(toDateKey(new Date(from.getTime() - i * DAY_MS)));
  }
  return keys;
}

/** Domingo da semana de calendário (domingo-sábado, fuso São Paulo) que contém `date`. */
export function startOfWeek(date: Date): Date {
  return new Date(date.getTime() - saoPauloParts(date).weekday * DAY_MS);
}

/** As 7 chaves de data (domingo→sábado) da semana de calendário deslocada `weekOffset` semanas a partir de hoje. */
export function weekDateKeys(weekOffset: number, from: Date = new Date()): string[] {
  const sunday = startOfWeek(from);
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    keys.push(toDateKey(new Date(sunday.getTime() + (weekOffset * 7 + i) * DAY_MS)));
  }
  return keys;
}
