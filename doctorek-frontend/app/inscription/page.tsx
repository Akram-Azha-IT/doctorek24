'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { SegmentedTabs } from '@/features/auth/components/AuthField'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { RegisterMedecinForm } from '@/features/auth/components/RegisterMedecinForm'
import { Header } from '@/components/Header'

type Tab = 'patient' | 'medecin'

const PATIENT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
)

const MEDECIN_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3v6a4 4 0 0 0 8 0V3" />
    <path d="M10 13v3a5 5 0 0 0 10 0v-3" />
    <circle cx="20" cy="10" r="2" />
  </svg>
)

const TABS = [
  { value: 'patient' as const, label: 'Patient', icon: PATIENT_ICON },
  { value: 'medecin' as const, label: 'Medecin', icon: MEDECIN_ICON },
] as const

const DESCRIPTIONS: Record<Tab, string> = {
  patient: 'Carte virtuelle, prise de RDV en ligne et dossier medical centralise en quelques secondes.',
  medecin: 'Agenda intelligent, profil public et suivi de vos patients dans une interface dediee aux soignants.',
}

const EYEBROWS: Record<Tab, string> = {
  patient: 'Espace patient',
  medecin: 'Espace medecin',
}

export default function InscriptionPage() {
  const [tab, setTab] = useState<Tab>('patient')

  return (
    <>
      <Header />
      <AuthShell
        eyebrow={EYEBROWS[tab]}
        headline={
          <>
            Rejoignez{' '}
            <span className="text-[#007DFF]">Doctorek</span>
          </>
        }
        description={DESCRIPTIONS[tab]}
        bullets={
          tab === 'patient'
            ? ['Carte virtuelle', 'RDV en ligne', 'Dossier centralise']
            : ['Agenda integre', 'Patients suivis', 'Profil public']
        }
        rightTitle="Creer mon compte"
        rightSubtitle="Choisissez votre profil puis renseignez vos informations."
      >
        <div className="flex flex-col gap-2.5">
          <SegmentedTabs<Tab>
            ariaLabel="Type de compte"
            value={tab}
            onChange={setTab}
            options={TABS}
          />

          {tab === 'patient' ? <RegisterForm /> : <RegisterMedecinForm />}

          <p className="text-center text-sm text-[#465058]">
            {'Deja un compte ? '}
            <Link
              href="/login"
              className="font-semibold text-[#007DFF] underline-offset-4 hover:underline"
            >
              {'Se connecter'}
            </Link>
          </p>
        </div>
      </AuthShell>
    </>
  )
}
