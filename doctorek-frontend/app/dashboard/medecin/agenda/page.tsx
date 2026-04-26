'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { useRdvsMedecin, useDisponibilites } from '@/features/agenda/hooks'
import { AgendaMedecinView } from '@/features/agenda/components/AgendaMedecinView'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { MedecinNav } from '@/features/medecin/components/MedecinNav'

export default function AgendaMedecinPage() {
  useRoleGuard('MEDECIN')

  const [medecinId, setMedecinId] = useState('')

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'MEDECIN' && session.id) {
      setMedecinId(session.id)
    }
  }, [])

  const { data: rdvs, isLoading: loadingRdvs, isError: errorRdvs } = useRdvsMedecin(medecinId)
  const { data: disponibilites, isLoading: loadingDispos } = useDisponibilites(medecinId)

  const isLoading = loadingRdvs || loadingDispos

  return (
    <>
      <Header />
      <MedecinNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Mon agenda</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {new Intl.DateTimeFormat('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date())}
          </p>
        </div>

        {!medecinId ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
            <p className="text-sm text-zinc-400">Chargement…</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        ) : errorRdvs ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Impossible de charger les rendez-vous.
          </p>
        ) : (
          <AgendaMedecinView
            medecinId={medecinId}
            rdvs={rdvs ?? []}
            disponibilites={disponibilites ?? []}
          />
        )}
      </main>
    </>
  )
}
