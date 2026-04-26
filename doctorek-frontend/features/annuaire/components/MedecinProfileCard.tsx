'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { MedecinProfile } from '@/lib/types'
import { MedecinAvatar } from './MedecinAvatar'

const SECTEUR_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Secteur 1 — Honoraires conventionnés',
  2: 'Secteur 2 — Honoraires libres',
  3: 'Secteur 3 — Non conventionné',
}

type Tab = 'info' | 'carte' | 'profil' | 'horaires'

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Informations clés' },
  { id: 'carte', label: 'Carte' },
  { id: 'profil', label: 'Profil' },
  { id: 'horaires', label: 'Horaires' },
]

interface MedecinProfileCardProps {
  medecin: MedecinProfile
}

export function MedecinProfileCard({ medecin }: MedecinProfileCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const accepte = medecin.acceptNouveauxPatients !== false

  return (
    <div className="w-full">
      {/* ── Hero banner ── */}
      <div className="bg-[#042651]">
        <div className="mx-auto max-w-6xl px-6 pb-8 pt-5">
          <Link
            href="/recherche"
            className="inline-flex items-center gap-1.5 text-[13px] text-blue-300 transition-colors hover:text-white"
          >
            <ArrowLeftIcon />
            Retour aux résultats
          </Link>
          <div className="mt-6 flex items-center gap-6">
            <div className="rounded-full ring-4 ring-white/20">
              <MedecinAvatar firstName={medecin.firstName} lastName={medecin.lastName} size="xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Dr. {medecin.firstName} {medecin.lastName}
              </h1>
              <p className="mt-1 text-[15px] text-blue-200">{medecin.specialite}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-6">
          <nav className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-5 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#1863A9] text-[#1863A9]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="min-h-screen bg-[#eef2f7]">
        <div className="mx-auto max-w-6xl px-6 py-6">

          {activeTab === 'info' && (
            <div className="flex items-start gap-6">

              {/* Left: info cards */}
              <div className="flex min-w-0 flex-1 flex-col gap-4">

                {/* Honoraires */}
                <InfoCard title="Honoraires et remboursement" icon={<EuroIcon />}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      {medecin.secteurTarifaire ? (
                        <>
                          <p className="text-sm text-zinc-700">{SECTEUR_LABELS[medecin.secteurTarifaire]}</p>
                          {medecin.secteurTarifaire === 1 && (
                            <p className="mt-1 text-sm text-zinc-500">Remboursement par l&apos;assurance maladie</p>
                          )}
                          {medecin.secteurTarifaire === 2 && (
                            <p className="mt-1 text-sm text-zinc-500">Dépassements d&apos;honoraires possibles</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-zinc-500">Tarif non renseigné</p>
                      )}
                    </div>
                    <div className="border-t border-zinc-100 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">INPE</p>
                      <p className="font-mono text-sm text-zinc-700">{medecin.inpe}</p>
                    </div>
                  </div>
                </InfoCard>

                {/* Patients acceptés */}
                <InfoCard title="Patients acceptés" icon={<PatientsIcon />}>
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${accepte ? 'bg-emerald-500' : 'bg-red-400'}`}
                    />
                    <p className={`text-sm ${accepte ? 'text-zinc-700' : 'text-zinc-500'}`}>
                      {accepte
                        ? 'Accepte les nouveaux patients'
                        : "N'accepte pas les nouveaux patients pour le moment"}
                    </p>
                  </div>
                </InfoCard>

                {/* Spécialité */}
                <InfoCard title="Spécialité" icon={<StethoscopeIcon />}>
                  <div className="flex flex-wrap gap-2">
                    <Chip label={medecin.specialite} />
                  </div>
                </InfoCard>

                {/* Langues */}
                {medecin.langues && medecin.langues.length > 0 && (
                  <InfoCard title="Langues parlées" icon={<GlobeIcon />}>
                    <div className="flex flex-wrap gap-2">
                      {medecin.langues.map((l) => (
                        <Chip key={l} label={l} />
                      ))}
                    </div>
                  </InfoCard>
                )}

                {/* Présentation */}
                {medecin.presentation && (
                  <InfoCard title="Présentation" icon={<ProfileIcon />}>
                    <p className="text-sm leading-relaxed text-zinc-700">{medecin.presentation}</p>
                  </InfoCard>
                )}
              </div>

              {/* Right: sticky summary */}
              <div className="w-72 shrink-0">
                <div className="sticky top-[97px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                  <div className="border-b border-zinc-100 px-5 py-4">
                    <h3 className="font-semibold text-zinc-900">Récapitulatif</h3>
                  </div>
                  <div className="flex flex-col gap-4 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <UserCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      <p className="text-sm text-zinc-700">
                        {accepte
                          ? 'Accepte les nouveaux patients'
                          : "N'accepte pas les nouveaux patients"}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      <div>
                        <p className="text-sm text-zinc-700">{medecin.adresse}</p>
                        <p className="text-sm text-zinc-500">{medecin.ville}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <Link
                      href={`/medecins/${medecin.id}/rdv`}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1863A9] py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#064178]"
                    >
                      <CalendarIcon />
                      Prendre rendez-vous
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'info' && (
            <div className="flex items-center justify-center py-24">
              <p className="text-sm text-zinc-400">Section en cours de développement</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ───────────────────────────────── */

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-zinc-100 px-6 py-4">
        <span className="text-zinc-400">{icon}</span>
        <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
      {label}
    </span>
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

function EuroIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.75A4.5 4.5 0 109 12c0 .73.173 1.419.479 2.03M9.75 16.25H15M9 12.25H15" />
    </svg>
  )
}

function PatientsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function StethoscopeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19a6 6 0 01-6-6V7a6 6 0 0112 0v6a6 6 0 01-6 6zm7-3h2a2 2 0 110 4h-2a2 2 0 110-4z" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
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
