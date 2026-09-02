'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Conversation } from '@/lib/types'
import { useSession } from '@/lib/useSession'
import { useRdvsPatient } from '@/features/agenda/hooks'
import { useMedecin } from '@/features/annuaire/hooks'
import { useStartConversation } from '../hooks'
import { Avatar } from '@/components/Avatar'
import LogoLoader from '@/components/LogoLoader'
import { Plus, SquarePen, X } from 'lucide-react'

interface NewConversationButtonProps {
  onStarted: (conv: Conversation) => void
  variant?: 'compact' | 'icon'
  onDoctorAction?: () => void
}

/**
 * Patient-only entry point to start a conversation. Doctors reply to existing threads, so this
 * renders nothing for them. Doctors are sourced from the patient's appointments — you can only
 * message a doctor you have (or had) a RDV with.
 */
export function NewConversationButton({
  onStarted,
  variant = 'compact',
  onDoctorAction,
}: NewConversationButtonProps) {
  const session = useSession()
  const patientId = session?.id ?? ''
  const role = session?.role ?? null
  const [open, setOpen] = useState(false)

  if (role === 'MEDECIN') {
    if (!onDoctorAction) return null
    return (
      <button
        type="button"
        onClick={onDoctorAction}
        aria-label="Rechercher une conversation"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D9E1EC] bg-white text-[#007DFF] transition-colors hover:border-[#B6DAF7] hover:bg-[#F0F7FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007DFF]/10"
      >
        <SquarePen className="h-5 w-5" aria-hidden="true" />
      </button>
    )
  }

  if (role !== 'PATIENT') return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={variant === 'icon' ? 'Nouvelle conversation' : undefined}
        className={variant === 'icon'
          ? 'flex h-11 w-11 items-center justify-center rounded-xl border border-[#D9E1EC] bg-white text-[#007DFF] transition-colors hover:border-[#B6DAF7] hover:bg-[#F0F7FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007DFF]/10'
          : 'flex items-center gap-1.5 rounded-full bg-[#007DFF] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#00263C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40'}
      >
        {variant === 'icon' ? (
          <SquarePen className="h-5 w-5" aria-hidden="true" />
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Nouveau
          </>
        )}
      </button>

      {open && (
        <DoctorPickerModal
          patientId={patientId}
          onClose={() => setOpen(false)}
          onStarted={(conv) => { setOpen(false); onStarted(conv) }}
        />
      )}
    </>
  )
}

function DoctorPickerModal({
  patientId,
  onClose,
  onStarted,
}: {
  patientId: string
  onClose: () => void
  onStarted: (conv: Conversation) => void
}) {
  const { data: rdvs = [], isLoading } = useRdvsPatient(patientId)
  const startConv = useStartConversation()
  const [startingId, setStartingId] = useState<string | null>(null)

  // Distinct doctors from the patient's appointments (most recent first by appointment date).
  const medecinIds = useMemo(() => {
    const seen = new Set<string>()
    return [...rdvs]
      .sort((a, b) => b.dateRdv.localeCompare(a.dateRdv))
      .map((r) => r.medecinId)
      .filter((id) => (seen.has(id) ? false : (seen.add(id), true)))
  }, [rdvs])

  async function pick(medecinId: string) {
    if (startingId) return
    setStartingId(medecinId)
    try {
      const conv = await startConv.mutateAsync(medecinId)
      onStarted(conv)
    } catch {
      setStartingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[80vh] flex flex-col pb-[env(safe-area-inset-bottom)] sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h3 className="text-base font-bold text-[#010C2D]">Contacter un médecin</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors"
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LogoLoader width={100} label="Chargement des médecins…" />
            </div>
          ) : medecinIds.length === 0 ? (
            <div className="flex flex-col items-center text-center py-12 px-6">
              <p className="text-sm font-semibold text-zinc-700">Aucun médecin disponible</p>
              <p className="text-xs text-zinc-400 mt-1">Prenez un rendez-vous pour pouvoir contacter un médecin.</p>
              <Link href="/recherche" className="mt-3 text-sm font-semibold text-[#007DFF] hover:underline">
                Prendre un rendez-vous →
              </Link>
            </div>
          ) : (
            <ul className="py-2">
              {medecinIds.map((id) => (
                <DoctorRow
                  key={id}
                  medecinId={id}
                  starting={startingId === id}
                  disabled={startingId !== null && startingId !== id}
                  onPick={() => pick(id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function DoctorRow({
  medecinId,
  starting,
  disabled,
  onPick,
}: {
  medecinId: string
  starting: boolean
  disabled: boolean
  onPick: () => void
}) {
  const { data: medecin } = useMedecin(medecinId)
  const name = medecin ? `Dr. ${medecin.firstName} ${medecin.lastName}` : 'Médecin…'

  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        disabled={disabled || starting}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F7FF] transition-colors disabled:opacity-50 text-left"
      >
        <Avatar name={name} photoUrl={medecin?.photoUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#333333] truncate">{name}</p>
          {medecin?.specialite && (
            <p className="text-xs text-zinc-400 truncate">{medecin.specialite}{medecin.ville ? ` · ${medecin.ville}` : ''}</p>
          )}
        </div>
        {starting && (
          <LogoLoader variant="mark" size={16} decorative />
        )}
      </button>
    </li>
  )
}
