'use client'

import { useState } from 'react'
import { useListeAttente, useRejoindreListeAttente, useQuitterListeAttente } from '@/features/agenda/hooks'

const JOURS_PAR_DEFAUT = 30

function isoDansNJours(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatDateFR(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(
    new Date(y, m - 1, d),
  )
}

interface ListeAttenteCardProps {
  readonly medecinId: string
  readonly patientId: string
  readonly medecinNom?: string
}

/**
 * Inscription à la liste d'attente d'un médecin.
 *
 * <p>Proposée quand aucun créneau ne convient. La place libérée revient au premier
 * qui réserve : le dire franchement évite la déception de celui qui arrive second.
 */
export function ListeAttenteCard({ medecinId, patientId, medecinNom }: ListeAttenteCardProps) {
  const { data: inscriptions } = useListeAttente(patientId)
  const rejoindre = useRejoindreListeAttente(patientId)
  const quitter = useQuitterListeAttente(patientId)

  const [dateDebut, setDateDebut] = useState(() => isoDansNJours(0))
  const [dateFin, setDateFin] = useState(() => isoDansNJours(JOURS_PAR_DEFAUT))

  const inscription = inscriptions?.find((i) => i.medecinId === medecinId)

  if (inscription) {
    return (
      <section className="rounded-2xl border border-[#DFEFFE] bg-[#F7FAFF] p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DFEFFE] text-[#1863A9]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#010C2D]">Vous êtes en liste d&apos;attente</p>
            <p className="mt-1 text-xs text-[#6B7A99]">
              Du {formatDateFR(inscription.dateDebut)} au {formatDateFR(inscription.dateFin)}. Vous
              serez prévenu dès qu&apos;une place se libère.
            </p>
            <button
              type="button"
              onClick={() => quitter.mutate(inscription.id)}
              disabled={quitter.isPending}
              className="mt-3 rounded-xl border border-[#E3E8EF] bg-white px-3 py-1.5 text-xs font-semibold text-[#465058] transition-colors hover:border-[#E01E5A]/40 hover:text-[#E01E5A] disabled:opacity-50"
            >
              {quitter.isPending ? 'Retrait…' : 'Quitter la liste'}
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-[#EEF1F6] bg-white p-5">
      <p className="text-sm font-semibold text-[#010C2D]">
        Aucune date ne vous convient{medecinNom ? ` chez ${medecinNom}` : ''} ?
      </p>
      <p className="mt-1 text-xs text-[#6B7A99]">
        Soyez prévenu dès qu&apos;une place se libère sur la période qui vous intéresse.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#8A97A6]">
          <span>À partir du</span>
          <input
            type="date"
            value={dateDebut}
            min={isoDansNJours(0)}
            onChange={(e) => setDateDebut(e.target.value)}
            className="rounded-xl border border-[#E3E8EF] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#333333] focus:border-[#007DFF] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#8A97A6]">
          <span>Jusqu&apos;au</span>
          <input
            type="date"
            value={dateFin}
            min={dateDebut}
            onChange={(e) => setDateFin(e.target.value)}
            className="rounded-xl border border-[#E3E8EF] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#333333] focus:border-[#007DFF] focus:outline-none"
          />
        </label>
        <button
          type="button"
          disabled={rejoindre.isPending || dateFin < dateDebut}
          onClick={() => rejoindre.mutate({ medecinId, patientId, dateDebut, dateFin })}
          className="rounded-xl bg-[#007DFF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00263C] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {rejoindre.isPending ? 'Inscription…' : 'Me prévenir'}
        </button>
      </div>

      {rejoindre.isError && (
        <p className="mt-3 rounded-xl border border-[#FFDEDE] bg-[#FFF5F5] px-3 py-2 text-xs text-[#B4232A]">
          Inscription impossible. Vérifiez la période choisie.
        </p>
      )}

      {/* Annoncer la règle avant l'inscription : celui qui arrive second doit
          comprendre pourquoi la place lui a échappé. */}
      <p className="mt-3 text-[11px] text-[#8A97A6]">
        La place revient au premier qui réserve. Vous restez inscrit si quelqu&apos;un vous devance.
      </p>
    </section>
  )
}
