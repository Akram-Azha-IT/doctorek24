import type { Disponibilite, RendezVous, StatutRdv } from '@/lib/types'

export const STATUT_LABELS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME:   'Confirmé',
  ANNULE:     'Annulé',
  TERMINE:    'Terminé',
}

export const STATUT_BADGE: Record<StatutRdv, { bg: string; color: string }> = {
  EN_ATTENTE: { bg: '#FFF8E6', color: '#E59E00' },
  CONFIRME:   { bg: '#E6F8F0', color: '#009E60' },
  ANNULE:     { bg: '#FFEBEB', color: '#E01E5A' },
  TERMINE:    { bg: '#F4F4F5', color: '#71717A' },
}

export const STATUT_DOT: Record<StatutRdv, string> = {
  CONFIRME:   '#2EB67D',
  EN_ATTENTE: '#ECB22E',
  ANNULE:     '#E01E5A',
  TERMINE:    '#A0AEC0',
}

export function todayISO(): string {
  return localDateISO(new Date())
}

export function localDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getWeekRange(): { monday: string; sunday: string } {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { monday: localDateISO(monday), sunday: localDateISO(sunday) }
}

export function computeTotalWeekSlots(disponibilites: Disponibilite[]): number {
  return disponibilites.reduce((total, dispo) => {
    const [sh, sm] = dispo.heureDebut.split(':').map(Number)
    const [eh, em] = dispo.heureFin.split(':').map(Number)
    const minutes = eh * 60 + em - (sh * 60 + sm)
    return total + Math.floor(minutes / dispo.dureeConsultation)
  }, 0)
}

export function patientName(rdv: RendezVous): string {
  if (rdv.patientPrenom || rdv.patientNom) {
    return `${rdv.patientPrenom ?? ''} ${rdv.patientNom ?? ''}`.trim()
  }
  return `Patient ${rdv.patientId.slice(0, 8)}…`
}

export function patientInitials(rdv: RendezVous): string {
  if (rdv.patientPrenom || rdv.patientNom) {
    const p = rdv.patientPrenom?.charAt(0) ?? ''
    const n = rdv.patientNom?.charAt(0) ?? ''
    return (p + n).toUpperCase() || '?'
  }
  return rdv.patientId.slice(0, 2).toUpperCase()
}

export function avatarHue(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360
  return h
}
