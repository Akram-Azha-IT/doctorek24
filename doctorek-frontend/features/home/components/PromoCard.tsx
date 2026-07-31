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
      className="group relative flex h-full flex-row overflow-hidden rounded-2xl bg-white shadow-[0_4px_28px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_8px_36px_rgba(0,0,0,0.12)]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute right-2 top-1/2 h-[190px] w-[190px] -translate-y-1/2 rounded-full bg-[#D0E8FF] sm:right-5 sm:h-[210px] sm:w-[210px]" />
        <div className="absolute right-8 top-1/2 h-[140px] w-[140px] -translate-y-1/2 rounded-full bg-[#B6DAF7] sm:right-12 sm:h-[155px] sm:w-[155px]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-between p-5 sm:p-7">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#007DFF]">
            {data.categorie}
          </p>
          <h3 className="mb-2 text-[17px] font-bold leading-snug text-[#00263C] sm:text-[18px]">
            {data.titre.map((ligne) => (
              <span key={ligne} className="block">
                {ligne}
              </span>
            ))}
          </h3>
          <p className="text-[13px] leading-relaxed text-[#465058]">{data.texte}</p>
        </div>
        <span className="mt-5 inline-flex items-center gap-1 text-[14px] font-semibold text-[#007DFF] transition-all group-hover:gap-2">
          {data.lien} <ChevronRight className="h-4 w-4" />
        </span>
      </div>

      <div className="relative z-20 w-[38%] shrink-0 sm:w-[43%]">
        {/* L'inclinaison est intégrée au visuel (pas de rotation CSS ici). */}
        <div className="absolute bottom-3 right-4 top-3 w-[110px] sm:right-9 sm:h-[215px] sm:w-[150px] sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2">
          <div className="relative h-full w-full">
            <Image
              src={data.image}
              alt={data.imageAlt}
              fill
              className="object-contain object-center drop-shadow-2xl"
              sizes="(max-width: 640px) 40vw, 150px"
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
