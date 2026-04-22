import { apiFetch } from '@/lib/api-client'
import { getCreneaux } from '@/features/agenda/api'
import type { MedecinProfile } from '@/lib/types'
import {
  type DisponibiliteFilter,
  nextNDaysISO,
  todayISO,
} from '@/lib/disponibilite'

export function searchMedecins(specialite: string, ville: string): Promise<MedecinProfile[]> {
  const params = new URLSearchParams()
  if (specialite.trim()) params.set('specialite', specialite.trim())
  if (ville.trim()) params.set('ville', ville.trim())
  const qs = params.toString()
  return apiFetch<MedecinProfile[]>(`/api/v1/annuaire/medecins${qs ? `?${qs}` : ''}`)
}

export function getMedecin(id: string): Promise<MedecinProfile> {
  return apiFetch<MedecinProfile>(`/api/v1/annuaire/medecins/${id}`)
}

export interface SearchMedecinsResult {
  medecins: MedecinProfile[]
  availableTodayIds: Set<string>
}

async function hasAvailability(medecinId: string, dates: string[]): Promise<boolean> {
  for (const date of dates) {
    try {
      const creneaux = await getCreneaux(medecinId, date)
      if (creneaux.some((c) => c.disponible)) return true
    } catch {
      // ignore per-date errors; continue checking remaining dates
    }
  }
  return false
}

export async function searchMedecinsDisponibles(
  specialite: string,
  ville: string,
  filter: DisponibiliteFilter,
): Promise<SearchMedecinsResult> {
  const medecins = await searchMedecins(specialite, ville)
  const today = todayISO()

  const availabilityToday = await Promise.all(
    medecins.map((m) => hasAvailability(m.id, [today])),
  )
  const availableTodayIds = new Set(
    medecins.filter((_, i) => availabilityToday[i]).map((m) => m.id),
  )

  if (filter === 'today') {
    return {
      medecins: medecins.filter((m) => availableTodayIds.has(m.id)),
      availableTodayIds,
    }
  }

  if (filter === 'week') {
    const weekDates = nextNDaysISO(7)
    const availabilityWeek = await Promise.all(
      medecins.map((m, i) =>
        availabilityToday[i] ? Promise.resolve(true) : hasAvailability(m.id, weekDates.slice(1)),
      ),
    )
    return {
      medecins: medecins.filter((_, i) => availabilityWeek[i]),
      availableTodayIds,
    }
  }

  return { medecins, availableTodayIds }
}
