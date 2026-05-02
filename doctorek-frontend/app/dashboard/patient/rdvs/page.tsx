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
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Mes Rendez-vous</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Consultez et gérez vos rendez-vous médicaux
        </p>
      </div>

      {!patientId && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <p className="text-sm text-zinc-400">Chargement de vos rendez-vous…</p>
        </div>
      )}

      {patientId && isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      )}

      {patientId && isError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Impossible de charger les rendez-vous. Vérifiez l&apos;identifiant.
        </p>
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
