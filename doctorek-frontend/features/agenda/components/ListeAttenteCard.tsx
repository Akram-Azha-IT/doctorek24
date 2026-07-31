'use client'

import { ListeAttenteForm } from './ListeAttenteForm'

interface ListeAttenteCardProps {
  readonly medecinId: string
  readonly patientId: string
  readonly medecinNom?: string
}

/**
 * Inscription à la liste d'attente, sur la page de rendez-vous d'un médecin.
 *
 * <p>Proposée sous les créneaux : c'est le recours quand aucune date ne convient,
 * pas une alternative à la réservation. Le même formulaire s'ouvre en fenêtre depuis
 * les résultats de recherche, où le patient rencontre ce besoin plus souvent.
 */
export function ListeAttenteCard({ medecinId, patientId, medecinNom }: ListeAttenteCardProps) {
  return (
    <section className="rounded-2xl border border-[#EEF1F6] bg-white p-5">
      <p className="text-sm font-semibold text-[#010C2D]">
        Aucune date ne vous convient{medecinNom ? ` chez ${medecinNom}` : ''} ?
      </p>
      <p className="mt-1 mb-4 text-xs text-[#6B7A99]">
        Soyez prévenu dès qu&apos;une place se libère sur la période qui vous intéresse.
      </p>

      <ListeAttenteForm medecinId={medecinId} patientId={patientId} />
    </section>
  )
}
