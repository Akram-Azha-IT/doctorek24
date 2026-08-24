'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import type { AgentCard, AgentCreneauxCarte, AgentRdvBrouillon, AgentTour, BookingSlot } from '@/lib/types'
import { AgentCartes } from './AgentCartes'
import { FlecheManuscrite } from './FlecheManuscrite'

interface AgentThreadProps {
  readonly tours: AgentTour[]
  readonly enCours: boolean
  readonly onSuggestion: (texte: string) => void
  readonly onReserver: (slot: BookingSlot) => void
  readonly onBrouillon: (brouillon: AgentRdvBrouillon) => void
}

const SUGGESTIONS = [
  { code: '01', titre: 'Médecins près de moi', exemple: 'Un cardiologue près de moi' },
  { code: '02', titre: 'Les mieux notés', exemple: 'Les cardiologues les mieux notés à Casablanca' },
  { code: '03', titre: 'Voir les disponibilités', exemple: 'Un dermatologue disponible cette semaine à Rabat' },
  { code: '04', titre: 'Gérer mes rendez-vous', exemple: 'Quels sont mes prochains rendez-vous ?' },
] as const

const LIBELLE_OUTIL: Record<string, string> = {
  rechercher_medecins: 'Annuaire vérifié',
  medecins_a_proximite: 'Localisation vérifiée',
  profil_medecin: 'Profil vérifié',
  creneaux_medecin: 'Agenda vérifié',
  mes_rendez_vous: 'Rendez-vous vérifiés',
  preparer_rdv: 'Créneau vérifié',
}

function titreEtape(cartes: AgentCard[] | undefined): string {
  if (!cartes?.length) return 'Réponse Doctorek'
  const types = new Set(cartes.map((carte) => carte.type))
  if (types.has('brouillon')) return 'Rendez-vous prêt à confirmer'
  if (types.has('rdvs')) return 'Vos prochains rendez-vous'
  if (types.has('medecins')) {
    const carte = cartes.find((item) => item.type === 'medecins')
    const total = Array.isArray(carte?.donnees) ? carte.donnees.length : 0
    return `${total || 'Des'} médecin${total > 1 ? 's' : ''} correspondent`
  }
  if (types.has('medecin')) return 'Médecin correspondant'
  if (types.has('creneaux')) return 'Créneaux disponibles'
  return 'Résultat vérifié'
}

function EtatVide({ onSuggestion }: { readonly onSuggestion: (texte: string) => void }) {
  return (
    <div className="agent-parcours-scroll relative flex flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6">
      <div className="agent-care-rail" aria-hidden="true" />

      <section className="agent-entree relative pl-14">
        <span className="agent-care-node agent-care-node-active" aria-hidden="true">1</span>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#007DFF]">Point de départ</p>
        <h3 className="mt-1.5 max-w-[19rem] font-heading text-[21px] font-extrabold leading-[1.14] tracking-tight text-[#010C2D]">
          Dites-moi votre besoin.<br />Je construis le parcours.
        </h3>
        <p className="mt-2 max-w-[35ch] text-[12.5px] leading-relaxed text-[#667585]">
          Je consulte l’annuaire, les notes, la proximité et les agendas jusqu’au bon créneau.
        </p>
      </section>

      <div className="relative mt-5 space-y-2 pl-14">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.code}
            type="button"
            onClick={() => onSuggestion(suggestion.exemple)}
            className="group flex min-h-[58px] w-full items-center gap-3 rounded-2xl border border-[#DCE7F2] bg-white px-3.5 py-2.5 text-left shadow-[0_2px_8px_rgba(1,12,45,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#9DCCF7] hover:shadow-[0_10px_24px_rgba(0,125,255,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
          >
            <span className="font-mono text-[10px] font-extrabold text-[#007DFF]">{suggestion.code}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-[#010C2D]">{suggestion.titre}</span>
              <span className="mt-0.5 block truncate text-[11.5px] text-[#738395]">{suggestion.exemple}</span>
            </span>
            <FlecheManuscrite className="h-5 w-8 shrink-0 text-[#E7A11A] transition-transform duration-300 group-hover:translate-x-1 group-hover:-rotate-3 group-hover:text-[#007DFF]" />
          </button>
        ))}
      </div>

      <section className="relative mt-4 pl-14 opacity-55">
        <span className="agent-care-node agent-care-node-idle" aria-hidden="true">2</span>
        <p className="text-[13px] font-bold text-[#465058]">Comparer les correspondances</p>
      </section>
      <section className="relative mt-5 pl-14 opacity-40">
        <span className="agent-care-node agent-care-node-idle" aria-hidden="true">3</span>
        <p className="text-[13px] font-bold text-[#465058]">Choisir un créneau</p>
      </section>
    </div>
  )
}

function Trace({ numero }: { readonly numero: number }) {
  return (
    <div className="agent-entree relative pl-14">
      <span className="agent-care-node agent-care-node-active" aria-hidden="true">
        <Sparkles className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-[#CFE4F8] bg-white px-3.5 shadow-sm">
        <span className="agent-pulse h-2 w-2 rounded-full bg-[#007DFF]" />
        <span className="text-[12px] font-semibold text-[#3C6E9E]">Doctorek relie les bonnes données…</span>
        <span className="sr-only">Étape {numero}</span>
      </div>
    </div>
  )
}

/** Le fil devient un parcours de décision, pas une succession de bulles. */
export function AgentThread({
  tours,
  enCours,
  onSuggestion,
  onReserver,
  onBrouillon,
}: AgentThreadProps) {
  const finDuFil = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finDuFil.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [tours, enCours])

  if (tours.length === 0 && !enCours) {
    return <EtatVide onSuggestion={onSuggestion} />
  }

  const dernierTour = tours.at(-1)
  const proposeMedecinSansCreneaux = dernierTour?.role === 'assistant'
    && dernierTour.cartes?.some((carte) => carte.type === 'medecin' || carte.type === 'medecins')
    && !dernierTour.cartes?.some((carte) => carte.type === 'creneaux' || carte.type === 'brouillon')
  const proposeDesCreneaux = dernierTour?.role === 'assistant'
    && dernierTour.cartes?.some((carte) => carte.type === 'creneaux')
  const carteCreneaux = dernierTour?.role === 'assistant'
    ? dernierTour.cartes?.find((carte) => carte.type === 'creneaux')
    : undefined
  const medecinAvecCreneauxId = carteCreneaux?.type === 'creneaux'
    ? (carteCreneaux.donnees as AgentCreneauxCarte).medecin.id
    : undefined

  return (
    <div className="agent-parcours-scroll relative flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5 sm:px-6" role="log" aria-live="polite" aria-label="Parcours avec l'assistant">
      <div className="agent-care-rail" aria-hidden="true" />

      {tours.map((tour, index) => {
        const numeroEtape = index + 1
        if (tour.role === 'patient') {
          return (
            <section key={tour.id} className="agent-entree relative pl-14">
              <span className="agent-care-node agent-care-node-complete" aria-hidden="true">
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <p className="flex items-center gap-2 text-[16px] font-extrabold text-[#010C2D]">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2EB67D] text-white" aria-hidden="true">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {numeroEtape === 1 ? 'Besoin compris' : 'Votre précision'}
              </p>
              <p className="mt-2 inline-flex max-w-full rounded-xl bg-[#EEF6FD] px-3.5 py-2 text-[14px] font-medium leading-relaxed text-[#53677B]">
                {tour.texte}
              </p>
            </section>
          )
        }

        return (
          <section key={tour.id} className="agent-entree relative pl-14">
            <span className={`agent-care-node ${tour.erreur ? 'agent-care-node-error' : 'agent-care-node-active'}`} aria-hidden="true">
              {numeroEtape}
            </span>
            <div className="min-w-0">
              <h3 className="text-[17px] font-extrabold leading-tight text-[#010C2D]">{titreEtape(tour.cartes)}</h3>
              <p className={`mt-1 text-[14px] leading-relaxed ${tour.erreur ? 'text-[#C91D50]' : 'text-[#667585]'}`}>
                {tour.texte}
              </p>

              {tour.cartes && tour.cartes.length > 0 && (
                <div className="mt-3">
                  <AgentCartes cartes={tour.cartes} onReserver={onReserver} onBrouillon={onBrouillon} />
                </div>
              )}

              {tour.outils && tour.outils.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {tour.outils.map((outil, index) => (
                    <span key={`${outil}-${index}`} className="rounded-full bg-[#EAF4FC] px-2.5 py-1 text-[9.5px] font-bold text-[#52779A]">
                      {LIBELLE_OUTIL[outil] ?? outil}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      })}

      {enCours && <Trace numero={tours.length + 1} />}

      {proposeMedecinSansCreneaux && !enCours && (
        <section className="relative pl-14 opacity-55">
          <span className="agent-care-node agent-care-node-idle" aria-hidden="true">{tours.length + 1}</span>
          <p className="text-[13px] font-bold text-[#465058]">Choisir un créneau</p>
          <p className="mt-0.5 text-[11.5px] text-[#7B8C9F]">Ouvrez un profil pour voir ses disponibilités.</p>
        </section>
      )}

      {proposeDesCreneaux && !enCours && (
        <section className="relative pl-14">
          <span className="agent-care-node agent-care-node-idle" aria-hidden="true">{tours.length + 1}</span>
          <p className="text-[16px] font-extrabold text-[#010C2D]">Choisir un créneau</p>
          <p className="mt-0.5 text-[13.5px] text-[#667585]">Sélectionnez l’horaire qui vous convient.</p>
          {medecinAvecCreneauxId && (
            <Link
              href={`/medecins/${medecinAvecCreneauxId}/rdv`}
              className="mt-3 flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-[#007DFF] px-4 text-[15px] font-extrabold text-white shadow-[0_8px_20px_rgba(0,125,255,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#168AFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2"
            >
              Voir toutes les disponibilités
            </Link>
          )}
        </section>
      )}

      <div ref={finDuFil} />
    </div>
  )
}
