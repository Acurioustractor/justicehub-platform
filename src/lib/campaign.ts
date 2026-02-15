export function calculateDaysUntil(dateIso: string, referenceDate = new Date()): number {
  const target = new Date(dateIso + "T00:00:00");
  const diff = target.getTime() - referenceDate.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-AU").format(value);
}

export function calculateProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}
