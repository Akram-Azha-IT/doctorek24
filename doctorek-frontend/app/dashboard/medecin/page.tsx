'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { useDisponibilites } from '@/features/agenda/hooks'
import { WeeklyGrid } from '@/features/agenda/components/WeeklyGrid'
import { DisponibiliteForm } from '@/features/agenda/components/DisponibiliteForm'
import type { Disponibilite } from '@/lib/types'
import { getSession } from '@/lib/session'

export default function MedecinDashboardPage() {
  const [inputId, setInputId] = useState('')
  const [medecinId, setMedecinId] = useState('')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Pre-fill from session if logged in
  useEffect(() => {
    const session = getSession()
    if (session?.role === 'MEDECIN' && session.id) {
      setInputId(session.id)
      setMedecinId(session.id)
    }
  }, [])

  const { data: disponibilites, isLoading, isError } = useDisponibilites(medecinId)

  function handleLoad() {
    const trimmed = inputId.trim()
    if (!trimmed) return
    setMedecinId(trimmed)
    setSelectedDay(null)
  }

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

        {/* UUID input */}
        <div className="mb-8 flex gap-2">
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            placeholder="Votre identifiant medecin (UUID)"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <button
            onClick={handleLoad}
            disabled={!inputId.trim()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
          >
            Charger
          </button>
        </div>

        {!medecinId && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
            <p className="text-sm text-zinc-400">
              Entrez votre identifiant medecin pour gerer votre agenda
            </p>
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
