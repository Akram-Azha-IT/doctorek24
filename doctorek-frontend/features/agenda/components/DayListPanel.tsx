'use client'

import { DisponibiliteForm } from './DisponibiliteForm'
import { DAYS } from './AvailabilityWeekGrid'
import type { Disponibilite } from '@/lib/types'

interface DayListPanelProps {
  byDay: Map<string, Disponibilite[]>
  isLoading: boolean
  addingDay: string | null
  medecinId: string
  isDeleting: boolean
  onOpenAdd: (day: string) => void
  onDeleteBlock: (dispoId: string) => void
  onOpenCopy: (slot: Disponibilite) => void
  onSaved: () => void
  onCancel: () => void
}

export function DayListPanel({
  byDay, isLoading, addingDay, medecinId,
  isDeleting, onOpenAdd, onDeleteBlock, onOpenCopy, onSaved, onCancel,
}: DayListPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-gray-900">Disponibilités habituelles</p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
              Définissez vos disponibilités habituelles pour les rendez-vous.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-gray-100" />
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
                    <div className="flex items-center gap-2 px-4 py-2.5">
                      <span className="w-9 shrink-0 text-xs font-semibold text-gray-400">{dayShort}</span>
                      <span className="flex-1 text-xs italic text-gray-400">Indisponible</span>
                      <AddButton onClick={() => onOpenAdd(day.key)} />
                    </div>
                  ) : (
                    sortedSlots.map((slot, i) => (
                      <div key={slot.id} className="group flex items-center gap-2 px-4 py-2.5">
                        <span className="w-9 shrink-0 text-xs font-semibold text-gray-600">
                          {i === 0 ? dayShort : ''}
                        </span>
                        <span className="flex-1 text-xs font-medium tabular-nums text-gray-900">
                          {slot.heureDebut} – {slot.heureFin}
                        </span>

                        <DeleteButton onClick={() => onDeleteBlock(slot.id)} disabled={isDeleting} />

                        {i === sortedSlots.length - 1 && (
                          <AddButton onClick={() => onOpenAdd(day.key)} small />
                        )}

                        <CopyButton onClick={() => onOpenCopy(slot)} />
                      </div>
                    ))
                  )}

                  {isAddingHere && (
                    <div className="border-t border-blue-100 bg-blue-50/60 px-4 pb-4 pt-2">
                      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        Nouveau bloc — {day.long}
                      </p>
                      <DisponibiliteForm
                        medecinId={medecinId}
                        selectedDay={day.key}
                        dayLabel={day.long}
                        existing={undefined}
                        onSaved={onSaved}
                        onCancel={onCancel}
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
  )
}

function AddButton({ onClick, small }: { onClick: () => void; small?: boolean }) {
  const sz = small ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded p-1 text-gray-300 transition-colors hover:bg-blue-50 hover:text-blue-600"
      title="Ajouter un bloc"
    >
      <svg className={sz} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    </button>
  )
}

function DeleteButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
      title="Supprimer"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    </button>
  )
}

function CopyButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
      title="Copier vers d'autres jours"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
      </svg>
    </button>
  )
}
