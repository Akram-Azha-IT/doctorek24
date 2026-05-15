'use client'

import { useEffect, useState } from 'react'
import { useRdvsPatient, useReprogrammerRdv } from '@/features/agenda/hooks'
import { RdvTimeline } from '@/features/agenda/components/RdvTimeline'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { toast } from 'sonner'

export default function PatientRdvsPage() {
  useRoleGuard('PATIENT')

  const [patientId, setPatientId] = useState('')

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'PATIENT' && session.id) {
      setPatientId(session.id)
    }
  }, [])

  const { data: rdvs, isLoading, isError } = useRdvsPatient(patientId)
  const { mutate: reprogrammer, isPending: isReprogramming } = useReprogrammerRdv(patientId)

  function handleReprogrammer(id: string, date: string, heure: string) {
    reprogrammer({ id, date, heure }, {
      onSuccess: () => toast.success('Rendez-vous reprogrammé'),
      onError: () => toast.error('Erreur lors de la reprogrammation'),
    })
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      {(!patientId || isLoading) && (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[84px] animate-pulse rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden flex"
            >
              <div className="w-16 shrink-0 bg-[#DFEFFE]/60" />
              <div className="flex-1 p-4 space-y-2">
                <div className="h-3 w-40 rounded bg-zinc-100" />
                <div className="h-2.5 w-24 rounded bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {patientId && isError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm text-red-600">Impossible de charger les rendez-vous.</p>
        </div>
      )}

      {patientId && !isLoading && !isError && rdvs && (
        <RdvTimeline
          rdvs={rdvs}
          isReprogramming={isReprogramming}
          onReprogrammer={handleReprogrammer}
        />
      )}
    </div>
  )
}
