'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRdvsPatient } from '@/features/agenda/hooks'
import { useMedecin } from '@/features/annuaire/hooks'
import { useCarteByPatient, useUpdateCarte } from '@/features/carte/hooks'
import CarteVirtuelleCard from '@/features/carte/components/CarteVirtuelleCard'
import { getSession, saveSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import type { RendezVous, StatutRdv } from '@/lib/types'

const STATUT_LABELS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
}

const STATUT_COLORS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  CONFIRME: 'bg-emerald-100 text-emerald-700',
  ANNULE: 'bg-red-100 text-red-600',
  TERMINE: 'bg-zinc-100 text-zinc-500',
}

function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function formatDateFR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function calcAge(dateNaissance: string): number {
  const birth = new Date(dateNaissance)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}

function UpcomingRdvRow({ rdv }: { rdv: RendezVous }) {
  const { data: medecin } = useMedecin(rdv.medecinId)
  const medecinNom = medecin ? `Dr. ${medecin.firstName} ${medecin.lastName}` : 'Médecin...'
  const isNext = rdv.statut === 'CONFIRME'

  return (
    <div className="flex items-center justify-between py-4 border-b border-[#F0F2F5] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#007DFF]/10 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#333333]">{rdv.motif ?? 'Consultation'}</p>
          <p className="text-xs text-[#465058] mt-0.5">
            {medecinNom} · {formatDateShort(rdv.dateRdv)} · {rdv.heureRdv}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isNext ? (
          <Link
            href="/dashboard/patient/rdvs"
            className="flex items-center gap-1.5 rounded-full bg-[#007DFF] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#00263C] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            Rejoindre
          </Link>
        ) : (
          <Link
            href="/dashboard/patient/rdvs"
            className="rounded-full border border-[#007DFF] px-4 py-1.5 text-xs font-semibold text-[#007DFF] hover:bg-[#007DFF]/5 transition-colors"
          >
            Détails
          </Link>
        )}
      </div>
    </div>
  )
}

function RecentRdvRow({ rdv }: { rdv: RendezVous }) {
  const { data: medecin } = useMedecin(rdv.medecinId)
  const medecinNom = medecin ? `Dr. ${medecin.firstName} ${medecin.lastName}` : 'Médecin...'
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F0F2F5] last:border-0">
      <div>
        <p className="text-sm font-medium text-[#333333]">{medecinNom}</p>
        <p className="text-xs text-[#465058] mt-0.5">{formatDateFR(rdv.dateRdv)} · {rdv.heureRdv}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUT_COLORS[rdv.statut]}`}>
        {STATUT_LABELS[rdv.statut]}
      </span>
    </div>
  )
}

export default function DashboardPatientPage() {
  useRoleGuard('PATIENT')

  const [patientId, setPatientId] = useState('')
  const [firstName, setFirstName] = useState<string | null>(null)
  const [lastName, setLastName] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'PATIENT' && session.id) {
      setPatientId(session.id)
      setFirstName(session.firstName ?? null)
      setLastName(session.lastName ?? null)
    }
  }, [])

  const { data: rdvs = [], isLoading } = useRdvsPatient(patientId)
  const { data: carte, isLoading: carteLoading, isError: carteError } = useCarteByPatient(patientId || null)
  const updateCarte = useUpdateCarte(patientId)

  useEffect(() => {
    if (!carte?.photoUrl) return
    const session = getSession()
    if (session && session.photoUrl !== carte.photoUrl) saveSession({ ...session, photoUrl: carte.photoUrl })
  }, [carte?.photoUrl])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !carte) return
    const reader = new FileReader()
    reader.onload = () => {
      const photoUrl = reader.result as string
      updateCarte.mutate({
        patientId: carte.patientId,
        dateNaissance: carte.dateNaissance,
        genre: carte.genre,
        nationalite: carte.nationalite,
        numIdentite: carte.numIdentite,
        photoUrl,
        telephone: carte.telephone,
        adresseRue: carte.adresseRue,
        adresseVille: carte.adresseVille,
        adressePays: carte.adressePays,
        groupeSanguin: carte.groupeSanguin,
        tailleCm: carte.tailleCm,
        poidsKg: carte.poidsKg,
        donneurOrganes: carte.donneurOrganes,
        allergies: carte.allergies,
        maladiesChroniques: carte.maladiesChroniques,
        medicamentsActuels: carte.medicamentsActuels,
        antecedentsChirurgicaux: carte.antecedentsChirurgicaux,
        vaccinations: carte.vaccinations,
        antecedentsFamiliaux: carte.antecedentsFamiliaux,
        contactsUrgence: carte.contactsUrgence,
        medecinTraitant: carte.medecinTraitant,
        assuranceNom: carte.assuranceNom,
        assuranceNumero: carte.assuranceNumero,
        assuranceDetails: carte.assuranceDetails,
      }, {
        onSuccess: () => {
          const session = getSession()
          if (session) saveSession({ ...session, photoUrl })
        },
      })
    }
    reader.readAsDataURL(file)
  }

  const prochainRdvs = rdvs
    .filter((r) => r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRME')
    .sort((a, b) => a.dateRdv.localeCompare(b.dateRdv))
    .slice(0, 3)

  const derniersRdvs = rdvs
    .slice()
    .sort((a, b) => b.dateRdv.localeCompare(a.dateRdv))
    .slice(0, 3)

  const totalRdvs = rdvs.length
  const rdvsAVenir = rdvs.filter((r) => r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRME').length
  const hasCarte = !carteError && !!carte

  if (!patientId || isLoading) {
    return (
      <div className="p-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-[#F0F2F5]">
      <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Welcome bar */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#333333]">
              Bonjour {firstName ?? 'Patient'},
            </h1>
            <p className="text-sm text-[#465058] mt-1">
              {rdvsAVenir === 0
                ? "Vous n'avez aucun rendez-vous à venir aujourd'hui"
                : `Vous avez ${rdvsAVenir} rendez-vous à venir`}
            </p>
          </div>

          <div className="flex gap-6">
            {/* ── Left / Main column ── */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-4">
                {/* Consultations */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#007DFF]/10 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-[#333333]">Consultations</span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                  {derniersRdvs[0] && (
                    <p className="text-xs text-[#465058] mb-1">Dernière le {formatDateShort(derniersRdvs[0].dateRdv)}</p>
                  )}
                  <p className="text-2xl font-bold text-[#333333]">{String(totalRdvs).padStart(2, '0')}</p>
                  <p className="text-xs text-[#465058]">total rendez-vous</p>
                </div>

                {/* Carte médicale */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#007DFF]/10 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
                          <rect x="2" y="5" width="20" height="14" rx="2"/>
                          <line x1="2" y1="10" x2="22" y2="10"/>
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-[#333333]">Carte Médicale</span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                  <p className="text-xs text-[#465058] mb-1">{hasCarte ? 'Active' : 'Non configurée'}</p>
                  {hasCarte ? (
                    <p className="text-2xl font-bold text-emerald-600">✓</p>
                  ) : (
                    <Link href="/dashboard/patient/carte" className="mt-1 inline-block text-xs font-semibold text-[#007DFF] hover:underline">
                      Créer ma carte →
                    </Link>
                  )}
                  <p className="text-xs text-[#465058]">{hasCarte ? 'Données médicales sécurisées' : 'Accès rapide à vos données'}</p>
                </div>

                {/* Prochain RDV */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#007DFF]/10 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-[#333333]">Prochain RDV</span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                  {prochainRdvs[0] ? (
                    <>
                      <p className="text-xs text-[#465058] mb-1">{formatDateShort(prochainRdvs[0].dateRdv)}</p>
                      <p className="text-lg font-bold text-[#333333]">{prochainRdvs[0].heureRdv}</p>
                      <p className="text-xs text-[#465058]">{prochainRdvs[0].motif ?? 'Consultation'}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-[#465058] mb-1">Aucun à venir</p>
                      <Link href="/recherche" className="text-xs font-semibold text-[#007DFF] hover:underline">
                        Trouver un médecin →
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-[#333333]">Rendez-vous à venir</h2>
                  <Link href="/dashboard/patient/rdvs" className="text-xs font-semibold text-[#007DFF] hover:underline">
                    Voir tout
                  </Link>
                </div>
                {prochainRdvs.length > 0 ? (
                  <div>
                    {prochainRdvs.map((rdv) => (
                      <UpcomingRdvRow key={rdv.id} rdv={rdv} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F0F2F5] flex items-center justify-center mb-3">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="1.8">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <p className="text-sm text-[#465058]">Aucun rendez-vous à venir</p>
                    <Link href="/recherche" className="mt-2 text-sm font-semibold text-[#007DFF] hover:underline">
                      Prendre un rendez-vous →
                    </Link>
                  </div>
                )}
              </div>

              {/* Carte Médicale Virtuelle */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-[#333333]">Carte Médicale Virtuelle</h2>
                  {hasCarte && (
                    <Link href="/dashboard/patient/carte" className="text-xs font-semibold text-[#007DFF] hover:underline">
                      Modifier
                    </Link>
                  )}
                </div>
                {carteLoading ? (
                  <div className="h-48 animate-pulse rounded-xl bg-[#F0F2F5]" />
                ) : hasCarte ? (
                  <div className="bg-[#010C2D] rounded-xl p-2">
                    <CarteVirtuelleCard carte={carte} firstName={firstName ?? undefined} lastName={lastName ?? undefined} />
                  </div>
                ) : (
                  <div className="rounded-xl bg-gradient-to-br from-[#007DFF] to-[#042651] px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Créez votre carte médicale virtuelle</p>
                      <p className="text-xs text-[#B6DAF7] mt-1">Accédez à vos données médicales partout, partagez avec votre médecin</p>
                    </div>
                    <Link
                      href="/dashboard/patient/carte"
                      className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#007DFF] hover:bg-[#F0F2F5] transition-colors"
                    >
                      Créer ma carte
                    </Link>
                  </div>
                )}
              </div>

              {/* Recent RDVs */}
              {derniersRdvs.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#333333]">Historique des rendez-vous</h2>
                    <Link href="/dashboard/patient/rdvs" className="text-xs font-semibold text-[#007DFF] hover:underline">
                      Voir tout
                    </Link>
                  </div>
                  <div>
                    {derniersRdvs.map((rdv) => (
                      <RecentRdvRow key={rdv.id} rdv={rdv} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right panel ── */}
            <div className="w-72 shrink-0 space-y-4">

              {/* Profile card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <div className="relative inline-block group mb-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#007DFF]/10 border-4 border-[#007DFF]/20 flex items-center justify-center mx-auto">
                    {carte?.photoUrl ? (
                      <img src={carte.photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
                    ) : (
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" fill="#007DFF" opacity="0.5"/>
                        <path d="M4 20 C4 15.6 7.6 12 12 12 C16.4 12 20 15.6 20 20" fill="#007DFF" opacity="0.5"/>
                      </svg>
                    )}
                  </div>
                  {carte && (
                    <>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Changer la photo"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      </button>
                      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#333333]">
                  {firstName ?? ''} {lastName ?? ''}
                </h3>
                {carte?.dateNaissance && (
                  <p className="text-sm text-[#465058] mt-0.5">{calcAge(carte.dateNaissance)} ans</p>
                )}

                {carte && (
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#F0F2F5] pt-4">
                    <div className="text-center">
                      <p className="text-xs font-bold text-[#007DFF]">{carte.groupeSanguin ?? '—'}</p>
                      <p className="text-[10px] text-[#465058] mt-0.5">Groupe</p>
                    </div>
                    <div className="text-center border-x border-[#F0F2F5]">
                      <p className="text-xs font-bold text-[#333333]">{carte.tailleCm ? `${carte.tailleCm} cm` : '—'}</p>
                      <p className="text-[10px] text-[#465058] mt-0.5">Taille</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-[#333333]">{carte.poidsKg ? `${carte.poidsKg} kg` : '—'}</p>
                      <p className="text-[10px] text-[#465058] mt-0.5">Poids</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-1">
                {carte?.maladiesChroniques && carte.maladiesChroniques.length > 0 && (
                  <div className="mb-3 pb-3 border-b border-[#F0F2F5]">
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                      <span className="text-xs font-bold text-[#333333]">Maladies chroniques</span>
                    </div>
                    <ul className="space-y-1">
                      {carte.maladiesChroniques.slice(0, 3).map((m, i) => (
                        <li key={i} className="text-xs text-[#465058] flex items-start gap-1.5">
                          <span className="text-[#007DFF] mt-0.5">·</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  href="/dashboard/patient/carte"
                  className="flex items-center justify-between w-full py-2.5 rounded-lg hover:bg-[#F0F2F5] px-2 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#007DFF]/10 flex items-center justify-center">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2"/>
                        <line x1="2" y1="10" x2="22" y2="10"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[#333333]">Ma Carte Médicale</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#465058" strokeWidth="2" className="group-hover:stroke-[#007DFF] transition-colors">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>

                <Link
                  href="/dashboard/patient/rdvs"
                  className="flex items-center justify-between w-full py-2.5 rounded-lg hover:bg-[#F0F2F5] px-2 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#007DFF]/10 flex items-center justify-center">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[#333333]">Mes Rendez-vous</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#465058" strokeWidth="2" className="group-hover:stroke-[#007DFF] transition-colors">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>

                <Link
                  href="/recherche"
                  className="flex items-center justify-between w-full py-2.5 rounded-lg hover:bg-[#F0F2F5] px-2 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#007DFF]/10 flex items-center justify-center">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-[#333333]">Trouver un Médecin</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#465058" strokeWidth="2" className="group-hover:stroke-[#007DFF] transition-colors">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              </div>

              {/* Promo card */}
              {!hasCarte && (
                <div className="bg-gradient-to-br from-[#007DFF] to-[#042651] rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
                  <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
                  <p className="text-sm font-bold text-white relative">Créez votre carte médicale!</p>
                  <p className="text-xs text-[#B6DAF7] mt-1 relative">Partagez vos données médicales facilement avec vos médecins</p>
                  <Link
                    href="/dashboard/patient/carte"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#007DFF] hover:bg-[#F0F2F5] transition-colors relative"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Créer ma carte
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}
