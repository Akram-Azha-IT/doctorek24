'use client'

import Link from 'next/link'
import type { MedecinProfile } from '@/lib/types'
import { MedecinAvatar } from './MedecinAvatar'

interface MedecinCardProps {
  medecin: MedecinProfile
  availableToday?: boolean
}

export function MedecinCard({ medecin, availableToday }: MedecinCardProps) {
  const accepte = medecin.acceptNouveauxPatients !== false

  return (
    <Link href={`/medecins/${medecin.id}`} className="block group">
      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-4 transition-shadow hover:shadow-md">
        <MedecinAvatar firstName={medecin.firstName} lastName={medecin.lastName} photoUrl={medecin.photoUrl ?? null} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
              Dr. {medecin.firstName} {medecin.lastName}
            </p>
            {medecin.secteurTarifaire && (
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                S{medecin.secteurTarifaire}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{medecin.specialite}</p>
          <p className="text-xs text-zinc-400 mt-0.5 truncate">
            {medecin.adresse}, {medecin.ville}
          </p>
          {availableToday && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Disponible aujourd&apos;hui
            </span>
          )}
        </div>

        <div className="shrink-0">
          <span className={`w-2.5 h-2.5 rounded-full block ${accepte ? 'bg-emerald-500' : 'bg-red-400'}`}
            title={accepte ? 'Accepte nouveaux patients' : 'N\'accepte pas de nouveaux patients'} />
        </div>
      </div>
    </Link>
  )
}
