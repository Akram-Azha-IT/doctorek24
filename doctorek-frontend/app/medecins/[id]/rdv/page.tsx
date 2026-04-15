'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { useMedecin } from '@/features/annuaire/hooks'
import { useCreneaux } from '@/features/agenda/hooks'
import { CreneauxGrid } from '@/features/agenda/components/CreneauxGrid'
import { ConfirmRdvForm } from '@/features/agenda/components/ConfirmRdvForm'
import { RdvSuccessCard } from '@/features/agenda/components/RdvSuccessCard'
import { Badge } from '@/components/ui/badge'
import type { Creneau, RendezVous } from '@/lib/types'

function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function RdvPage() {
  const { id } = useParams<{ id: string }>()
  const [date, setDate] = useState<string>(tomorrowISO())
  const [selected, setSelected] = useState<Creneau | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmedRdv, setConfirmedRdv] = useState<RendezVous | null>(null)

  const { data: medecin, isLoading: loadingMedecin } = useMedecin(id)
  const { data: creneaux, isLoading: loadingCreneaux, isError } = useCreneaux(id, date)

  function handleSelectCreneau(c: Creneau) {
    setSelected(c)
    setShowForm(false)
    setConfirmedRdv(null)
  }

  function handleDateChange(newDate: string) {
    setDate(newDate)
    setSelected(null)
    setShowForm(false)
    setConfirmedRdv(null)
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        {/* Retour */}
        <Link
          href={`/medecins/${id}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-8 transition-colors"
        >
          ← Retour au profil
        </Link>

        {/* En-tête médecin */}
        {loadingMedecin ? (
          <div className="h-8 w-48 bg-zinc-100 animate-pulse rounded mb-6" />
        ) : medecin ? (
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-1">Prendre rendez-vous avec</p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">
                Dr. {medecin.firstName} {medecin.lastName}
              </h1>
              <Badge>{medecin.specialite}</Badge>
            </div>
            <p className="text-sm text-zinc-500 mt-1">{medecin.ville}</p>
          </div>
        ) : null}

        {/* Sélection de date */}
        <section className="mb-8">
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Choisir une date
          </label>
          <input
            type="date"
            value={date}
            min={tomorrowISO()}
            onChange={(e) => handleDateChange(e.target.value)}
            className="border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </section>

        {/* Créneaux disponibles */}
        <section>
          <h2 className="text-base font-semibold text-zinc-900 mb-4">
            Créneaux disponibles — {formatDate(date)}
          </h2>

          {loadingCreneaux && (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-9 bg-zinc-100 animate-pulse rounded-md" />
              ))}
            </div>
          )}

          {isError && (
            <p className="text-sm text-red-500 py-4">
              Impossible de charger les créneaux. Vérifiez que le médecin a configuré son agenda.
            </p>
          )}

          {!loadingCreneaux && !isError && creneaux && (
            <CreneauxGrid
              creneaux={creneaux}
              selected={selected?.debut ?? null}
              onSelect={handleSelectCreneau}
            />
          )}
        </section>

        {/* Bouton → formulaire de confirmation */}
        {selected && !showForm && !confirmedRdv && (
          <div className="mt-8 p-4 border border-zinc-200 rounded-xl bg-zinc-50">
            <p className="text-sm text-zinc-600 mb-1">Créneau sélectionné</p>
            <p className="font-semibold text-zinc-900">
              {formatDate(date)} à {selected.debut}
            </p>
            <p className="text-sm text-zinc-500 mt-0.5">
              Durée estimée : jusqu&apos;à {selected.fin}
            </p>
            <button
              className="mt-4 w-full sm:w-auto bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
              onClick={() => setShowForm(true)}
            >
              Confirmer ce créneau
            </button>
          </div>
        )}

        {/* Formulaire de confirmation US-F06 */}
        {selected && showForm && !confirmedRdv && medecin && (
          <ConfirmRdvForm
            medecinId={id}
            medecinName={`Dr. ${medecin.firstName} ${medecin.lastName}`}
            dateRdv={date}
            heureRdv={selected.debut}
            heureFin={selected.fin}
            onSuccess={(rdv) => {
              setConfirmedRdv(rdv)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Carte de succès */}
        {confirmedRdv && medecin && (
          <RdvSuccessCard
            rdv={confirmedRdv}
            medecinName={`Dr. ${medecin.firstName} ${medecin.lastName}`}
          />
        )}
      </main>
    </>
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