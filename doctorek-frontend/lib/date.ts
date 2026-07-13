/**
 * Formats a Date as YYYY-MM-DD using local time components.
 * Never use `toISOString().slice(0, 10)` for calendar dates: it converts
 * to UTC first, which shifts the date by one day for local midnight
 * in any non-UTC timezone.
 */
export function toLocalISODate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
