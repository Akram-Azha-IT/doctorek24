'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { useRdvsPatient, useAnnulerRdv } from '@/features/agenda/hooks'
import { useMedecin } from '@/features/annuaire/hooks'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { toast } from 'sonner'
import type { RendezVous, StatutRdv } from '@/lib/types'

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

function formatDateFR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

interface RdvCardProps {
  rdv: RendezVous
  confirmingId: string | null
  isAnnuling: boolean
  onConfirmStart: (id: string) => void
  onConfirmCancel: () => void
  onAnnuler: (id: string) => void
}

function RdvCard({
  rdv,
  confirmingId,
  isAnnuling,
  onConfirmStart,
  onConfirmCancel,
  onAnnuler,
}: RdvCardProps) {
  const { data: medecin } = useMedecin(rdv.medecinId)
  const medecinNom = medecin ? `Dr ${medecin.firstName} ${medecin.lastName}` : 'Médecin...'

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4">
      <div className="flex items-start gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{medecinNom}</p>
          {medecin && (
            <p className="text-xs text-zinc-500">{medecin.specialite}</p>
          )}
          <p className="text-sm text-zinc-700 mt-1">
            {formatDateFR(rdv.dateRdv)} à {rdv.heureRdv}
          </p>
          {rdv.motif && (
            <p className="text-xs text-zinc-400 mt-0.5 italic">{rdv.motif}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUT_COLORS[rdv.statut]}`}>
          {STATUT_LABELS[rdv.statut]}
        </span>

        {CANCELLABLE.includes(rdv.statut) && confirmingId !== rdv.id && (
          <button
            onClick={() => onConfirmStart(rdv.id)}
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
              onClick={() => onAnnuler(rdv.id)}
              disabled={isAnnuling}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isAnnuling ? '…' : 'Oui'}
            </button>
            <button
              onClick={onConfirmCancel}
              disabled={isAnnuling}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              Non
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

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
          <>
            {rdvs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
                <p className="text-sm text-zinc-400">Aucun rendez-vous trouvé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rdvs.map((rdv) => (
                  <RdvCard
                    key={rdv.id}
                    rdv={rdv}
                    confirmingId={confirmingId}
                    isAnnuling={isAnnuling}
                    onConfirmStart={setConfirmingId}
                    onConfirmCancel={() => setConfirmingId(null)}
                    onAnnuler={handleAnnuler}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
