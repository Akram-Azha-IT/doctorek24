'use client'

import { Header } from '@/components/Header'
import { useRdvsPatient, useReprogrammerRdv, useAnnulerRdv } from '@/features/agenda/hooks'
import { RdvTimeline } from '@/features/agenda/components/RdvTimeline'
import { useSession } from '@/lib/useSession'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { toast } from 'sonner'

export default function PatientRdvsPage() {
  useRoleGuard('PATIENT')
  const session = useSession()
  const patientId = session?.role === 'PATIENT' && session.id ? session.id : ''

  const { data: rdvs, isLoading, isError } = useRdvsPatient(patientId)
  const { mutate: reprogrammer, isPending: isReprogramming } = useReprogrammerRdv(patientId)
  const { mutate: annuler, isPending: isCancelling } = useAnnulerRdv(patientId)

  function handleAnnuler(id: string) {
    annuler(id, {
      onSuccess: () => toast.success('Rendez-vous annulé'),
      onError: () => toast.error("Impossible d'annuler ce rendez-vous"),
    })
  }

  function handleReprogrammer(id: string, date: string, heure: string) {
    reprogrammer({ id, date, heure }, {
      onSuccess: () => toast.success('Rendez-vous reprogrammé'),
      onError: () => toast.error('Erreur lors de la reprogrammation'),
    })
  }

  return (
    <>
      <Header />

      <div className="flex-1 bg-[#E8EFF6]">
        {/* Page header strip */}
        <div className="border-b border-zinc-200/70 bg-white">
          <div className="mx-auto w-full max-w-3xl px-4 py-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#007DFF]/10">
                <svg
                  className="h-5 w-5 text-[#007DFF]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-[17px] font-bold leading-tight text-[#333333]">
                  Mes Rendez-vous
                </h1>
                <p className="text-xs text-zinc-400">
                  Consultez et gérez vos rendez-vous médicaux
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="mx-auto w-full max-w-3xl px-4 py-6">
          {(!patientId || isLoading) && (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[84px] animate-pulse rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden flex"
                />
              ))}
            </div>
          )}

          {patientId && isError && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <svg
                  className="h-4 w-4 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <p className="text-sm text-red-600">
                Impossible de charger les rendez-vous.
              </p>
            </div>
          )}

          {patientId && !isLoading && !isError && rdvs && (
            <RdvTimeline
              rdvs={rdvs}
              isReprogramming={isReprogramming}
              onReprogrammer={handleReprogrammer}
              isCancelling={isCancelling}
              onAnnuler={handleAnnuler}
            />
          )}
        </main>
      </div>
    </>
  )
}
