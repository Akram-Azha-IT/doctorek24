import { DAYS } from './AvailabilityWeekGrid'
import type { Disponibilite } from '@/lib/types'

interface CopySlotModalProps {
  slot: Disponibilite
  targetDays: string[]
  isCopying: boolean
  onToggleDay: (day: string) => void
  onToggleAll: () => void
  onConfirm: () => void
  onCancel: () => void
}

export function CopySlotModal({
  slot, targetDays, isCopying, onToggleDay, onToggleAll, onConfirm, onCancel,
}: CopySlotModalProps) {
  const otherDays = DAYS.filter((d) => d.key !== slot.jourSemaine)
  const allSelected = targetDays.length === otherDays.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-80 rounded-xl bg-white shadow-2xl ring-1 ring-gray-200">
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900">Copier vers d&apos;autres jours</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {slot.heureDebut} – {slot.heureFin} · {slot.dureeConsultation} min
          </p>
        </div>

        <div className="space-y-2 px-5 py-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Jours cibles</p>
            <button
              type="button"
              onClick={onToggleAll}
              className="text-[10px] font-medium text-blue-600 hover:underline"
            >
              {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>

          {otherDays.map((d) => (
            <label key={d.key} className="group flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={targetDays.includes(d.key)}
                onChange={() => onToggleDay(d.key)}
                className="h-4 w-4 rounded border-gray-300 accent-blue-600 text-blue-600"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{d.long}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isCopying}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCopying || targetDays.length === 0}
            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isCopying ? 'Copie…' : `Copier (${targetDays.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
