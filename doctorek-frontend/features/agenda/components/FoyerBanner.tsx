'use client'

import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/Avatar'
import { useFoyerPatient } from '@/features/agenda/hooks'
import type { FamilleMembre } from '@/lib/types'
import { House } from 'lucide-react'

interface FoyerBannerProps {
  readonly medecinId: string
  readonly patientId: string
  readonly variant?: 'banner' | 'summary'
}

/**
 * Passerelle entre les dossiers d'un même foyer.
 *
 * <p>Un titulaire réserve souvent pour ses proches : sans ce repère, le médecin voit
 * des dossiers apparemment sans lien. La navigation reste explicite — chaque membre
 * garde son dossier, ses allergies et ses traitements, aucune donnée n'est agrégée.
 */
export function FoyerBanner({ medecinId, patientId, variant = 'banner' }: FoyerBannerProps) {
  const router = useRouter()
  const { data } = useFoyerPatient(medecinId, patientId)

  const membres = data ?? []
  if (membres.length < 2) return null

  // Le dossier du titulaire ne porte pas lui-même de gestionnaire : on lit le nom
  // sur n'importe quel proche du foyer, sinon le titre perdrait le nom de famille.
  const titulaireNom = membres.find((m) => m.gestionnaireNom)?.gestionnaireNom ?? null

  const open = (membre: FamilleMembre) => {
    const params = new URLSearchParams({ prenom: membre.firstName, nom: membre.lastName })
    router.push(`/dashboard/medecin/patients/${membre.patientId}?${params}`)
  }

  return (
    <section
      aria-label="Membres du foyer"
      className={variant === 'summary'
        ? 'min-w-0 flex-1 border-t border-[#E7ECF2] px-5 py-4 sm:border-l sm:border-t-0 sm:px-7'
        : 'border-t border-[#EEF1F6] bg-[#F7FAFF] px-5 py-3.5'}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {variant === 'summary' && <House className="h-4 w-4 text-[#6B7A99]" aria-hidden="true" />}
        <p className={variant === 'summary'
          ? 'text-sm font-medium text-[#66738F]'
          : 'text-[11px] font-semibold uppercase tracking-wide text-[#8A97A6]'}>
          {titulaireNom ? `Foyer de ${titulaireNom}` : 'Même foyer'}
        </p>
        {variant === 'banner' && (
          <span className="text-[11px] text-[#8A97A6]">· dossiers médicaux distincts</span>
        )}
      </div>

      <ul className={`${variant === 'summary' ? 'mt-3' : 'mt-2.5'} flex flex-wrap gap-2`}>
        {membres.map((membre) => {
          const nom = `${membre.firstName} ${membre.lastName}`.trim()
          const actif = membre.patientId === patientId
          return (
            <li key={membre.patientId}>
              <button
                type="button"
                onClick={() => open(membre)}
                disabled={actif}
                aria-current={actif ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-semibold transition-colors ${
                  actif
                    ? 'cursor-default bg-[#DFEFFE] text-[#1863A9]'
                    : 'bg-white text-[#465058] ring-1 ring-[#E3E8EF] hover:bg-white hover:text-[#007DFF] hover:ring-[#007DFF]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40'
                }`}
              >
                <Avatar name={nom} photoUrl={membre.photoUrl} size={24} />
                <span className="max-w-[140px] truncate">{nom}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
