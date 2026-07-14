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
  const allergiesCount = carte?.allergies?.length ?? 0
  const updatedAt = carte?.updatedAt ? new Date(carte.updatedAt) : null

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#F0F2F5]">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#007DFF]/10 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#333333]">Votre carte digitale</h2>
            {hasCarte && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2EB67D]" />
                <p className="text-[11px] text-[#465058] font-medium">
                  Active{updatedAt ? ` · mise à jour le ${updatedAt.toLocaleDateString('fr-FR')}` : ''}
                </p>
              </div>
            )}
          </div>
        </div>
        {hasCarte && (
          <Link
            href="/dashboard/patient/carte"
            className="text-xs font-semibold text-[#007DFF] hover:text-[#0065D0] transition-colors shrink-0"
          >
            Modifier
          </Link>
        )}
      </div>

      {carteLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-[#F0F2F5]" />
      ) : hasCarte && carte ? (
        <>
          <div className="bg-[#042651] rounded-xl p-2">
            <CarteVirtuelleCard carte={carte} profile={profile} firstName={firstName ?? undefined} lastName={lastName ?? undefined} />
          </div>

          {/* Quick vitals strip */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#F1F4F7] px-3 py-2.5 text-center">
              <p className="text-sm font-bold text-[#007DFF]">{carte?.groupeSanguin ?? '—'}</p>
              <p className="text-[10px] text-[#465058] font-medium mt-0.5">Groupe sanguin</p>
            </div>
            <div className="rounded-xl bg-[#F1F4F7] px-3 py-2.5 text-center">
              <p className={`text-sm font-bold ${allergiesCount > 0 ? 'text-[#E01E5A]' : 'text-[#333333]'}`}>
                {allergiesCount > 0 ? allergiesCount : '—'}
              </p>
              <p className="text-[10px] text-[#465058] font-medium mt-0.5">Allergie{allergiesCount > 1 ? 's' : ''}</p>
            </div>
            <div className="rounded-xl bg-[#F1F4F7] px-3 py-2.5 text-center">
              <p className="text-sm font-bold text-[#2EB67D]">
                {carte?.donneurOrganes ? 'Oui' : 'Non'}
              </p>
              <p className="text-[10px] text-[#465058] font-medium mt-0.5">Don d&apos;organes</p>
            </div>
          </div>
        </>
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
