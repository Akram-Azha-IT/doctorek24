'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { useRdvsPatient, useAnnulerRdv } from '@/features/agenda/hooks'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import type { StatutRdv } from '@/lib/types'

const CANCELLABLE: StatutRdv[] = ['EN_ATTENTE', 'CONFIRME']

const STATUT_LABELS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirme',
  ANNULE: 'Annule',
  TERMINE: 'Termine',
}

const STATUT_COLORS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRME: 'bg-emerald-100 text-emerald-700',
  ANNULE: 'bg-red-100 text-red-600',
  TERMINE: 'bg-zinc-100 text-zinc-500',
}

export default function PatientRdvsPage() {
  const [patientId, setPatientId] = useState('')
  const [inputId, setInputId] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'PATIENT' && session.id) {
      setInputId(session.id)
      setPatientId(session.id)
    }
  }, [])

  const { data: rdvs, isLoading, isError } = useRdvsPatient(patientId)
  const { mutate: annuler, isPending: isAnnuling } = useAnnulerRdv(patientId)

  function handleLoad() {
    const trimmed = inputId.trim()
    if (!trimmed) return
    setPatientId(trimmed)
  }

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
            Consultez et gerez vos rendez-vous medicaux
          </p>
        </div>

        {/* ID input */}
        <div className="mb-8 flex gap-2">
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            placeholder="Votre identifiant patient (UUID)"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <button
            onClick={handleLoad}
            disabled={!inputId.trim()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
          >
            Charger
          </button>
        </div>

        {!patientId && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
            <p className="text-sm text-zinc-400">
              Entrez votre identifiant patient pour voir vos rendez-vous
            </p>
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
            Impossible de charger les rendez-vous. Verifiez l&apos;identifiant.
          </p>
        )}

        {patientId && !isLoading && !isError && rdvs && (
          <>
            {rdvs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
                <p className="text-sm text-zinc-400">Aucun rendez-vous trouve</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rdvs.map((rdv) => (
                  <div
                    key={rdv.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-zinc-900">{rdv.dateRdv}</p>
                        <p className="text-sm text-zinc-500">{rdv.heureRdv}</p>
                      </div>
                      <div className="h-10 w-px bg-zinc-200" />
                      <div>
                        <p className="text-sm font-medium text-zinc-700">
                          {rdv.motif ?? 'Consultation'}
                        </p>
                        <p className="text-xs text-zinc-400">{rdv.duree} min</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${STATUT_COLORS[rdv.statut]}`}
                      >
                        {STATUT_LABELS[rdv.statut]}
                      </span>

                      {CANCELLABLE.includes(rdv.statut) && confirmingId !== rdv.id && (
                        <button
                          onClick={() => setConfirmingId(rdv.id)}
                          disabled={isAnnuling}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                        >
                          Annuler
                        </button>
                      )}

                      {confirmingId === rdv.id && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">Confirmer ?</span>
                          <button
                            onClick={() => handleAnnuler(rdv.id)}
                            disabled={isAnnuling}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          >
                            {isAnnuling ? '…' : 'Oui'}
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            disabled={isAnnuling}
                            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                          >
                            Non
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
