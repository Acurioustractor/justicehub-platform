import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

export function formatNumber(value: number): string {
  return value.toLocaleString()
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}