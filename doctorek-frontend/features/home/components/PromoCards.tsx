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
    imageAlt: 'Application Doctorek sur smartphone',
  },
]

/** Sections éditoriales sur mobile, cartes jumelles sur bureau. */
export function PromoCards() {
  return (
    <div className="relative z-20 md:-mt-30">
      <div
        aria-label="Doctorek pour les patients et pour les médecins"
        className="flex flex-col md:mx-auto md:grid md:max-w-[1400px] md:grid-cols-2 md:gap-4 md:px-8"
      >
        {CARTES.map((carte) => (
          <PromoCard key={carte.categorie} data={carte} />
        ))}
      </div>
    </div>
  )
}
