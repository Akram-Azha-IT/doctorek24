'use client'

import Link from 'next/link'
import { BellRing } from 'lucide-react'
import { useListeAttente, useQuitterListeAttente } from '@/features/agenda/hooks'
import { useMedecin } from '@/features/annuaire/hooks'
import { formatDateFR } from './ListeAttenteForm'
import type { ListeAttente } from '@/lib/types'

interface LigneProps {
  readonly inscription: ListeAttente
  readonly onQuitter: (id: string) => void
  readonly isPending: boolean
}

function LigneAlerte({ inscription, onQuitter, isPending }: LigneProps) {
  const { data: medecin } = useMedecin(inscription.medecinId)
  const nom = medecin ? `Dr. ${medecin.firstName} ${medecin.lastName}` : 'Chargement…'

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7E4] text-[#F5A623]">
          <BellRing className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <Link
            href={`/medecins/${inscription.medecinId}/rdv`}
            className="block truncate text-sm font-bold text-[#010C2D] hover:text-[#007DFF]"
          >
            {nom}
          </Link>
          <p className="mt-1 text-xs text-[#64748B]">
            Du {formatDateFR(inscription.dateDebut)} au {formatDateFR(inscription.dateFin)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onQuitter(inscription.id)}
        disabled={isPending}
        className="min-h-10 shrink-0 rounded-xl border border-[#CFD8E6] bg-white px-4 text-sm font-semibold text-[#007DFF] transition-colors hover:border-[#007DFF] hover:bg-[#F7FAFE] disabled:opacity-50"
      >
        Retirer
      </button>
    </li>
  )
}

/**
 * Alertes actives du patient : les médecins dont il attend une annulation.
 *
 * <p>Sans cette liste, une inscription n'était visible que sur la page du médecin
 * concerné. Le patient ne pouvait ni se rappeler ce qu'il suivait, ni s'en retirer.
 * Masquée quand il n'attend rien, pour ne pas alourdir la page.
 */
export function MesAlertes({ patientId }: { readonly patientId: string }) {
  const { data: inscriptions } = useListeAttente(patientId)
  const quitter = useQuitterListeAttente(patientId)

  if (!inscriptions || inscriptions.length === 0) return null

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-[#D7E0EC] bg-white shadow-[0_5px_18px_rgba(1,38,60,0.04)]">
      <div className="border-b border-[#E5EAF1] px-5 py-4">
        <h2 className="font-heading text-lg font-bold text-[#010C2D]">Mes alertes de disponibilité</h2>
      </div>
      <ul className="divide-y divide-[#E5EAF1]">
        {inscriptions.map((i) => (
          <LigneAlerte
            key={i.id}
            inscription={i}
            onQuitter={quitter.mutate}
            isPending={quitter.isPending}
          />
        ))}
      </ul>
      <p className="border-t border-[#E5EAF1] px-5 py-3 text-xs leading-5 text-[#71809A]">
        Vous serez prévenu par e-mail et notification dès qu&apos;une place se libère.
      </p>
    </section>
  )
}
