'use client'

import { useEffect, useState } from 'react'
import { usePatientsMedecin } from '@/features/agenda/hooks'
import type { PatientSummary } from '@/lib/types'

const DEBOUNCE_MS = 300
/** Au-delà, la liste cesse d'aider et devient du bruit. */
const MAX_SUGGESTIONS = 3

function formatDateShortFR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(y, m - 1, d))
}

interface DossiersExistantsHintProps {
  readonly medecinId: string
  readonly prenom: string
  readonly nom: string
  readonly onUtiliser: (patient: PatientSummary) => void
}

/**
 * Alerte le praticien qu'un dossier existe déjà pour l'identité saisie.
 *
 * <p>Sans ce rappel, le même patient revu six mois plus tard obtient un second
 * dossier : ses allergies restent dans le premier, la prescription part dans le
 * second. Le serveur sait rapprocher les identités exactes, mais il refuse de
 * trancher entre homonymes — c'est ici que le choix doit être offert.
 */
export function DossiersExistantsHint({
  medecinId,
  prenom,
  nom,
  onUtiliser,
}: DossiersExistantsHintProps) {
  const saisie = `${prenom.trim()} ${nom.trim()}`.trim()
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setRecherche(saisie), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [saisie])

  // Un prénom seul rapprocherait des patients sans rapport.
  const actif = prenom.trim().length > 1 && nom.trim().length > 1 && recherche === saisie
  const { data } = usePatientsMedecin(medecinId, actif ? recherche : '', 'TOUS', 0)

  const candidats = (actif ? (data?.content ?? []) : []).slice(0, MAX_SUGGESTIONS)
  if (candidats.length === 0) return null

  return (
    <div className="rounded-lg border border-[#FFE6B0] bg-[#FFF8E6] px-3 py-2.5">
      <p className="text-xs font-semibold text-[#8A6100]">
        {candidats.length === 1
          ? 'Un dossier existe déjà pour ce nom'
          : `${candidats.length} dossiers existent déjà pour ce nom`}
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {candidats.map((p) => (
          <li key={p.patientId} className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-xs text-[#6B5200]">
              {p.firstName} {p.lastName}
              <span className="text-[#A08340]">
                {' '}· dernier RDV {formatDateShortFR(p.dernierRdvDate)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onUtiliser(p)}
              className="shrink-0 rounded-md bg-[#8A6100] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#6B5200]"
            >
              Utiliser ce dossier
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-[#A08340]">
        Créez un nouveau dossier seulement s&apos;il s&apos;agit d&apos;une autre personne.
      </p>
    </div>
  )
}
