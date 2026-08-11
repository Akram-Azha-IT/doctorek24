import type { RendezVous } from '@/lib/types'

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

/** Fin du créneau réservé : début + durée. */
function finDeCreneau(rdv: RendezVous): Date {
  const [year, month, day] = rdv.dateRdv.split('-').map(Number)
  const [heure, minute] = rdv.heureRdv.split(':').map(Number)
  return new Date(year, month - 1, day, heure, minute + (rdv.duree || 0))
}

/**
 * Statut à afficher, l'heure faisant foi.
 *
 * La clôture côté serveur passe à la minute : entre la fin d'une consultation et le
 * tick suivant, un rendez-vous écoulé serait encore annoncé « Confirmé », avec ses
 * boutons d'annulation. Les anciennes données, antérieures à la clôture automatique,
 * poseraient le même problème indéfiniment.
 */
export function statutAffiche(rdv: RendezVous, now: Date = new Date()): RendezVous['statut'] {
  const enCours = rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME'
  if (enCours && finDeCreneau(rdv) <= now) return 'TERMINE'
  return rdv.statut
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
