'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { RegisterForm } from '@/features/auth/components/RegisterForm'
import { RegisterMedecinForm } from '@/features/auth/components/RegisterMedecinForm'

type Tab = 'patient' | 'medecin'

export default function InscriptionPage() {
  const [tab, setTab] = useState<Tab>('patient')

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Créer un compte</h1>
          <p className="text-zinc-500 text-sm">
            Rejoignez Doctorek en tant que patient ou médecin.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border bg-zinc-50 p-1 mb-6 gap-1">
          <TabButton active={tab === 'patient'} onClick={() => setTab('patient')}>
            Patient
          </TabButton>
          <TabButton active={tab === 'medecin'} onClick={() => setTab('medecin')}>
            Médecin
          </TabButton>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          {tab === 'patient' ? <RegisterForm /> : <RegisterMedecinForm />}
        </div>
      </main>
    </>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-zinc-900 shadow-sm'
          : 'text-zinc-500 hover:text-zinc-700'
      }`}
    >
      {children}
    </button>
  )
}
