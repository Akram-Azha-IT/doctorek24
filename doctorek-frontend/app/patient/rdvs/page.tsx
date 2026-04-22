'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { useRdvsPatient, useAnnulerRdv } from '@/features/agenda/hooks'
import { RdvTimeline } from '@/features/agenda/components/RdvTimeline'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { toast } from 'sonner'

export default function PatientRdvsPage() {
  useRoleGuard('PATIENT')

  const [patientId, setPatientId] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'PATIENT' && session.id) {
      setPatientId(session.id)
    }
  }, [])

  const { data: rdvs, isLoading, isError } = useRdvsPatient(patientId)
  const { mutate: annuler, isPending: isAnnuling } = useAnnulerRdv(patientId)

  function handleAnnuler(id: string) {
    annuler(id, {
      onSuccess: () => {
        toast.success('Rendez-vous annulé')
        setConfirmingId(null)
      },
      onError: () => toast.error("Erreur lors de l'annulation"),
    })
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
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
            confirmingId={confirmingId}
            isAnnuling={isAnnuling}
            onConfirmStart={setConfirmingId}
            onConfirmCancel={() => setConfirmingId(null)}
            onAnnuler={handleAnnuler}
          />
        )}
      </main>
    </>
  )
}
