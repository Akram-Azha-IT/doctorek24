import Link from 'next/link'
import { CheckCircle2, Mail } from 'lucide-react'
import type { RendezVous } from '@/lib/types'

interface RdvSuccessCardProps {
  rdv: RendezVous
  medecinName: string
}

export function RdvSuccessCard({ rdv, medecinName }: RdvSuccessCardProps) {
  return (
    <div className="mt-8 border border-green-200 bg-green-50 rounded-xl p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold text-green-900">Rendez-vous confirmé !</p>
          <p className="text-sm text-green-800 mt-1">
            {medecinName} · {formatDate(rdv.dateRdv)} à {rdv.heureRdv}
          </p>
          {rdv.motif && (
            <p className="text-sm text-green-700 mt-1 italic">
              Motif : {rdv.motif}
            </p>
          )}
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-green-700 bg-white/60 border border-green-200 rounded-full px-2.5 py-1">
            <Mail className="h-3.5 w-3.5" aria-hidden />
            Un email de confirmation vous a été envoyé.
          </p>
          <p className="text-xs text-green-600 mt-2">Référence : {rdv.id}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <Link
          href="/patient/rdvs"
          className="text-sm font-medium text-green-800 hover:text-green-950 underline underline-offset-2 transition-colors"
        >
          Voir mes rendez-vous →
        </Link>
        <Link
          href="/recherche"
          className="text-sm text-green-700 hover:text-green-900 transition-colors"
        >
          Retour à la recherche
        </Link>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso + 'T00:00:00'))
}