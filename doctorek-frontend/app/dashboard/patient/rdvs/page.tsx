'use client'

import { useState } from 'react'
import { useRdvsPatient, useReprogrammerRdv, useAnnulerRdv } from '@/features/agenda/hooks'
import { MesAlertes } from '@/features/agenda/components/MesAlertes'
import { RdvTimeline } from '@/features/agenda/components/RdvTimeline'
import { useProches } from '@/features/famille/hooks'
import { useSession } from '@/lib/useSession'
import { useRoleGuard } from '@/lib/useRoleGuard'
import type { Proche } from '@/lib/types'
import { toast } from 'sonner'

const ALL = 'TOUS'

export default function PatientRdvsPage() {
  useRoleGuard('PATIENT')

  const session = useSession()
  const patientId = session?.role === 'PATIENT' && session.id ? session.id : ''
  const [selectedOverride, setSelectedOverride] = useState<string>('')
  const selected = selectedOverride || patientId

  const { data: profils } = useProches(!!patientId)
  const fallbackSelf: Proche | null = patientId
    ? {
        id: patientId,
        nom: session?.lastName ?? '',
        prenom: session?.firstName ?? '',
        dateNaissance: null,
        mineur: false,
        self: true,
        role: null,
        declarationRepresentantLegal: null,
      }
    : null
  const profilsDisponibles = profils?.length ? profils : fallbackSelf ? [fallbackSelf] : []
  const hasProches = profilsDisponibles.length > 1

  const membres = selected === ALL
    ? profilsDisponibles
    : profilsDisponibles.filter((profil) => profil.id === selected)

  return (
    <div className="mx-auto w-full max-w-[1160px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-4">
        <h1 className="font-heading text-[30px] font-bold leading-tight tracking-[-0.03em] text-[#010C2D] sm:text-[36px]">
          Mes rendez-vous
        </h1>
        <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[#52627A]">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2EB67D]" aria-hidden="true" />
          Gérez vos consultations et préparez chaque rendez-vous en toute sérénité.
        </p>
      </header>

      {hasProches && (
        <div className="mb-5 inline-flex max-w-full overflow-x-auto rounded-xl border border-[#CFD8E6] bg-white p-0.5 shadow-[0_1px_2px_rgba(1,12,45,0.04)]" aria-label="Afficher les rendez-vous de">
          {profilsDisponibles.map((profil) => (
            <FilterChip
              key={profil.id}
              active={selected === profil.id}
              onClick={() => setSelectedOverride(profil.id)}
            >
              {profil.self ? 'Moi' : profil.prenom}
            </FilterChip>
          ))}
          <FilterChip active={selected === ALL} onClick={() => setSelectedOverride(ALL)}>
            Toute la famille
          </FilterChip>
        </div>
      )}

      {patientId &&
        membres.map((membre) => (
          <MemberRdvSection
            key={membre.id}
            patientId={membre.id}
            label={membre.self ? null : `Pour : ${membre.prenom} ${membre.nom}`}
            showLabel={selected === ALL || !membre.self}
          />
        ))}

      {patientId && <MesAlertes patientId={patientId} />}

      {!patientId && <RdvSkeleton />}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 shrink-0 rounded-[9px] px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/35 ${
        active
          ? 'bg-[#007DFF] text-white shadow-sm'
          : 'bg-white text-[#34425A] hover:bg-[#F3F7FC]'
      }`}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

function MemberRdvSection({
  patientId,
  label,
  showLabel,
}: {
  patientId: string
  label: string | null
  showLabel: boolean
}) {
  const { data: rdvs, isLoading, isError } = useRdvsPatient(patientId)
  const { mutate: reprogrammer, isPending: isReprogramming } = useReprogrammerRdv(patientId)
  const { mutate: annuler, isPending: isCancelling } = useAnnulerRdv(patientId)

  function handleAnnuler(id: string) {
    annuler(id, {
      onSuccess: () => toast.success('Rendez-vous annulé'),
      onError: () => toast.error("Impossible d'annuler ce rendez-vous"),
    })
  }

  function handleReprogrammer(id: string, date: string, heure: string) {
    reprogrammer({ id, date, heure }, {
      onSuccess: () => toast.success('Rendez-vous reprogrammé'),
      onError: () => toast.error('Erreur lors de la reprogrammation'),
    })
  }

  return (
    <section className="mb-7">
      {showLabel && (
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71809A]">
          {label ?? 'Mes rendez-vous'}
        </h2>
      )}

      {isLoading && <RdvSkeleton />}

      {isError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm text-red-600">Impossible de charger les rendez-vous.</p>
        </div>
      )}

      {!isLoading && !isError && rdvs && (
        <RdvTimeline
          rdvs={rdvs}
          isReprogramming={isReprogramming}
          onReprogrammer={handleReprogrammer}
          isCancelling={isCancelling}
          onAnnuler={handleAnnuler}
        />
      )}
    </section>
  )
}

function RdvSkeleton() {
  return (
    <div className="space-y-5" aria-label="Chargement des rendez-vous">
      <div className="h-6 w-72 max-w-full animate-pulse rounded-md bg-[#DCE9FA]" />
      <div className="h-56 animate-pulse rounded-2xl border border-[#DCE4EF] bg-white" />
      <div className="h-52 animate-pulse rounded-2xl border border-[#DCE4EF] bg-white" />
    </div>
  )
}
