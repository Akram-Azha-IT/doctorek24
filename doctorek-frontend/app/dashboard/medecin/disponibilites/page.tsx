'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { MedecinNav } from '@/components/MedecinNav'
import { useDisponibilites, useDeleteDisponibilite } from '@/features/agenda/hooks'
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
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'MEDECIN' && session.id) {
      setMedecinId(session.id)
    }
  }, [])

  const { data: disponibilites, isLoading, isError } = useDisponibilites(medecinId)
  const deleteMutation = useDeleteDisponibilite(medecinId)

  // Group disponibilites by day
  const byDay = new Map<string, Disponibilite[]>()
  ;(disponibilites ?? []).forEach((d) => {
    const arr = byDay.get(d.jourSemaine) ?? []
    arr.push(d)
    byDay.set(d.jourSemaine, arr)
  })

  function handleSelectDay(day: string) {
    setSelectedDay((prev) => (prev === day ? null : day))
    setShowForm(false)
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
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
              Disponibilités habituelles
            </p>
            <p className="mt-0.5 text-xs text-gray-500">Toutes les semaines · Blocs multiples par jour</p>
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
                  const selected = selectedDay === day.key
                  const dayShort = day.short.charAt(0) + day.short.slice(1).toLowerCase() + '.'

                  return (
                    <li key={day.key}>
                      {/* Day header button */}
                      <button
                        type="button"
                        onClick={() => handleSelectDay(day.key)}
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-gray-50 ${
                          selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className={`w-8 shrink-0 text-xs font-semibold ${
                            selected ? 'text-blue-600' : 'text-gray-500'
                          }`}
                        >
                          {dayShort}
                        </span>

                        <span className="flex-1 text-xs text-gray-700">
                          {slots.length === 0 ? (
                            <span className="italic text-gray-400">Indisponible</span>
                          ) : (
                            <span>{slots.length} bloc{slots.length > 1 ? 's' : ''}</span>
                          )}
                        </span>

                        {/* Add button */}
                        <span className={`shrink-0 transition-transform duration-150 ${selected ? 'rotate-90' : ''}`}>
                          {slots.length > 0 ? (
                            <svg
                              className={`h-3.5 w-3.5 ${selected ? 'text-blue-500' : 'text-gray-300'}`}
                              fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          ) : (
                            <svg className="h-3.5 w-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </span>
                      </button>

                      {/* Expanded: existing blocks + add form */}
                      {selected && (
                        <div className="bg-blue-50/50 border-b border-blue-100">
                          {/* Existing blocks */}
                          {slots
                            .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))
                            .map((slot) => (
                              <div key={slot.id} className="flex items-center gap-2 px-5 py-2.5 border-b border-blue-100/50">
                                <div className="flex-1">
                                  <span className="text-xs font-semibold text-zinc-700">
                                    {slot.heureDebut} – {slot.heureFin}
                                  </span>
                                  <span className="ml-2 text-[10px] text-zinc-500">
                                    {slot.dureeConsultation} min / rdv
                                  </span>
                                </div>

                                {/* Delete button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBlock(slot.id)}
                                  disabled={deleteMutation.isPending}
                                  className="rounded-md p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                  title="Supprimer ce bloc"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                  </svg>
                                </button>
                              </div>
                            ))}

                          {/* Add new block button or form */}
                          {!showForm ? (
                            <button
                              type="button"
                              onClick={() => setShowForm(true)}
                              className="w-full flex items-center gap-2 px-5 py-3 text-xs font-medium text-blue-600 hover:bg-blue-100/50 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                              Ajouter un bloc horaire
                            </button>
                          ) : (
                            <div className="px-5 py-4">
                              <p className="mb-3 text-xs font-semibold text-blue-700">
                                Nouveau bloc — {day.long}
                              </p>
                              <DisponibiliteForm
                                medecinId={medecinId}
                                selectedDay={day.key}
                                dayLabel={day.long}
                                existing={undefined}
                                onSaved={() => setShowForm(false)}
                                onCancel={() => setShowForm(false)}
                              />
                            </div>
                          )}
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
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
          />
        </div>
      </main>
    </>
  )
}
