'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { MedecinNav } from '@/features/medecin/components/MedecinNav'
import { useDisponibilites, useDeleteDisponibilite, useRdvsMedecin } from '@/features/agenda/hooks'
import { AvailabilityWeekGrid, DAYS } from '@/features/agenda/components/AvailabilityWeekGrid'
import { DisponibiliteForm } from '@/features/agenda/components/DisponibiliteForm'
import type { Disponibilite } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { toast } from 'sonner'

export default function DisponibilitesPage() {
  useRoleGuard('MEDECIN')

  const [medecinId, setMedecinId] = useState('')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [addingDay, setAddingDay] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'MEDECIN' && session.id) {
      setMedecinId(session.id)
    }
  }, [])

  const { data: disponibilites, isLoading, isError } = useDisponibilites(medecinId)
  const { data: rendezVous } = useRdvsMedecin(medecinId)
  const deleteMutation = useDeleteDisponibilite(medecinId)

  const byDay = new Map<string, Disponibilite[]>()
  ;(disponibilites ?? []).forEach((d) => {
    const arr = byDay.get(d.jourSemaine) ?? []
    arr.push(d)
    byDay.set(d.jourSemaine, arr)
  })

  function handleSelectDay(day: string) {
    setSelectedDay((prev) => (prev === day ? null : day))
    setAddingDay(null)
  }

  function handleOpenAdd(day: string) {
    setAddingDay((prev) => (prev === day ? null : day))
    setSelectedDay(day)
  }

  function handleDeleteBlock(dispoId: string) {
    deleteMutation.mutate(dispoId, {
      onSuccess: () => toast.success('Disponibilité supprimée'),
      onError: () => toast.error('Erreur lors de la suppression'),
    })
  }

  if (!medecinId) {
    return (
      <>
        <Header />
        <MedecinNav />
        <div className="flex items-center justify-center py-24">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
        </div>
      </>
    )
  }

  if (isError) {
    return (
      <>
        <Header />
        <MedecinNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Impossible de charger les disponibilités.
          </p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <MedecinNav />
      <main
        className="flex overflow-hidden bg-white"
        style={{ height: 'calc(100vh - 112px)' }}
      >
        {/* LEFT — settings panel */}
        <div className="w-80 shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">

          {/* Panel header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <svg className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-gray-900">Disponibilités habituelles</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                  Définissez vos disponibilités habituelles pour les rendez-vous.
                </p>
              </div>
            </div>
          </div>

          {/* Day rows */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-11 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <ul>
                {DAYS.map((day) => {
                  const slots = byDay.get(day.key) ?? []
                  const dayShort = day.short.charAt(0) + day.short.slice(1).toLowerCase() + '.'
                  const isAddingHere = addingDay === day.key
                  const sortedSlots = [...slots].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))

                  return (
                    <li key={day.key} className="border-b border-gray-50">
                      {slots.length === 0 ? (
                        /* Indisponible row */
                        <div className="flex items-center gap-2 px-4 py-2.5">
                          <span className="w-9 shrink-0 text-xs font-semibold text-gray-400">{dayShort}</span>
                          <span className="flex-1 text-xs italic text-gray-400">Indisponible</span>
                          <button
                            type="button"
                            onClick={() => handleOpenAdd(day.key)}
                            className="rounded p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Ajouter un bloc"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        /* Slot rows */
                        sortedSlots.map((slot, i) => (
                          <div key={slot.id} className="flex items-center gap-2 px-4 py-2.5 group">
                            <span className="w-9 shrink-0 text-xs font-semibold text-gray-600">
                              {i === 0 ? dayShort : ''}
                            </span>
                            <span className="flex-1 text-xs font-medium text-gray-900 tabular-nums">
                              {slot.heureDebut} – {slot.heureFin}
                            </span>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(slot.id)}
                              disabled={deleteMutation.isPending}
                              className="rounded p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>

                            {/* Add (only on last slot of that day) */}
                            {i === sortedSlots.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleOpenAdd(day.key)}
                                className="rounded p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Ajouter un bloc"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                              </button>
                            )}

                            {/* Copy (decorative) */}
                            <button
                              type="button"
                              className="rounded p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                              title="Copier vers d'autres jours"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}

                      {/* Inline add form */}
                      {isAddingHere && (
                        <div className="px-4 pt-2 pb-4 bg-blue-50/60 border-t border-blue-100">
                          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            Nouveau bloc — {day.long}
                          </p>
                          <DisponibiliteForm
                            medecinId={medecinId}
                            selectedDay={day.key}
                            dayLabel={day.long}
                            existing={undefined}
                            onSaved={() => setAddingDay(null)}
                            onCancel={() => setAddingDay(null)}
                          />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT — calendar grid */}
        <div className="flex-1 overflow-hidden">
          <AvailabilityWeekGrid
            disponibilites={disponibilites ?? []}
            rendezVous={rendezVous ?? []}
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
          />
        </div>
      </main>

    </>
  )
}
