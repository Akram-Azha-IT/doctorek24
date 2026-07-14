import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { POPULAR_SPECIALTIES } from '../constants'

export function SpecialtiesSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 pt-8 md:pt-14 mb-10 md:mb-16">
      <div className="flex items-end justify-between mb-5 md:mb-8">
        <div>
          <p className="text-[11px] md:text-[12px] font-semibold text-[#007DFF] uppercase tracking-widest mb-1 md:mb-2">Annuaire</p>
          <h2 className="text-[20px] md:text-[24px] font-bold text-[#00263C]">Consultez votre spécialiste</h2>
          <p className="text-[#465058] text-[12px] md:text-sm mt-0.5 md:mt-1 hidden sm:block">Plus de 30 spécialités disponibles dans tout le Maroc</p>
        </div>
        <Link
          href="/recherche"
          className="hidden md:inline-flex items-center gap-1 text-[#007DFF] text-[14px] font-semibold hover:underline flex-shrink-0"
        >
          Voir toutes <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {POPULAR_SPECIALTIES.map((spec, i) => (
          <Link
            key={i}
            href={`/recherche?specialite=${encodeURIComponent(spec.name)}`}
            className="group flex items-center gap-2.5 md:gap-3 rounded-xl bg-[#EBF4FF] p-3 md:p-4 text-left shadow-sm transition-all hover:shadow-md border border-transparent hover:border-[#007DFF]/20 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2"
          >
            <div className="flex h-9 w-9 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-lg md:rounded-xl bg-gradient-to-br from-[#D0E8FF] to-[#B6DAF7]">
              <Image src={spec.icon} alt="" width={26} height={26} aria-hidden="true" />
            </div>
            <span className="flex-1 text-[12px] md:text-[13px] font-bold text-[#00263C] leading-snug">{spec.name}</span>
            <ChevronRight className="h-4 w-4 text-[#007DFF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
          </Link>
        ))}
      </div>
      <div className="mt-5 md:hidden text-center">
        <Link href="/recherche" className="inline-flex items-center gap-1 text-[#007DFF] text-[14px] font-semibold">
          Voir toutes les spécialités <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
