export type DisponibiliteFilter = 'all' | 'today' | 'week'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function formatDateISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayISO(now: Date = new Date()): string {
  return formatDateISO(now)
}

export function nextNDaysISO(days: number, now: Date = new Date()): string[] {
  const result: string[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    result.push(formatDateISO(d))
  }
  return result
}
