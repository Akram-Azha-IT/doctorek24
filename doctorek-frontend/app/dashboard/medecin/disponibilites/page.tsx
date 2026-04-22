'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { MedecinNav } from '@/components/MedecinNav'
import { useDisponibilites } from '@/features/agenda/hooks'
import { AgendaView } from '@/features/agenda/components/AgendaView'
import { DisponibiliteForm } from '@/features/agenda/components/DisponibiliteForm'
import type { Disponibilite } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'

export default function DisponibilitesPage() {
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

  const byDay = new Map<string, Disponibilite[]>()
  ;(disponibilites ?? []).forEach((d) => {
    const arr = byDay.get(d.jourSemaine) ?? []
    arr.push(d)
    byDay.set(d.jourSemaine, arr)
  })

  return (
    <>
      <Header />
      <MedecinNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Mes disponibilités</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configurez vos horaires de consultation par jour de la semaine.
          </p>
        </div>

        {!medecinId ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
            <p className="text-sm text-zinc-400">Chargement…</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Impossible de charger les disponibilités.
          </p>
        ) : (
          <>
            <p className="text-sm text-zinc-500">
              {(disponibilites ?? []).length === 0
                ? 'Aucun jour configuré — cliquez sur un jour pour commencer.'
                : `${disponibilites!.length} créneau${disponibilites!.length > 1 ? 'x' : ''} configuré${disponibilites!.length > 1 ? 's' : ''}`}
            </p>
            <AgendaView
              disponibilites={disponibilites ?? []}
              selectedDay={selectedDay}
              onSelectDay={(day) => setSelectedDay((prev) => (prev === day ? null : day))}
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
