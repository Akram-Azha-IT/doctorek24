'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { X, UserPlus, Users } from 'lucide-react'
import type { PatientSummary } from '@/lib/types'
import { useCreerRdvMedecin, useCreneaux, usePatientsMedecin } from '../hooks'

interface CreerRdvModalProps {
  medecinId: string
  onClose: () => void
}

type Mode = 'existant' | 'nouveau'

export function CreerRdvModal({ medecinId, onClose }: CreerRdvModalProps) {
  const [mode, setMode] = useState<Mode>('existant')

  // Patient existant
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null)
  const { data: patientsPage } = usePatientsMedecin(medecinId, search, 'TOUS', 0)

  // Nouveau patient
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')

  // Créneau
  const [dateRdv, setDateRdv] = useState('')
  const [heureRdv, setHeureRdv] = useState('')
  const [motif, setMotif] = useState('')
  const { data: creneaux } = useCreneaux(medecinId, dateRdv)

  const [error, setError] = useState<string | null>(null)
  const creerRdv = useCreerRdvMedecin(medecinId)

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setError(null)

    if (!dateRdv || !heureRdv) {
      setError('Choisissez une date et une heure.')
      return
    }
    if (mode === 'existant' && !selectedPatient) {
      setError('Sélectionnez un patient.')
      return
    }
    if (mode === 'nouveau' && (!nom.trim() || !prenom.trim())) {
      setError('Nom et prénom du patient sont obligatoires.')
      return
    }

    creerRdv.mutate(
      {
        ...(mode === 'existant'
          ? { patientId: selectedPatient!.patientId }
          : {
              nouveauPatient: {
                nom: nom.trim(),
                prenom: prenom.trim(),
                dateNaissance: dateNaissance || undefined,
                email: email.trim() || undefined,
                telephone: telephone.trim() || undefined,
              },
            }),
        dateRdv,
        heureRdv,
        motif: motif.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          toast.success(
            result.emailRattachementEnvoye
              ? 'Rendez-vous créé, email de rattachement envoyé au patient'
              : 'Rendez-vous créé',
          )
          onClose()
        },
        onError: (err) => setError(err.message || 'Erreur lors de la création du rendez-vous.'),
      },
    )
  }

  const patients = patientsPage?.content ?? []
  const creneauxLibres = (creneaux ?? []).filter((c) => c.disponible)

  return (
    <div role="dialog" aria-modal="true" aria-label="Nouveau rendez-vous" className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-black/50" />

      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[540px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="font-bold text-[#333333]">Nouveau rendez-vous</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          {/* Choix patient existant / nouveau */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-50 p-1.5">
            {([
              { key: 'existant', label: 'Patient existant', icon: Users },
              { key: 'nouveau', label: 'Nouveau patient', icon: UserPlus },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setMode(t.key)}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors ${
                  mode === t.key ? 'bg-[#007DFF] text-white shadow-sm' : 'text-[#465058] hover:bg-white'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {mode === 'existant' ? (
            <div className="flex flex-col gap-2">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedPatient(null) }}
                placeholder="Rechercher un patient…"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DFF]"
              />
              {selectedPatient ? (
                <div className="flex items-center justify-between rounded-lg bg-[#DFEFFE] px-3 py-2 text-sm text-[#064178]">
                  <span className="font-semibold">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </span>
                  <button type="button" onClick={() => setSelectedPatient(null)} className="text-xs underline">
                    changer
                  </button>
                </div>
              ) : (
                <ul className="max-h-40 overflow-y-auto rounded-lg border border-zinc-100 divide-y divide-zinc-50">
                  {patients.length === 0 && (
                    <li className="px-3 py-2.5 text-sm text-zinc-400">Aucun patient trouvé</li>
                  )}
                  {patients.map((p) => (
                    <li key={p.patientId}>
                      <button
                        type="button"
                        onClick={() => setSelectedPatient(p)}
                        className="w-full px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                      >
                        {p.firstName} {p.lastName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom *"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DFF]" />
                <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom *"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DFF]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)}
                  aria-label="Date de naissance"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DFF]" />
                <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DFF]" />
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (permet au patient de rattacher ce RDV à son compte famille)"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DFF]" />
              <p className="text-xs text-zinc-400">
                Si un email est renseigné, le patient recevra un lien sécurisé pour retrouver
                ce rendez-vous dans son compte Doctorek.
              </p>
            </div>
          )}

          {/* Date + heure */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rdv-date" className="text-sm font-medium text-zinc-700">Date *</label>
              <input id="rdv-date" type="date" value={dateRdv}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => { setDateRdv(e.target.value); setHeureRdv('') }}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DFF]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rdv-heure" className="text-sm font-medium text-zinc-700">Heure *</label>
              <input id="rdv-heure" type="time" value={heureRdv} onChange={(e) => setHeureRdv(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DFF]" />
            </div>
          </div>

          {/* Créneaux libres du jour (suggestion) */}
          {dateRdv && creneauxLibres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {creneauxLibres.slice(0, 12).map((c) => (
                <button
                  key={c.debut}
                  type="button"
                  onClick={() => setHeureRdv(c.debut.slice(0, 5))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    heureRdv === c.debut.slice(0, 5)
                      ? 'border-[#007DFF] bg-[#007DFF] text-white'
                      : 'border-zinc-300 text-zinc-600 hover:border-[#007DFF] hover:text-[#007DFF]'
                  }`}
                >
                  {c.debut.slice(0, 5)}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="rdv-motif" className="text-sm font-medium text-zinc-700">Motif</label>
            <input id="rdv-motif" value={motif} onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex. Consultation de suivi"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DFF]" />
          </div>

          {error && <p className="text-sm text-[#E01E5A]">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900">
              Annuler
            </button>
            <button type="submit" disabled={creerRdv.isPending}
              className="flex-1 rounded-lg bg-[#007DFF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00263C] disabled:opacity-60">
              {creerRdv.isPending ? 'Création…' : 'Créer le rendez-vous'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
