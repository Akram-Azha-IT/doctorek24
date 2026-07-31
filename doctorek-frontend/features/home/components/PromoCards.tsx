'use client'

import { useEffect, useRef, useState } from 'react'
import { PromoCard, type PromoCardData } from './PromoCard'

const CARTES: readonly PromoCardData[] = [
  {
    href: '/login',
    categorie: 'Patients',
    titre: ['Votre santé,', 'sécurisée dans votre poche'],
    texte:
      'Ajoutez votre carte médicale à Google Wallet ou Apple Wallet. Vos infos vitales accessibles partout, même hors ligne.',
    lien: 'En savoir plus',
    image: '/carte-phone.png',
    imageAlt: 'Carte médicale Doctorek affichée sur un smartphone',
  },
  {
    href: '/inscription?role=medecin',
    categorie: 'Médecins',
    titre: ['Rejoignez Doctorek Pro', 'et gérez votre cabinet'],
    texte: 'Agenda en ligne, rendez-vous patients et dossiers médicaux : tout en un.',
    lien: 'Découvrir Doctorek Pro',
    image: '/medecin-carte-hero.png',
    imageAlt: 'Dashboard médecin Doctorek',
  },
]

/** La carte visible occupe l'essentiel de l'écran, la suivante dépasse pour se signaler. */
const LARGEUR_CARTE_MOBILE = 'w-[86vw] max-w-[400px]'

function prefereMoinsDeMouvement(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Cartes de mise en avant : carrousel sur mobile, grille sur bureau.
 *
 * <p>La carte Patients était purement et simplement masquée sous {@code md} : l'offre
 * carte médicale disparaissait pour les visiteurs mobiles, qui sont la majorité. Le
 * carrousel les rétablit toutes les deux sans allonger la page.
 *
 * <p>Le défilement reste natif, aimanté par CSS : pas de librairie, pas de gestionnaire
 * de gestes concurrent du scroll de la page, et l'inertie du système est préservée.
 */
export function PromoCards() {
  const pisteRef = useRef<HTMLDivElement>(null)
  const [actif, setActif] = useState(0)

  useEffect(() => {
    const piste = pisteRef.current
    if (!piste) return

    const observer = new IntersectionObserver(
      (entrees) => {
        const visible = entrees
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActif(Number((visible.target as HTMLElement).dataset.index))
      },
      { root: piste, threshold: 0.6 },
    )

    const items = piste.querySelectorAll('[data-index]')
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  const allerA = (index: number) => {
    const cible = pisteRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)
    cible?.scrollIntoView({
      behavior: prefereMoinsDeMouvement() ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  return (
    <div className="relative z-20 mt-4 md:-mt-30">
      <div
        ref={pisteRef}
        aria-label="Doctorek pour les patients et pour les médecins"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] md:mx-auto md:max-w-[1400px] md:grid md:grid-cols-2 md:overflow-visible md:px-8 md:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {CARTES.map((carte, index) => (
          <div
            key={carte.categorie}
            data-index={index}
            className={`shrink-0 snap-center ${LARGEUR_CARTE_MOBILE} md:w-auto md:max-w-none md:shrink`}
          >
            <PromoCard data={carte} />
          </div>
        ))}
      </div>

      {/* Repère de position, masqué sur bureau où les deux cartes sont visibles. */}
      <div className="mt-1 flex items-center justify-center md:hidden">
        {CARTES.map((carte, index) => (
          <button
            key={carte.categorie}
            type="button"
            onClick={() => allerA(index)}
            aria-label={`Voir la carte ${carte.categorie}`}
            aria-current={actif === index ? 'true' : undefined}
            className="flex h-11 w-11 items-center justify-center"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                actif === index ? 'h-2 w-6 bg-[#007DFF]' : 'h-2 w-2 bg-[#C4D7EC]'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
