'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { POPULAR_SPECIALTIES } from '../constants'

export function SpecialtiesSection() {
  const router = useRouter()

  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 pt-14 mb-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[12px] font-semibold text-[#007DFF] uppercase tracking-widest mb-2">Annuaire</p>
          <h2 className="text-[24px] font-bold text-[#00263C]">Consultez votre spécialiste</h2>
          <p className="text-[#465058] text-sm mt-1">Plus de 30 spécialités disponibles dans tout le Maroc</p>
        </div>
        <Link
          href="/recherche"
          className="hidden md:inline-flex items-center gap-1 text-[#007DFF] text-[14px] font-semibold hover:underline flex-shrink-0"
        >
          Voir toutes <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {POPULAR_SPECIALTIES.map((spec, i) => (
          <button
            key={i}
            onClick={() => router.push(`/recherche?specialite=${encodeURIComponent(spec.name)}`)}
            className="group flex items-center gap-3 rounded-xl bg-[#EBF4FF] p-4 text-left shadow-sm transition-all hover:shadow-md border border-transparent hover:border-[#007DFF]/20 hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D0E8FF] to-[#B6DAF7]">
              <Image src={spec.icon} alt={spec.name} width={26} height={26} />
            </div>
            <span className="flex-1 text-[13px] font-bold text-[#00263C] leading-snug">{spec.name}</span>
            <ChevronRight className="h-4 w-4 text-[#007DFF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
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
