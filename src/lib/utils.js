import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// date-fns throws on an invalid date, which takes down the whole render tree.
export function safeFormatDate(value, pattern = 'MMM d, yyyy', fallback = '—') {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : format(date, pattern)
}

// "1 invoice", "2 invoices", "0 invoices".
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${Number(count) === 1 ? singular : plural}`
}
