import type { PatientSummary } from '@/lib/types'

/** Un titulaire et les proches qu'il gère, tels qu'affichés dans la liste du médecin. */
export interface FamilleGroup {
  /** Clé du foyer : le compte gestionnaire, ou le patient lui-même s'il gère son dossier. */
  readonly key: string
  /** Le titulaire, s'il est lui aussi patient de ce médecin. */
  readonly titulaire: PatientSummary | null
  /** Nom du titulaire, même lorsqu'il n'est pas patient de ce médecin. */
  readonly titulaireNom: string | null
  readonly proches: readonly PatientSummary[]
}

/**
 * Regroupe les patients par foyer pour l'affichage.
 *
 * <p>Un proche et son titulaire sont deux personnes distinctes, donc deux dossiers
 * médicaux séparés : ce regroupement est purement visuel. Il rend seulement le lien
 * familial lisible, là où la liste affichait des patients sans rapport apparent.
 *
 * <p>Un proche dont le titulaire ne consulte pas ce médecin forme son propre groupe,
 * en conservant la mention du titulaire.
 */
export function groupPatientsByFamille(patients: readonly PatientSummary[]): FamilleGroup[] {
  const parId = new Map(patients.map((p) => [p.patientId, p]))
  const groupes = new Map<string, { titulaire: PatientSummary | null; titulaireNom: string | null; proches: PatientSummary[] }>()

  const ensure = (key: string) => {
    let g = groupes.get(key)
    if (!g) {
      g = { titulaire: null, titulaireNom: null, proches: [] }
      groupes.set(key, g)
    }
    return g
  }

  for (const p of patients) {
    if (p.gestionnaireId) {
      const g = ensure(p.gestionnaireId)
      g.proches.push(p)
      g.titulaireNom ??= p.gestionnaireNom
      // Le titulaire n'est rattaché que s'il consulte lui aussi ce médecin.
      g.titulaire ??= parId.get(p.gestionnaireId) ?? null
    } else {
      ensure(p.patientId).titulaire = p
    }
  }

  return [...groupes.entries()].map(([key, g]) => ({
    key,
    titulaire: g.titulaire,
    titulaireNom: g.titulaire ? `${g.titulaire.firstName} ${g.titulaire.lastName}` : g.titulaireNom,
    proches: g.proches,
  }))
}
