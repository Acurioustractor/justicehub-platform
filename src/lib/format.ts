/**
 * Format a number as a compact currency string.
 * $1,234 -> "$1K", $1,234,567 -> "$1.2M", $1,234,567,890 -> "$1.2B"
 */
export function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
