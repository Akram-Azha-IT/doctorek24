'use client'

import { Header } from '@/components/Header'
import { MedecinNav } from '@/components/MedecinNav'
import { useRoleGuard } from '@/lib/useRoleGuard'

export default function ProfilPage() {
  useRoleGuard('MEDECIN')

  return (
    <>
      <Header />
      <MedecinNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Mon profil</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Informations professionnelles et paramètres du compte.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
          <p className="text-sm text-zinc-400">Bientôt disponible — Sprint 8</p>
        </div>
      </main>
    </>
  )
}
