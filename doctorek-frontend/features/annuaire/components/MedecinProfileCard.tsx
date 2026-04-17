import Link from 'next/link'
import type { MedecinProfile } from '@/lib/types'
import { MedecinAvatar } from './MedecinAvatar'

interface MedecinProfileCardProps {
  medecin: MedecinProfile
}

const SECTEUR_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Secteur 1 — Honoraires conventionnés',
  2: 'Secteur 2 — Honoraires libres',
  3: 'Secteur 3 — Non conventionné',
}

export function MedecinProfileCard({ medecin }: MedecinProfileCardProps) {
  const accepte = medecin.acceptNouveauxPatients !== false

  return (
    <div className="max-w-2xl mx-auto rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-5 px-6 py-6 border-b border-zinc-100">
        <MedecinAvatar firstName={medecin.firstName} lastName={medecin.lastName} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-0.5">Médecin</p>
          <h1 className="text-xl font-semibold text-zinc-900 truncate">
            Dr. {medecin.firstName} {medecin.lastName}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">{medecin.specialite}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-2 h-2 rounded-full ${accepte ? 'bg-emerald-500' : 'bg-red-400'}`} />
            <span className={`text-xs font-medium ${accepte ? 'text-emerald-700' : 'text-red-600'}`}>
              {accepte ? 'Accepte les nouveaux patients' : 'N\'accepte pas les nouveaux patients'}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 grid gap-4">
        <InfoRow icon="📍" label="Adresse" value={`${medecin.adresse}, ${medecin.ville}`} />

        {medecin.secteurTarifaire && (
          <InfoRow icon="💳" label="Tarif" value={SECTEUR_LABELS[medecin.secteurTarifaire]} />
        )}

        {medecin.langues && medecin.langues.length > 0 && (
          <InfoRow icon="🌐" label="Langues" value={medecin.langues.join(', ')} />
        )}

        <InfoRow icon="🪪" label="INPE" value={medecin.inpe} />

        {medecin.presentation && (
          <div className="flex flex-col gap-0.5 pt-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Présentation</span>
            <p className="text-sm text-zinc-700 leading-relaxed">{medecin.presentation}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <Link
          href={`/medecins/${medecin.id}/rdv`}
          className="block w-full text-center rounded-xl bg-zinc-900 text-white font-medium py-3 text-sm hover:bg-zinc-800 transition-colors"
        >
          Prendre rendez-vous →
        </Link>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base mt-0.5">{icon}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</span>
        <span className="text-sm text-zinc-800">{value}</span>
      </div>
    </div>
  )
}
