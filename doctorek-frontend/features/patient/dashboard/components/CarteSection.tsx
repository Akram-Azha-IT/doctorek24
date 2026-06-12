import Image from 'next/image'
import Link from 'next/link'
import CarteVirtuelleCard from '@/features/carte/components/CarteVirtuelleCard'
import type { CarteVirtuelle, PatientProfile } from '@/lib/types'

interface CarteSectionProps {
  carte: CarteVirtuelle | null | undefined
  carteLoading: boolean
  hasCarte: boolean
  profile: PatientProfile | null | undefined
  firstName: string | null
  lastName: string | null
}

export function CarteSection({ carte, carteLoading, hasCarte, profile, firstName, lastName }: CarteSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#333333]">Carte Médicale Digitale</h2>
        {hasCarte && (
          <Link href="/dashboard/patient/carte" className="text-xs font-semibold text-[#007DFF] hover:underline">
            Modifier
          </Link>
        )}
      </div>
      {carteLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-[#F0F2F5]" />
      ) : hasCarte ? (
        <div className="bg-[#010C2D] rounded-xl p-2">
          <CarteVirtuelleCard carte={carte} profile={profile} firstName={firstName ?? undefined} lastName={lastName ?? undefined} />
        </div>
      ) : (
        <div className="rounded-xl bg-gradient-to-br from-[#007DFF] to-[#042651] overflow-hidden relative flex flex-col sm:flex-row items-stretch min-h-[160px]">
          <div className="flex flex-col justify-center px-6 py-6 z-10 flex-1">
            <p className="text-sm font-bold text-white leading-snug">Créez votre carte médicale digitale</p>
            <p className="text-xs text-[#B6DAF7] mt-1.5">Accédez à vos données médicales partout,<br/>partagez avec votre médecin</p>
            <Link
              href="/dashboard/patient/carte"
              className="mt-4 self-start rounded-xl bg-white px-5 py-2 text-xs font-bold text-[#007DFF] hover:bg-[#F0F2F5] transition-colors"
            >
              Créer ma carte
            </Link>
          </div>
          <div className="relative w-40 shrink-0 self-stretch hidden sm:block">
            <Image
              src="/card-hero.png"
              alt="Carte médicale Doctorek"
              fill
              className="object-contain object-right-bottom drop-shadow-xl"
              sizes="160px"
            />
          </div>
        </div>
      )}
    </div>
  )
}
