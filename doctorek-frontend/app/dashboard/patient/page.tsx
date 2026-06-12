'use client'

import { useEffect, useState } from 'react'
import { useRdvsPatient } from '@/features/agenda/hooks'
import { useCarteByPatient } from '@/features/carte/hooks'
import { usePatientProfile, useUpsertPatientProfile } from '@/features/patient/hooks'
import { getSession, saveSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { StatCards } from '@/features/patient/dashboard/components/StatCards'
import { UpcomingAppointments } from '@/features/patient/dashboard/components/UpcomingAppointments'
import { CarteSection } from '@/features/patient/dashboard/components/CarteSection'
import { ProfileSidebar } from '@/features/patient/dashboard/components/ProfileSidebar'

export default function DashboardPatientPage() {
  useRoleGuard('PATIENT')

  const [patientId, setPatientId] = useState('')
  const [firstName, setFirstName] = useState<string | null>(null)
  const [lastName, setLastName] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'PATIENT' && session.id) {
      setPatientId(session.id)
      setFirstName(session.firstName ?? null)
      setLastName(session.lastName ?? null)
    }
  }, [])

  const { data: rdvs = [], isLoading } = useRdvsPatient(patientId)
  const { data: carte, isLoading: carteLoading } = useCarteByPatient(patientId || null)
  const { data: profile } = usePatientProfile(patientId || null)
  const upsertProfile = useUpsertPatientProfile(patientId)

  useEffect(() => {
    if (!profile?.photoUrl) return
    const session = getSession()
    if (session && session.photoUrl !== profile.photoUrl) saveSession({ ...session, photoUrl: profile.photoUrl })
  }, [profile?.photoUrl])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const photoUrl = reader.result as string
      upsertProfile.mutate(
        {
          dateNaissance: profile?.dateNaissance ?? null,
          genre: profile?.genre ?? null,
          nationalite: profile?.nationalite ?? null,
          numIdentite: profile?.numIdentite ?? null,
          photoUrl,
          telephone: profile?.telephone ?? null,
          adresseRue: profile?.adresseRue ?? null,
          adresseVille: profile?.adresseVille ?? null,
          adressePays: profile?.adressePays ?? null,
        },
        {
          onSuccess: () => {
            const session = getSession()
            if (session) saveSession({ ...session, photoUrl })
          },
        }
      )
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
  const hasCarte = !!carte

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

        {/* Welcome — inline, no wrapper component */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#333333]">
            Bonjour {firstName ?? 'Patient'},
          </h1>
          <p className="text-sm text-[#465058] mt-1">
            {rdvsAVenir === 0
              ? "Vous n'avez aucun rendez-vous à venir"
              : `Vous avez ${rdvsAVenir} rendez-vous à venir`}
          </p>
        </div>

        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0 space-y-6">
            <StatCards
              totalRdvs={totalRdvs}
              prochainRdv={prochainRdvs[0]}
              derniersRdvs={derniersRdvs}
            />
            <CarteSection
              carte={carte}
              carteLoading={carteLoading}
              hasCarte={hasCarte}
              profile={profile}
              firstName={firstName}
              lastName={lastName}
            />
            <UpcomingAppointments rdvs={prochainRdvs} />
          </div>

          {/* Profile sidebar — always visible, no toggle */}
          <div className="hidden lg:block shrink-0 w-72 space-y-4">
            <ProfileSidebar
              firstName={firstName}
              lastName={lastName}
              profile={profile}
              carte={carte}
              hasCarte={hasCarte}
              onPhotoChange={handlePhotoChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
