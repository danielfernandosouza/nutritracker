/** Parses a rest string like "60s", "90s" or a range like "30-45s" into a single target in seconds. */
export function parseRestSeconds(rest: string): number {
  const numbers = rest.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length === 0) return 60;
  if (numbers.length === 1) return numbers[0];
  return Math.round((numbers[0] + numbers[1]) / 2);
}

export function formatRestSeconds(seconds: number): string {
  return `${seconds}s`;
}

export const REST_PRESETS = [30, 45, 60, 75, 90, 120] as const;
