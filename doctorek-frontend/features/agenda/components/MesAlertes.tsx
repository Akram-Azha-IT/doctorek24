'use client'

import Link from 'next/link'
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
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <Link
          href={`/medecins/${inscription.medecinId}/rdv`}
          className="truncate text-sm font-semibold text-[#010C2D] hover:text-[#007DFF]"
        >
          {nom}
        </Link>
        <p className="mt-0.5 text-xs text-[#6B7A99]">
          Du {formatDateFR(inscription.dateDebut)} au {formatDateFR(inscription.dateFin)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onQuitter(inscription.id)}
        disabled={isPending}
        className="shrink-0 rounded-xl border border-[#E3E8EF] bg-white px-3 py-1.5 text-xs font-semibold text-[#465058] transition-colors hover:border-[#E01E5A]/40 hover:text-[#E01E5A] disabled:opacity-50"
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
 * concerné — le patient ne pouvait ni se rappeler ce qu'il suivait, ni s'en retirer.
 * Masquée quand il n'attend rien, pour ne pas alourdir la page.
 */
export function MesAlertes({ patientId }: { readonly patientId: string }) {
  const { data: inscriptions } = useListeAttente(patientId)
  const quitter = useQuitterListeAttente(patientId)

  if (!inscriptions || inscriptions.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
        Places que j&apos;attends
      </h2>
      <ul className="divide-y divide-[#F0F2F5] overflow-hidden rounded-2xl border border-[#EEF1F6] bg-white">
        {inscriptions.map((i) => (
          <LigneAlerte
            key={i.id}
            inscription={i}
            onQuitter={quitter.mutate}
            isPending={quitter.isPending}
          />
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-[#8A97A6]">
        Vous serez prévenu par e-mail et notification dès qu&apos;une place se libère.
      </p>
    </section>
  )
}
