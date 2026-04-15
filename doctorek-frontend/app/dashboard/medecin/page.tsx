'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { useDisponibilites } from '@/features/agenda/hooks'
import { WeeklyGrid } from '@/features/agenda/components/WeeklyGrid'
import { DisponibiliteForm } from '@/features/agenda/components/DisponibiliteForm'
import type { Disponibilite } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'

export default function MedecinDashboardPage() {
  useRoleGuard('MEDECIN')

  const [medecinId, setMedecinId] = useState('')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'MEDECIN' && session.id) {
      setMedecinId(session.id)
    }
  }, [])

  const { data: disponibilites, isLoading, isError } = useDisponibilites(medecinId)

  // Group disponibilites by day — up to 2 slots per day
  const byDay = new Map<string, Disponibilite[]>()
  ;(disponibilites ?? []).forEach((d) => {
    const arr = byDay.get(d.jourSemaine) ?? []
    arr.push(d)
    byDay.set(d.jourSemaine, arr)
  })

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Mon Agenda</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configurez vos disponibilites hebdomadaires
          </p>
        </div>

        {!medecinId && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
            <p className="text-sm text-zinc-400">Chargement de votre agenda…</p>
          </div>
        )}

        {medecinId && isLoading && (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        )}

        {medecinId && isError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Impossible de charger les disponibilites. Verifiez l&apos;identifiant medecin.
          </p>
        )}

        {medecinId && !isLoading && !isError && disponibilites && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-zinc-500">
                {disponibilites.length === 0
                  ? 'Aucun jour configure — cliquez sur un jour pour commencer'
                  : `${disponibilites.length} creneau${disponibilites.length > 1 ? 'x' : ''} configure${disponibilites.length > 1 ? 's' : ''}`}
              </span>
            </div>

            <WeeklyGrid
              disponibilites={disponibilites}
              selectedDay={selectedDay}
              onSelectDay={(day) =>
                setSelectedDay((prev) => (prev === day ? null : day))
              }
            />

            {selectedDay && (
              <DisponibiliteForm
                medecinId={medecinId}
                selectedDay={selectedDay}
                existing={byDay.get(selectedDay) ?? []}
                onSaved={() => setSelectedDay(null)}
              />
            )}
          </>
        )}
      </main>
    </>
  )
}
