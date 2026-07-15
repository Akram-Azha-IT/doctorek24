'use client'

import { useState } from 'react'
import { usePatientCarte } from '@/features/admin/hooks'
import { CarteRecto, CarteVerso } from '@/features/carte/components/CarteVirtuelleCard'

interface PatientCartePanelProps {
  patientId: string
  firstName: string
  lastName: string
}

/** Aperçu recto/verso retournable de la carte virtuelle d'un patient (vue admin). */
export function PatientCartePanel({ patientId, firstName, lastName }: PatientCartePanelProps) {
  const { data, isLoading, error } = usePatientCarte(patientId, true)
  const [flipped, setFlipped] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-48 w-80 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex justify-center py-6">
        <p className="text-sm text-zinc-400">Impossible de charger la carte.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div
        style={{
          width: 380,
          aspectRatio: '1.586',
          position: 'relative',
          perspective: '1400px',
          cursor: 'pointer',
          filter: 'drop-shadow(0 12px 28px rgba(0,125,255,0.18))',
        }}
        onClick={() => setFlipped((f) => !f)}
        title="Cliquer pour retourner la carte"
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <CarteRecto carte={data} firstName={firstName} lastName={lastName} />
          <CarteVerso carte={data} firstName={firstName} lastName={lastName} flat />
        </div>
      </div>
      <p className="select-none text-xs font-medium tracking-wider text-zinc-400">
        {flipped ? '← RECTO' : 'VERSO →'} · Cliquez sur la carte pour la retourner
      </p>
    </div>
  )
}
