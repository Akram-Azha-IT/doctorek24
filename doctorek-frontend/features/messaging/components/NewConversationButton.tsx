'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Conversation } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useRdvsPatient } from '@/features/agenda/hooks'
import { useMedecin } from '@/features/annuaire/hooks'
import { useStartConversation } from '../hooks'

interface NewConversationButtonProps {
  onStarted: (conv: Conversation) => void
}

/**
 * Patient-only entry point to start a conversation. Doctors reply to existing threads, so this
 * renders nothing for them. Doctors are sourced from the patient's appointments — you can only
 * message a doctor you have (or had) a RDV with.
 */
export function NewConversationButton({ onStarted }: NewConversationButtonProps) {
  const [patientId, setPatientId] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const s = getSession()
    if (s) { setPatientId(s.id); setRole(s.role) }
  }, [])

  if (role !== 'PATIENT') return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-[#007DFF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#00263C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
        Nouveau
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-[#007DFF] border-t-transparent rounded-full animate-spin" />
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
  const initials = medecin ? `${medecin.firstName?.[0] ?? ''}${medecin.lastName?.[0] ?? ''}`.toUpperCase() : '·'

  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        disabled={disabled || starting}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F7FF] transition-colors disabled:opacity-50 text-left"
      >
        <div className="w-10 h-10 rounded-full bg-[#EBF4FF] flex items-center justify-center shrink-0 overflow-hidden">
          {medecin?.photoUrl ? (
            <img src={medecin.photoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-[#007DFF]">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#333333] truncate">{name}</p>
          {medecin?.specialite && (
            <p className="text-xs text-zinc-400 truncate">{medecin.specialite}{medecin.ville ? ` · ${medecin.ville}` : ''}</p>
          )}
        </div>
        {starting && (
          <div className="w-4 h-4 border-2 border-[#007DFF] border-t-transparent rounded-full animate-spin shrink-0" />
        )}
      </button>
    </li>
  )
}
