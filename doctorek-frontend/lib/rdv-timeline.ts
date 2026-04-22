import type { RendezVous } from './types'

export interface GroupedRdvs {
  upcoming: RendezVous[]
  today: RendezVous[]
  past: RendezVous[]
}

function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function compareByDateTimeAsc(a: RendezVous, b: RendezVous): number {
  const byDate = a.dateRdv.localeCompare(b.dateRdv)
  if (byDate !== 0) return byDate
  return a.heureRdv.localeCompare(b.heureRdv)
}

function compareByDateTimeDesc(a: RendezVous, b: RendezVous): number {
  return -compareByDateTimeAsc(a, b)
}

export function groupRdvsBySection(rdvs: readonly RendezVous[], now: Date = new Date()): GroupedRdvs {
  const today = startOfDay(now)
  const upcoming: RendezVous[] = []
  const todayList: RendezVous[] = []
  const past: RendezVous[] = []

  for (const rdv of rdvs) {
    const rdvDate = startOfDay(parseDateLocal(rdv.dateRdv))
    if (rdvDate.getTime() === today.getTime()) {
      todayList.push(rdv)
    } else if (rdvDate.getTime() > today.getTime()) {
      upcoming.push(rdv)
    } else {
      past.push(rdv)
    }
  }

  return {
    upcoming: [...upcoming].sort(compareByDateTimeAsc),
    today: [...todayList].sort(compareByDateTimeAsc),
    past: [...past].sort(compareByDateTimeDesc),
  }
}
