export type SetHistoryEntry = { date: string; weightKg: number | null };

/**
 * Avisa pra aumentar a carga quando ela ficou parada nas últimas 2 semanas. Se o peso já subiu
 * em mais de 2 registros nesse período, a progressão já está acontecendo — não precisa avisar.
 */
export function computeProgressionNudge(history: SetHistoryEntry[]): boolean {
  const weighted = history.filter((h): h is { date: string; weightKg: number } => h.weightKg !== null);
  if (weighted.length < 2) return false;

  const sorted = [...weighted].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const oldest = new Date(sorted[0].date);
  const newest = new Date(sorted[sorted.length - 1].date);
  // Only worth nudging once there's at least ~2 weeks of history to judge stagnation against.
  const spanDays = (newest.getTime() - oldest.getTime()) / 86_400_000;
  if (spanDays < 13) return false;

  let increases = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].weightKg > sorted[i - 1].weightKg) increases++;
  }

  return increases <= 2;
}
