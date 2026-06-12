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
  const totalSlots = Array.from(byDay.values()).reduce((s, arr) => s + arr.length, 0)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3.5 border-b" style={{ borderColor: '#F0F2F5' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: '#EBF4FF' }}>
            <svg className="h-4 w-4" fill="none" stroke="#007DFF" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold" style={{ color: '#010C2D' }}>Disponibilités</p>
            <p className="text-[11px]" style={{ color: '#A0AEC0' }}>
              {totalSlots === 0 ? 'Aucun créneau défini' : `${totalSlots} créneau${totalSlots > 1 ? 'x' : ''}`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl" style={{ background: '#F0F2F5' }} />
            ))}
          </div>
        ) : (
          <ul className="py-1">
            {DAYS.map((day) => {
              const slots = byDay.get(day.key) ?? []
              const isAddingHere = addingDay === day.key
              const sortedSlots = [...slots].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))
              const hasSlots = slots.length > 0

              return (
                <li key={day.key} className="border-b" style={{ borderColor: '#F5F7FA' }}>
                  {/* Day row(s) */}
                  {!hasSlots ? (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 group">
                      <span className="w-8 shrink-0 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#B0BAC9' }}>
                        {day.short}
                      </span>
                      <span className="flex-1 text-[11px] italic" style={{ color: '#C4CFDD' }}>Indisponible</span>
                      <AddButton onClick={() => onOpenAdd(day.key)} />
                    </div>
                  ) : (
                    sortedSlots.map((slot, i) => (
                      <div key={slot.id} className="group flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-[#F5F9FF]">
                        <span className="w-8 shrink-0 text-[11px] font-bold uppercase tracking-wide" style={{ color: i === 0 ? '#007DFF' : 'transparent' }}>
                          {day.short}
                        </span>
                        <span className="flex-1 text-[12px] font-semibold tabular-nums" style={{ color: '#010C2D' }}>
                          {slot.heureDebut} – {slot.heureFin}
                        </span>
                        <span className="text-[10px] font-medium mr-1" style={{ color: '#B0BAC9' }}>
                          {slot.dureeConsultation}min
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
                    <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: '#DFEFFE', background: '#F5F9FF' }}>
                      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#007DFF' }}>
                        Nouveau créneau — {day.long}
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
      className="rounded-lg p-1 transition-colors hover:bg-[#EBF4FF]"
      title="Ajouter un créneau"
    >
      <svg className={sz} fill="none" stroke="#007DFF" strokeWidth={1.75} viewBox="0 0 24 24">
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
      className="rounded-lg p-1 transition-colors hover:bg-[#FFEBEB] disabled:opacity-40"
      title="Supprimer"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="#E01E5A" strokeWidth={1.75} viewBox="0 0 24 24">
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
      className="rounded-lg p-1 transition-colors hover:bg-[#F5F7FA]"
      title="Copier vers d'autres jours"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="#A0AEC0" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
      </svg>
    </button>
  )
}
