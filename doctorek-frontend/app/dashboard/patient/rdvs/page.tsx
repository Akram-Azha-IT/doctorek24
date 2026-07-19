'use client'

import { useEffect, useState } from 'react'
import { useRdvsPatient, useReprogrammerRdv } from '@/features/agenda/hooks'
import { RdvTimeline } from '@/features/agenda/components/RdvTimeline'
import { useProches } from '@/features/famille/hooks'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { toast } from 'sonner'

const ALL = 'TOUS'

export default function PatientRdvsPage() {
  useRoleGuard('PATIENT')

  const [patientId, setPatientId] = useState('')
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'PATIENT' && session.id) {
      setPatientId(session.id)
      setSelected(session.id)
    }
  }, [])

  const { data: profils } = useProches(!!patientId)
  const hasProches = (profils?.length ?? 0) > 1

  const membres = selected === ALL
    ? (profils ?? [])
    : (profils ?? []).filter((p) => p.id === selected)

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      {/* Compte famille : filtre par membre */}
      {hasProches && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(profils ?? []).map((profil) => (
            <FilterChip
              key={profil.id}
              active={selected === profil.id}
              onClick={() => setSelected(profil.id)}
            >
              {profil.self ? 'Moi' : profil.prenom}
            </FilterChip>
          ))}
          <FilterChip active={selected === ALL} onClick={() => setSelected(ALL)}>
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
      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        active
          ? 'bg-[#007DFF] text-white border-[#007DFF]'
          : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500'
      }`}
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

  function handleReprogrammer(id: string, date: string, heure: string) {
    reprogrammer({ id, date, heure }, {
      onSuccess: () => toast.success('Rendez-vous reprogrammé'),
      onError: () => toast.error('Erreur lors de la reprogrammation'),
    })
  }

  return (
    <section className="mb-8">
      {showLabel && (
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
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
        />
      )}
    </section>
  )
}

function RdvSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-[84px] animate-pulse rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden flex"
        >
          <div className="w-16 shrink-0 bg-[#DFEFFE]/60" />
          <div className="flex-1 p-4 space-y-2">
            <div className="h-3 w-40 rounded bg-zinc-100" />
            <div className="h-2.5 w-24 rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
