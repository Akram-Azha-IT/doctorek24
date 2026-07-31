'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useListeAttente, useRejoindreListeAttente, useQuitterListeAttente } from '@/features/agenda/hooks'

const JOURS_PAR_DEFAUT = 30

function isoDansNJours(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function formatDateFR(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(
    new Date(y, m - 1, d),
  )
}

const CHAMP =
  'rounded-xl border border-[#E3E8EF] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#333333] focus:border-[#007DFF] focus:outline-none'
const LABEL =
  'flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#8A97A6]'

interface ListeAttenteFormProps {
  readonly medecinId: string
  /** Null quand la session n'est pas patient : on invite alors à se connecter. */
  readonly patientId: string | null
  readonly returnUrl?: string
  readonly onDone?: () => void
}

/**
 * Corps de l'inscription en liste d'attente.
 *
 * <p>Partagé par la carte de la page rendez-vous et par la fenêtre ouverte depuis les
 * résultats de recherche : le patient rencontre le besoin à ces deux endroits, et la
 * règle du premier arrivé doit s'énoncer de la même façon dans les deux.
 */
export function ListeAttenteForm({
  medecinId,
  patientId,
  returnUrl,
  onDone,
}: ListeAttenteFormProps) {
  const { data: inscriptions } = useListeAttente(patientId ?? '')
  const rejoindre = useRejoindreListeAttente(patientId ?? '')
  const quitter = useQuitterListeAttente(patientId ?? '')

  const [dateDebut, setDateDebut] = useState(() => isoDansNJours(0))
  const [dateFin, setDateFin] = useState(() => isoDansNJours(JOURS_PAR_DEFAUT))

  if (!patientId) {
    const cible = returnUrl ? `?redirect=${encodeURIComponent(returnUrl)}` : ''
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-[#6B7A99]">
          Connectez-vous pour être prévenu dès qu&apos;une place se libère.
        </p>
        <Link
          href={`/login${cible}`}
          className="self-start rounded-xl bg-[#007DFF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00263C]"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  const inscription = inscriptions?.find((i) => i.medecinId === medecinId)

  if (inscription) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-[#010C2D]">Vous êtes en liste d&apos;attente</p>
        <p className="text-xs text-[#6B7A99]">
          Du {formatDateFR(inscription.dateDebut)} au {formatDateFR(inscription.dateFin)}. Vous
          serez prévenu dès qu&apos;une place se libère.
        </p>
        <button
          type="button"
          onClick={() => {
            quitter.mutate(inscription.id)
            onDone?.()
          }}
          disabled={quitter.isPending}
          className="self-start rounded-xl border border-[#E3E8EF] bg-white px-3 py-1.5 text-xs font-semibold text-[#465058] transition-colors hover:border-[#E01E5A]/40 hover:text-[#E01E5A] disabled:opacity-50"
        >
          {quitter.isPending ? 'Retrait…' : 'Quitter la liste'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className={LABEL}>
          <span>À partir du</span>
          <input
            type="date"
            value={dateDebut}
            min={isoDansNJours(0)}
            onChange={(e) => setDateDebut(e.target.value)}
            className={CHAMP}
          />
        </label>
        <label className={LABEL}>
          <span>Jusqu&apos;au</span>
          <input
            type="date"
            value={dateFin}
            min={dateDebut}
            onChange={(e) => setDateFin(e.target.value)}
            className={CHAMP}
          />
        </label>
        <button
          type="button"
          disabled={rejoindre.isPending || dateFin < dateDebut}
          onClick={() =>
            rejoindre.mutate(
              { medecinId, patientId, dateDebut, dateFin },
              { onSuccess: () => onDone?.() },
            )
          }
          className="rounded-xl bg-[#007DFF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00263C] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {rejoindre.isPending ? 'Inscription…' : 'Me prévenir'}
        </button>
      </div>

      {rejoindre.isError && (
        <p className="rounded-xl border border-[#FFDEDE] bg-[#FFF5F5] px-3 py-2 text-xs text-[#B4232A]">
          Inscription impossible. Vérifiez la période choisie.
        </p>
      )}

      {/* Annoncer la règle avant l'inscription : celui qui arrive second doit
          comprendre pourquoi la place lui a échappé. */}
      <p className="text-[11px] text-[#8A97A6]">
        La place revient au premier qui réserve. Vous restez inscrit si quelqu&apos;un vous devance.
      </p>
    </div>
  )
}
