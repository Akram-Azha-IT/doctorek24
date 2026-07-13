'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import type { CarteVirtuelle, PatientProfile } from '@/lib/types'
import { calcAge, calcAgeDetailed } from '../utils'

interface ProfileSidebarProps {
  firstName: string | null
  lastName: string | null
  profile: PatientProfile | null | undefined
  carte: CarteVirtuelle | null | undefined
  hasCarte: boolean
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ProfileSidebar({ firstName, lastName, profile, carte, hasCarte, onPhotoChange }: ProfileSidebarProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <div className="relative inline-block group mb-3">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#007DFF]/10 border-4 border-[#007DFF]/20 flex items-center justify-center mx-auto">
            {profile?.photoUrl ? (
              <img src={profile.photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
            ) : (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#007DFF" opacity="0.5"/>
                <path d="M4 20 C4 15.6 7.6 12 12 12 C16.4 12 20 15.6 20 20" fill="#007DFF" opacity="0.5"/>
              </svg>
            )}
          </div>
          {carte && (
            <>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Changer la photo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
            </>
          )}
        </div>

        <h3 className="text-base font-bold text-[#333333]">
          {firstName ?? ''} {lastName ?? ''}
        </h3>
        {profile?.dateNaissance && (() => {
          const age = calcAgeDetailed(profile.dateNaissance)
          return (
            <div className="mt-1 space-y-0.5">
              <p className="text-sm font-semibold text-[#333333]">{age.years} ans</p>
              <p className="text-[11px] text-[#465058]">
                {age.months} mois {age.days} jours
              </p>
              <p className="text-[10px] text-[#A0AEC0]">
                {age.totalDays.toLocaleString('fr-FR')} jours au total
              </p>
            </div>
          )
        })()}

        {carte && (
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#F0F2F5] pt-4">
            <div className="text-center">
              <p className="text-xs font-bold text-[#007DFF]">{carte.groupeSanguin ?? '-'}</p>
              <p className="text-[10px] text-[#465058] mt-0.5">Groupe</p>
            </div>
            <div className="text-center border-x border-[#F0F2F5]">
              <p className="text-xs font-bold text-[#333333]">{carte.tailleCm ? `${carte.tailleCm} cm` : '-'}</p>
              <p className="text-[10px] text-[#465058] mt-0.5">Taille</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-[#333333]">{carte.poidsKg ? `${carte.poidsKg} kg` : '-'}</p>
              <p className="text-[10px] text-[#465058] mt-0.5">Poids</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-1">
        {carte?.maladiesChroniques && carte.maladiesChroniques.length > 0 && (
          <div className="mb-3 pb-3 border-b border-[#F0F2F5]">
            <div className="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              <span className="text-xs font-bold text-[#333333]">Maladies chroniques</span>
            </div>
            <ul className="space-y-1">
              {carte.maladiesChroniques.slice(0, 3).map((m, i) => (
                <li key={i} className="text-xs text-[#465058] flex items-start gap-1.5">
                  <span className="text-[#007DFF] mt-0.5">·</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {[
          {
            href: '/dashboard/patient/carte',
            icon: <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>,
            label: 'Ma Carte Médicale',
          },
          {
            href: '/dashboard/patient/rdvs',
            icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
            label: 'Mes Rendez-vous',
          },
          {
            href: '/recherche',
            icon: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
            label: 'Trouver un Médecin',
          },
        ].map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between w-full py-2.5 rounded-lg hover:bg-[#F0F2F5] px-2 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#007DFF]/10 flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">{icon}</svg>
              </div>
              <span className="text-sm font-medium text-[#333333]">{label}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#465058" strokeWidth="2" className="group-hover:stroke-[#007DFF] transition-colors">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </div>

      {/* Promo card */}
      {!hasCarte && (
        <div className="bg-gradient-to-br from-[#007DFF] to-[#042651] rounded-2xl overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full bg-white/5" />
          <div className="relative h-32 w-full">
            <Image
              src="/card-hero.png"
              alt="Carte médicale Doctorek"
              fill
              className="object-contain object-center"
              sizes="288px"
            />
          </div>
          <div className="px-5 pb-5">
            <p className="text-sm font-bold text-white">Créez votre carte médicale!</p>
            <p className="text-xs text-[#B6DAF7] mt-1">Partagez vos données médicales facilement avec vos médecins</p>
            <Link
              href="/dashboard/patient/carte"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#007DFF] hover:bg-[#F0F2F5] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Créer ma carte
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
