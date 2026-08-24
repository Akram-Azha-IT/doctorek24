import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface PromoCardData {
  readonly href: string
  readonly categorie: string
  readonly titre: readonly string[]
  readonly texte: string
  readonly lien: string
  readonly image: string
  readonly imageAlt: string
}

/**
 * Carte de mise en avant de la page d'accueil.
 *
 * <p>Les deux cartes ne différaient que par leur texte et leur visuel, pour un
 * balisage dupliqué à l'identique. Les tenir dans un seul composant permet au
 * carrousel mobile et à la grille bureau de partager exactement le même rendu.
 */
export function PromoCard({ data }: { readonly data: PromoCardData }) {
  return (
    <Link
      href={data.href}
      className="group relative flex min-h-[390px] w-full flex-row overflow-hidden border-t border-[#E5EEF7] bg-white transition-colors hover:bg-[#FBFDFF] md:h-full md:min-h-0 md:rounded-2xl md:border-t-0 md:shadow-[0_4px_28px_rgba(0,0,0,0.08)] md:transition-shadow md:hover:shadow-[0_8px_36px_rgba(0,0,0,0.12)]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden md:rounded-2xl">
        <div className="absolute -right-16 top-1/2 h-[255px] w-[255px] -translate-y-1/2 rounded-full bg-[#D0E8FF] md:right-5 md:h-[210px] md:w-[210px]" />
        <div className="absolute -right-8 top-1/2 h-[195px] w-[195px] -translate-y-1/2 rounded-full bg-[#B6DAF7] md:right-12 md:h-[155px] md:w-[155px]" />
      </div>

      <div className="relative z-10 flex w-[68%] flex-none flex-col justify-center px-5 py-10 md:w-auto md:flex-1 md:justify-between md:p-7">
        <div>
          <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#007DFF] md:mb-3 md:font-bold md:tracking-widest">
            {data.categorie}
          </p>
          <h3 className="mb-3 text-[22px] font-extrabold leading-[1.15] tracking-[-0.035em] text-[#00263C] md:mb-2 md:text-[18px] md:font-bold md:leading-snug">
            {data.titre.map((ligne) => (
              <span key={ligne} className="block">
                {ligne}
              </span>
            ))}
          </h3>
          <p className="text-[13.5px] leading-6 text-[#465058] md:text-[13px] md:leading-relaxed">{data.texte}</p>
        </div>
        <span className="mt-7 inline-flex items-center gap-1 text-[14px] font-bold text-[#007DFF] transition-all group-hover:gap-2 md:mt-5 md:font-semibold">
          {data.lien} <ChevronRight className="h-4 w-4" />
        </span>
      </div>

      <div className="absolute inset-y-0 right-0 z-20 w-[42%] shrink-0 md:relative md:inset-auto md:w-[43%]">
        {/* L'inclinaison est intégrée au visuel (pas de rotation CSS ici). */}
        <div className="absolute -right-1 top-1/2 h-[280px] w-[165px] -translate-y-1/2 md:right-9 md:h-[215px] md:w-[150px]">
          <div className="relative h-full w-full">
            <Image
              src={data.image}
              alt={data.imageAlt}
              fill
              className="object-contain object-center drop-shadow-2xl"
              sizes="(max-width: 767px) 44vw, 150px"
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
