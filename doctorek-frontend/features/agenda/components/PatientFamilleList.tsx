'use client'

import { useMemo } from 'react'
import { PatientListItem } from './PatientListItem'
import { groupPatientsByFamille } from '@/features/agenda/patients-famille'
import type { PatientSummary } from '@/lib/types'

interface PatientFamilleListProps {
  readonly patients: readonly PatientSummary[]
  readonly onOpen: (patient: PatientSummary) => void
}

/**
 * Liste des patients d'un médecin, regroupée par foyer.
 *
 * <p>Le regroupement est visuel : chaque membre garde son dossier médical. Il évite
 * seulement que les proches d'un même titulaire paraissent sans lien entre eux.
 */
export function PatientFamilleList({ patients, onOpen }: PatientFamilleListProps) {
  const familles = useMemo(() => groupPatientsByFamille(patients), [patients])

  return (
    <ul className="divide-y divide-[#F0F2F5]">
      {familles.map((famille) => {
        const titulaire = famille.titulaire
        return (
          <li key={famille.key}>
            <ul className="divide-y divide-[#F0F2F5]">
              {titulaire && (
                <PatientListItem patient={titulaire} onClick={() => onOpen(titulaire)} />
              )}
              {famille.proches.map((proche) => (
                <PatientListItem
                  key={proche.patientId}
                  patient={proche}
                  nested={!!titulaire}
                  onClick={() => onOpen(proche)}
                />
              ))}
            </ul>
            {titulaire && famille.proches.length > 0 && (
              <p className="bg-[#F7FAFF] px-5 py-1.5 text-[11px] text-[#6B7A99]">
                {famille.proches.length} proche{famille.proches.length > 1 ? 's' : ''} géré
                {famille.proches.length > 1 ? 's' : ''} par {famille.titulaireNom} — dossiers
                médicaux distincts
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
