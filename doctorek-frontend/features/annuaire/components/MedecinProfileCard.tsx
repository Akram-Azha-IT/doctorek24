'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import type { MedecinProfile } from '@/lib/types'
import { MedecinAvatar } from './MedecinAvatar'

const SECTEUR_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Secteur 1 — Honoraires conventionnés',
  2: 'Secteur 2 — Honoraires libres',
  3: 'Secteur 3 — Non conventionné',
}

const SECTEUR_REMB: Record<1 | 2 | 3, string> = {
  1: "Remboursé par l'Assurance Maladie",
  2: 'Remboursement partiel possible',
  3: "Non remboursé par l'Assurance Maladie",
}

const SECTEUR_COLOR: Record<1 | 2 | 3, string> = {
  1: '#2EB67D',
  2: '#ECB22E',
  3: '#465058',
}

const DAYS = [
  { key: 'LUNDI',    label: 'Lundi'    },
  { key: 'MARDI',    label: 'Mardi'    },
  { key: 'MERCREDI', label: 'Mercredi' },
  { key: 'JEUDI',    label: 'Jeudi'    },
  { key: 'VENDREDI', label: 'Vendredi' },
  { key: 'SAMEDI',   label: 'Samedi'   },
  { key: 'DIMANCHE', label: 'Dimanche' },
]

const OPEN_DAYS = new Set(['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'])
const JS_DAY_TO_KEY = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
const TODAY_KEY = JS_DAY_TO_KEY[new Date().getDay()]

const CABINET_PHOTOS = [
  { bg: '#dfeffe', label: 'Salle d\'attente' },
  { bg: '#e8eff6', label: 'Cabinet' },
  { bg: '#dfeffe', label: 'Équipement' },
]

interface NavItem {
  id: string
  label: string
  icon: (p: { className?: string }) => ReactNode
  show: boolean
}

interface Props {
  medecin: MedecinProfile
}

export function MedecinProfileCard({ medecin }: Props) {
  const [activeSection, setActiveSection] = useState<string>('localisation')
  const [showMap, setShowMap] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const navItems: NavItem[] = [
    { id: 'localisation',    label: 'Localisation',    icon: MapPinIcon,  show: true },
    { id: 'specialite',      label: 'Spécialité',      icon: ProfileIcon, show: true },
    { id: 'horaires',        label: 'Horaires',        icon: ClockIcon,   show: true },
    { id: 'langues',         label: 'Langues',         icon: GlobeIcon,   show: !!(medecin.langues && medecin.langues.length > 0) },
    { id: 'cabinet',         label: 'Cabinet',         icon: PhotoIcon,   show: true },
    { id: 'informations',    label: 'Informations',    icon: CardIcon,    show: !!medecin.inpe },
  ].filter((n) => n.show)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    )

    navItems.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mapQuery = [medecin.adresse, medecin.ville].filter(Boolean).join(', ')

  return (
    <div className="w-full">

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ background: '#1a4d8a' }}>
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link
            href="/recherche"
            className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/80 transition-colors mb-6"
          >
            <ArrowLeftIcon />
            Retour aux résultats
          </Link>
          <div className="flex items-center gap-5">
            <div className="shrink-0 rounded-full ring-4 ring-white/15 overflow-hidden">
              <MedecinAvatar
                firstName={medecin.firstName}
                lastName={medecin.lastName}
                photoUrl={(medecin as { photoUrl?: string | null }).photoUrl}
                size="xl"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Dr.&nbsp;{medecin.firstName} {medecin.lastName}
              </h1>
              <p className="mt-1 text-[15px] text-white/55 font-medium">{medecin.specialite}</p>
              {medecin.ville && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/35">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {medecin.ville}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="bg-[#F0F2F5] min-h-screen">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex gap-6 items-start">

            {/* ── Left nav ── */}
            <nav className="w-44 shrink-0 sticky top-24 flex flex-col gap-0.5">
              {navItems.map(({ id, label, icon: Icon }) => {
                const isActive = activeSection === id
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      setActiveSection(id)
                    }}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all"
                    style={
                      isActive
                        ? { background: 'rgba(0,125,255,0.1)', color: '#007DFF', fontWeight: 600 }
                        : { color: '#465058' }
                    }
                  >
                    <span className="shrink-0" style={isActive ? { color: '#007DFF' } : { color: '#9CA3AF' }}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {label}
                  </a>
                )
              })}
            </nav>

            {/* ── Main content ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">

              {/* Localisation */}
              <SectionCard id="localisation">
                <SectionHeader icon={<MapPinIcon className="h-4 w-4 text-[#007DFF]" />}>
                  Localisation
                </SectionHeader>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    {medecin.adresse && (
                      <p className="text-sm font-medium text-zinc-700">{medecin.adresse}</p>
                    )}
                    {medecin.ville && (
                      <p className="text-sm text-zinc-500">{medecin.ville}</p>
                    )}
                    {!medecin.adresse && !medecin.ville && (
                      <p className="text-sm text-zinc-400">Adresse non renseignée</p>
                    )}
                  </div>
                  {(medecin.adresse || medecin.ville) && (
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="shrink-0 flex items-center gap-1.5 rounded-lg border border-[#007DFF]/30 px-3 py-1.5 text-xs font-semibold text-[#007DFF] hover:bg-[#007DFF]/5 transition-colors"
                    >
                      <MapPinIcon className="h-3 w-3" />
                      Voir sur carte
                    </button>
                  )}
                </div>
              </SectionCard>

              {/* Spécialité */}
              <SectionCard id="specialite">
                <SectionHeader icon={<ProfileIcon className="h-4 w-4 text-[#007DFF]" />}>
                  Spécialité
                </SectionHeader>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium text-[#007DFF]"
                    style={{ background: 'rgba(0,125,255,0.08)' }}
                  >
                    {medecin.specialite}
                  </span>
                </div>
                {medecin.presentation && (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">{medecin.presentation}</p>
                )}
                {medecin.secteurTarifaire && (
                  <div className="mt-4 pt-4 border-t border-zinc-100 flex items-start gap-3">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: SECTEUR_COLOR[medecin.secteurTarifaire] }}
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-700">
                        {SECTEUR_LABELS[medecin.secteurTarifaire]}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {SECTEUR_REMB[medecin.secteurTarifaire]}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">Carte Vitale acceptée</p>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Horaires */}
              <SectionCard id="horaires">
                <SectionHeader icon={<ClockIcon className="h-4 w-4 text-[#007DFF]" />}>
                  Horaires d&apos;ouverture
                </SectionHeader>
                <div className="mt-4 flex flex-col">
                  {DAYS.map((d, i) => {
                    const isOpen = OPEN_DAYS.has(d.key)
                    const isToday = d.key === TODAY_KEY
                    return (
                      <div
                        key={d.key}
                        className={`flex items-center justify-between py-2.5 ${
                          i < DAYS.length - 1 ? 'border-b border-zinc-100' : ''
                        }`}
                      >
                        <span className={`text-sm ${isToday ? 'font-semibold text-[#007DFF]' : 'text-zinc-600'}`}>
                          {d.label}
                          {isToday && (
                            <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#007DFF]"
                              style={{ background: 'rgba(0,125,255,0.08)' }}>
                              Aujourd&apos;hui
                            </span>
                          )}
                        </span>
                        <span className={`text-sm ${isToday ? 'font-semibold text-zinc-800' : isOpen ? 'text-zinc-700' : 'text-zinc-400'}`}>
                          {isOpen ? '09:00 – 18:00' : 'Fermé'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </SectionCard>

              {/* Langues */}
              {medecin.langues && medecin.langues.length > 0 && (
                <SectionCard id="langues">
                  <SectionHeader icon={<GlobeIcon className="h-4 w-4 text-[#007DFF]" />}>
                    Langues parlées
                  </SectionHeader>
                  <div className="mt-4 flex flex-col gap-1.5">
                    {medecin.langues.map((l) => (
                      <p key={l} className="text-sm text-zinc-700">{l}</p>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Cabinet */}
              <SectionCard id="cabinet">
                <SectionHeader icon={<PhotoIcon className="h-4 w-4 text-[#007DFF]" />}>
                  Photos du cabinet
                </SectionHeader>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {CABINET_PHOTOS.map((p, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden aspect-[4/3] flex items-end"
                      style={{ background: p.bg }}
                    >
                      <MapGrid />
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ color: '#3793E0' }}
                      >
                        <PhotoIcon className="h-8 w-8 opacity-30" />
                      </div>
                      <span className="relative z-10 w-full bg-white/80 backdrop-blur-sm px-2.5 py-1.5 text-[11px] font-medium text-zinc-600">
                        {p.label}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Informations */}
              {medecin.inpe && (
                <SectionCard id="informations">
                  <SectionHeader icon={<CardIcon className="h-4 w-4 text-[#007DFF]" />}>
                    Informations professionnelles
                  </SectionHeader>
                  <div className="mt-4">
                    <p className="text-xs text-zinc-400">Numéro INPE</p>
                    <p className="mt-0.5 font-mono text-sm text-zinc-700">{medecin.inpe}</p>
                  </div>
                </SectionCard>
              )}

            </div>

            {/* ── Sidebar ── */}
            <aside className="w-[260px] shrink-0 sticky top-24 flex flex-col gap-4">

              {/* CTA card */}
              <div className="rounded-xl bg-white shadow-sm border border-zinc-200/80 overflow-hidden">
                {/* Doctor mini recap */}
                <div className="px-5 pt-5 pb-4 flex flex-col items-center text-center">
                  <div className="rounded-full ring-4 ring-[#007DFF]/10 overflow-hidden mb-3">
                    <MedecinAvatar
                      firstName={medecin.firstName}
                      lastName={medecin.lastName}
                      photoUrl={(medecin as { photoUrl?: string | null }).photoUrl}
                      size="lg"
                    />
                  </div>
                  <p className="text-sm font-bold text-zinc-800">
                    Dr.&nbsp;{medecin.firstName} {medecin.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{medecin.specialite}</p>
                  {medecin.ville && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-400">
                      <MapPinIcon className="h-3 w-3" />
                      {medecin.ville}
                    </p>
                  )}
                </div>

                {/* Rating row */}
                <div className="mx-5 mb-4 flex items-center justify-center gap-2 rounded-lg bg-zinc-50 px-3 py-2">
                  <StarRating value={4.6} />
                  <span className="text-xs font-semibold text-zinc-700">4.6</span>
                  <span className="text-[11px] text-zinc-400">· 127 avis</span>
                </div>

                {/* CTA button */}
                <div className="px-5 pb-5">
                  <Link
                    href={`/medecins/${medecin.id}/rdv`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] shadow-md"
                    style={{ background: '#007DFF', boxShadow: '0 4px 14px rgba(0,125,255,0.35)' }}
                  >
                    <CalendarIcon />
                    Prendre rendez-vous
                  </Link>
                  <p className="mt-2 text-center text-[11px] text-zinc-400">
                    Consultation en cabinet
                  </p>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </div>

      {/* ── Map modal ── */}
      {showMap && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowMap(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-[#007DFF]" />
                <span className="text-sm font-semibold text-zinc-800">{mapQuery}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Embedded map */}
            <iframe
              title="Localisation du cabinet"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed&z=15`}
              width="100%"
              height="420"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Helpers ──────────────────────────────────────── */

function SectionCard({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-28 rounded-xl bg-white shadow-sm border border-zinc-200/80 px-6 py-5">
      {children}
    </div>
  )
}

function SectionHeader({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0">{icon}</span>
      <h2 className="text-sm font-bold text-zinc-800">{children}</h2>
    </div>
  )
}

function MapGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="mg" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#3793E0" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mg)" />
    </svg>
  )
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(1, Math.max(0, value - (i - 1)))
        return (
          <svg key={i} className="h-3.5 w-3.5" viewBox="0 0 24 24">
            <defs>
              <linearGradient id={`sg-${i}`}>
                <stop offset={`${fill * 100}%`} stopColor="#ECB22E" />
                <stop offset={`${fill * 100}%`} stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={`url(#sg-${i})`}
            />
          </svg>
        )
      })}
    </div>
  )
}

/* ── Icons ────────────────────────────────────────── */

function ArrowLeftIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function MapPinIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function ProfileIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}


function ClockIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  )
}

function GlobeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  )
}

function PhotoIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function CardIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20" />
    </svg>
  )
}
