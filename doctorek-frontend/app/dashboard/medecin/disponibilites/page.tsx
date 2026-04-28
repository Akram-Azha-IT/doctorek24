'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDisponibilites, useDeleteDisponibilite, useRdvsMedecin } from '@/features/agenda/hooks'
import { defineDisponibilite } from '@/features/agenda/api'
import { AvailabilityWeekGrid, DAYS } from '@/features/agenda/components/AvailabilityWeekGrid'
import { DisponibiliteForm } from '@/features/agenda/components/DisponibiliteForm'
import type { Disponibilite } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { toast } from 'sonner'

const MIN_LEFT = 220
const MAX_LEFT = 560
const DEFAULT_LEFT = 320

export default function DisponibilitesPage() {
  useRoleGuard('MEDECIN')

  const [medecinId, setMedecinId] = useState('')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef(false)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const newWidth = Math.max(MIN_LEFT, Math.min(MAX_LEFT, e.clientX - rect.left))
    setLeftWidth(newWidth)
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current = false
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [handleMouseMove])

  function handleDividerMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = true
    setIsDragging(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [handleMouseMove, handleMouseUp])

  const [addingDay, setAddingDay] = useState<string | null>(null)
  const [copyingSlot, setCopyingSlot] = useState<Disponibilite | null>(null)
  const [copyTargetDays, setCopyTargetDays] = useState<string[]>([])
  const [isCopying, setIsCopying] = useState(false)
  const qc = useQueryClient()

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

  function handleOpenCopy(slot: Disponibilite) {
    setCopyingSlot(slot)
    setCopyTargetDays([])
  }

  function toggleCopyDay(day: string) {
    setCopyTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  async function handleCopyConfirm() {
    if (!copyingSlot || copyTargetDays.length === 0) return
    setIsCopying(true)
    try {
      const results = await Promise.allSettled(
        copyTargetDays.map((day) =>
          defineDisponibilite(medecinId, {
            jourSemaine: day,
            heureDebut: copyingSlot.heureDebut,
            heureFin: copyingSlot.heureFin,
            dureeConsultation: copyingSlot.dureeConsultation,
          }),
        ),
      )
      qc.invalidateQueries({ queryKey: ['disponibilites', medecinId] })

      const failedDays = copyTargetDays.filter((_, i) => results[i].status === 'rejected')
      const ok = results.length - failedDays.length

      if (failedDays.length === 0) {
        toast.success(`Copié vers ${ok} jour(s)`)
      } else {
        const failedLabels = failedDays
          .map((key) => DAYS.find((d) => d.key === key)?.long ?? key)
          .join(', ')
        if (ok > 0) toast.success(`Copié vers ${ok} jour(s)`)
        toast.error(
          `Échec sur : ${failedLabels}. Supprimez le créneau existant sur ce(s) jour(s) puis recopiez.`,
          { duration: 6000 },
        )
      }
      setCopyingSlot(null)
      setCopyTargetDays([])
    } finally {
      setIsCopying(false)
    }
  }

  if (!medecinId) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    )
  }

  if (isError) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Impossible de charger les disponibilités.
        </p>
      </main>
    )
  }

  return (
    <>
      <main
        ref={containerRef}
        className="flex overflow-hidden bg-white"
        style={{ height: '100vh' }}
      >
        {/* LEFT — settings panel */}
        <div
          className="shrink-0 border-r border-gray-200 flex flex-col overflow-hidden"
          style={{ width: leftWidth }}
        >

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

                            {/* Copy */}
                            <button
                              type="button"
                              onClick={() => handleOpenCopy(slot)}
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

        {/* DIVIDER — resizable */}
        <div
          onMouseDown={handleDividerMouseDown}
          className={`group relative flex w-1 shrink-0 cursor-col-resize select-none items-center justify-center transition-colors ${
            isDragging ? 'bg-[#1863A9]' : 'bg-gray-200 hover:bg-[#1863A9]/40'
          }`}
        >
          {/* VS Code-style handle pill */}
          <div className={`absolute z-10 flex flex-col items-center gap-0.5 rounded-full px-0.5 py-2 transition-opacity ${
            isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <svg className="h-3 w-3 text-[#1863A9]" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" transform="rotate(90 8 8)"/>
            </svg>
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

      {/* Copy modal */}
      {copyingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded-xl bg-white shadow-2xl ring-1 ring-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Copier vers d'autres jours</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {copyingSlot.heureDebut} – {copyingSlot.heureFin} · {copyingSlot.dureeConsultation} min
              </p>
            </div>
            <div className="px-5 py-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Jours cibles</p>
                <button
                  type="button"
                  onClick={() => {
                    const otherDays = DAYS.filter((d) => d.key !== copyingSlot.jourSemaine).map((d) => d.key)
                    setCopyTargetDays(copyTargetDays.length === otherDays.length ? [] : otherDays)
                  }}
                  className="text-[10px] font-medium text-blue-600 hover:underline"
                >
                  {copyTargetDays.length === DAYS.length - 1 ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
              {DAYS.filter((d) => d.key !== copyingSlot.jourSemaine).map((d) => (
                <label key={d.key} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={copyTargetDays.includes(d.key)}
                    onChange={() => toggleCopyDay(d.key)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{d.long}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setCopyingSlot(null); setCopyTargetDays([]) }}
                disabled={isCopying}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCopyConfirm}
                disabled={isCopying || copyTargetDays.length === 0}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isCopying ? 'Copie…' : `Copier (${copyTargetDays.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
