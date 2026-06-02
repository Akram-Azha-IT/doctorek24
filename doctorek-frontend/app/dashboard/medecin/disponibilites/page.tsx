'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDisponibilites, useDeleteDisponibilite, useRdvsMedecin } from '@/features/agenda/hooks'
import { defineDisponibilite } from '@/features/agenda/api'
import { AvailabilityWeekGrid, DAYS } from '@/features/agenda/components/AvailabilityWeekGrid'
import { DayListPanel } from '@/features/agenda/components/DayListPanel'
import { CopySlotModal } from '@/features/agenda/components/CopySlotModal'
import { ResizableDivider } from '@/features/agenda/components/ResizableDivider'
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
  const [addingDay, setAddingDay] = useState<string | null>(null)
  const [copyingSlot, setCopyingSlot] = useState<Disponibilite | null>(null)
  const [copyTargetDays, setCopyTargetDays] = useState<string[]>([])
  const [isCopying, setIsCopying] = useState(false)
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT)
  const [isDragging, setIsDragging] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef(false)
  const qc = useQueryClient()

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setLeftWidth(Math.max(MIN_LEFT, Math.min(MAX_LEFT, e.clientX - rect.left)))
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current = false
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [handleMouseMove])

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [handleMouseMove, handleMouseUp])

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
    const session = getSession()
    if (session?.role === 'MEDECIN' && session.id) setMedecinId(session.id)
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

  function handleDeleteBlock(dispoId: string) {
    deleteMutation.mutate(dispoId, {
      onSuccess: () => toast.success('Disponibilité supprimée'),
      onError: () => toast.error('Erreur lors de la suppression'),
    })
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
        toast.error(`Échec sur : ${failedLabels}. Supprimez le créneau existant puis recopiez.`, { duration: 6000 })
      }
      setCopyingSlot(null)
      setCopyTargetDays([])
    } finally {
      setIsCopying(false)
    }
  }

  function handleToggleAll() {
    if (!copyingSlot) return
    const otherDays = DAYS.filter((d) => d.key !== copyingSlot.jourSemaine).map((d) => d.key)
    setCopyTargetDays(copyTargetDays.length === otherDays.length ? [] : otherDays)
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
      <main ref={containerRef} className="flex overflow-hidden bg-white" style={{ height: '100vh' }}>
        <div className="shrink-0 border-r border-gray-200 overflow-hidden" style={{ width: leftWidth }}>
          <DayListPanel
            byDay={byDay}
            isLoading={isLoading}
            addingDay={addingDay}
            medecinId={medecinId}
            isDeleting={deleteMutation.isPending}
            onOpenAdd={(day) => { setAddingDay((prev) => (prev === day ? null : day)); setSelectedDay(day) }}
            onDeleteBlock={handleDeleteBlock}
            onOpenCopy={(slot) => { setCopyingSlot(slot); setCopyTargetDays([]) }}
            onSaved={() => setAddingDay(null)}
            onCancel={() => setAddingDay(null)}
          />
        </div>

        <ResizableDivider isDragging={isDragging} onMouseDown={handleDividerMouseDown} />

        <div className="flex-1 overflow-hidden">
          <AvailabilityWeekGrid
            disponibilites={disponibilites ?? []}
            rendezVous={rendezVous ?? []}
            selectedDay={selectedDay}
            onSelectDay={(day) => { setSelectedDay((prev) => (prev === day ? null : day)); setAddingDay(null) }}
          />
        </div>
      </main>

      {copyingSlot && (
        <CopySlotModal
          slot={copyingSlot}
          targetDays={copyTargetDays}
          isCopying={isCopying}
          onToggleDay={(day) => setCopyTargetDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])}
          onToggleAll={handleToggleAll}
          onConfirm={handleCopyConfirm}
          onCancel={() => { setCopyingSlot(null); setCopyTargetDays([]) }}
        />
      )}
    </>
  )
}
