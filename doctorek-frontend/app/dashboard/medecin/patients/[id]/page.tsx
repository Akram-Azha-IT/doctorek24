'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useRdvsMedecin } from '@/features/agenda/hooks'
import { getSession } from '@/lib/session'
import { useMounted } from '@/lib/useMounted'
import { useRoleGuard } from '@/lib/useRoleGuard'
import type { RendezVous, StatutRdv, CarteVirtuelleRequest, AntecedentChirurgical, MedicamentActuel } from '@/lib/types'
import { useCarteByPatient, useUpdateCarte, useCreateCarte } from '@/features/carte/hooks'
import {
  useInfosMedicales,
  useUpsertInfosMedicales,
  useOrdonnances,
  useCreateOrdonnance,
  useDeleteOrdonnance,
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
} from '@/features/dossier/hooks'
import { getDocumentDownloadUrl, openProtectedFile } from '@/features/dossier/api'
import { DocumentsRequisSection } from '@/features/agenda/components/DocumentsRequisSection'
import type { MedicamentDto } from '@/features/dossier/api'
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Pill,
  Paperclip,
  Plus,
  Trash2,
  X,
  Upload,
  Stethoscope,
  AlertTriangle,
  Heart,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Download,
  FileImage,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = 'infos' | 'ordonnances' | 'documents' | 'historique'

interface DrugForm {
  id: string
  nom: string
  dosage: string
  frequence: string
  duree: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function hslFromName(first: string, last: string) {
  const str = `${first}${last}`
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const h = ((hash % 360) + 360) % 360
  return `hsl(${h}, 55%, 48%)`
}

function formatDateShortFR(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-'
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} Ko`
    : `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function uid() {
  return Math.random().toString(36).slice(2)
}

const GROUPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', 'Inconnu']

const STATUT_STYLES: Record<StatutRdv, string> = {
  EN_ATTENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRME: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ANNULE: 'bg-red-50 text-red-600 border-red-200',
  TERMINE: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}
const STATUT_LABEL: Record<StatutRdv, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
}

// ── Card wrapper ───────────────────────────────────────────────────────────

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[#EEF1F6] bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#F0F2F5] px-5 py-3.5">
        {icon}
        <p className="text-sm font-bold text-[#010C2D]">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

// ── Tab button ─────────────────────────────────────────────────────────────

function TabBtn({
  id,
  active,
  label,
  icon,
  count,
  onClick,
}: {
  id: TabId
  active: boolean
  label: string
  icon: React.ReactNode
  count?: number
  onClick: (id: TabId) => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onClick(id)}
      className={`flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition-colors focus-visible:outline-none ${
        active
          ? 'border-[#007DFF] text-[#007DFF]'
          : 'border-transparent text-[#6B7A99] hover:text-[#010C2D]'
      }`}
    >
      {icon}
      {label}
      {count != null && count > 0 && (
        <span
          className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
            active ? 'bg-[#DFEFFE] text-[#007DFF]' : 'bg-[#F1F4F7] text-[#6B7A99]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

// ── Informations médicales ─────────────────────────────────────────────────

function InfosTab({ patientId }: { patientId: string }) {
  const { data, isLoading } = useInfosMedicales(patientId)
  const { data: carte } = useCarteByPatient(patientId)
  const upsert = useUpsertInfosMedicales(patientId)
  const updateCarteM = useUpdateCarte(patientId)
  const createCarteM = useCreateCarte()

  const [newAllergie, setNewAllergie] = useState('')
  const [newMaladie, setNewMaladie] = useState('')
  const [newVaccin, setNewVaccin] = useState('')
  const [newAntecedent, setNewAntecedent] = useState<AntecedentChirurgical>({ description: '', date: '' })
  const [newMedicament, setNewMedicament] = useState({ nom: '', dosage: '' })

  const notesGenerales = data?.notesGenerales ?? ''

  function saveCarteField(patch: Partial<CarteVirtuelleRequest>) {
    const base: CarteVirtuelleRequest = {
      tailleCm: carte?.tailleCm,
      poidsKg: carte?.poidsKg,
      donneurOrganes: carte?.donneurOrganes,
      antecedentsFamiliaux: carte?.antecedentsFamiliaux ?? [],
      contactsUrgence: carte?.contactsUrgence ?? [],
      medecinTraitant: carte?.medecinTraitant,
      assuranceNom: carte?.assuranceNom,
      assuranceNumero: carte?.assuranceNumero,
      assuranceDetails: carte?.assuranceDetails,
      groupeSanguin: carte?.groupeSanguin,
      allergies: carte?.allergies ?? [],
      maladiesChroniques: carte?.maladiesChroniques ?? [],
      medicamentsActuels: carte?.medicamentsActuels ?? [],
      antecedentsChirurgicaux: carte?.antecedentsChirurgicaux ?? [],
      vaccinations: carte?.vaccinations ?? [],
      ...patch,
    }
    if (carte) {
      updateCarteM.mutate(base)
    } else {
      createCarteM.mutate(base)
    }
  }

  function saveNotes(notes: string) {
    upsert.mutate({
      groupeSanguin: null,
      allergies: [],
      antecedents: null,
      traitementsCours: null,
      notesGenerales: notes,
    })
  }

  function addAllergie() {
    const val = newAllergie.trim()
    if (!val || (carte?.allergies ?? []).includes(val)) return
    saveCarteField({ allergies: [...(carte?.allergies ?? []), val] })
    setNewAllergie('')
  }

  function removeAllergie(a: string) {
    saveCarteField({ allergies: (carte?.allergies ?? []).filter((x) => x !== a) })
  }

  function addMaladie() {
    const val = newMaladie.trim()
    if (!val) return
    saveCarteField({ maladiesChroniques: [...(carte?.maladiesChroniques ?? []), val] })
    setNewMaladie('')
  }

  function removeMaladie(m: string) {
    saveCarteField({ maladiesChroniques: (carte?.maladiesChroniques ?? []).filter((x) => x !== m) })
  }

  function addMedicament() {
    const nom = newMedicament.nom.trim()
    if (!nom) return
    saveCarteField({
      medicamentsActuels: [
        ...(carte?.medicamentsActuels ?? []),
        { nom, dosage: newMedicament.dosage?.trim() ?? '' },
      ],
    })
    setNewMedicament({ nom: '', dosage: '' })
  }

  function removeMedicament(idx: number) {
    saveCarteField({
      medicamentsActuels: (carte?.medicamentsActuels ?? []).filter((_, i) => i !== idx),
    })
  }

  function addAntecedentChir() {
    const desc = newAntecedent.description.trim()
    if (!desc) return
    saveCarteField({
      antecedentsChirurgicaux: [
        ...(carte?.antecedentsChirurgicaux ?? []),
        { description: desc, date: newAntecedent.date || undefined },
      ],
    })
    setNewAntecedent({ description: '', date: '' })
  }

  function removeAntecedentChir(idx: number) {
    saveCarteField({
      antecedentsChirurgicaux: (carte?.antecedentsChirurgicaux ?? []).filter((_, i) => i !== idx),
    })
  }

  function addVaccin() {
    const val = newVaccin.trim()
    if (!val) return
    saveCarteField({ vaccinations: [...(carte?.vaccinations ?? []), val] })
    setNewVaccin('')
  }

  function removeVaccin(v: string) {
    saveCarteField({ vaccinations: (carte?.vaccinations ?? []).filter((x) => x !== v) })
  }

  if (isLoading)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100" />
        ))}
      </div>
    )

  return (
    <div className="space-y-5">
      {/* Groupe sanguin */}
      <Card icon={<Heart className="h-4 w-4 text-red-500" />} title="Groupe sanguin">
        <div className="flex flex-wrap gap-2">
          {GROUPES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => saveCarteField({ groupeSanguin: g })}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                carte?.groupeSanguin === g
                  ? 'border-[#007DFF] bg-[#007DFF] text-white'
                  : 'border-zinc-200 text-zinc-600 hover:border-[#007DFF] hover:text-[#007DFF]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </Card>

      {/* Allergies */}
      <Card icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} title="Allergies">
        <div className="flex flex-wrap gap-2 mb-3">
          {(carte?.allergies ?? []).length === 0 && (
            <p className="text-sm text-zinc-400">Aucune allergie enregistrée</p>
          )}
          {(carte?.allergies ?? []).map((a) => (
            <span
              key={a}
              className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-sm font-medium text-amber-700"
            >
              {a}
              <button type="button" onClick={() => removeAllergie(a)} className="hover:text-amber-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newAllergie}
            onChange={(e) => setNewAllergie(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAllergie()}
            placeholder="Ajouter une allergie…"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
          />
          <button
            type="button"
            onClick={addAllergie}
            className="rounded-lg bg-[#007DFF] px-3 py-2 text-white hover:bg-[#00263C] transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </Card>

      {/* Maladies chroniques */}
      <Card icon={<ClipboardList className="h-4 w-4 text-[#007DFF]" />} title="Maladies chroniques">
        <div className="flex flex-wrap gap-2 mb-3">
          {(carte?.maladiesChroniques ?? []).length === 0 && (
            <p className="text-sm text-zinc-400">Aucune maladie chronique enregistrée</p>
          )}
          {(carte?.maladiesChroniques ?? []).map((m) => (
            <span
              key={m}
              className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm font-medium text-blue-700"
            >
              {m}
              <button type="button" onClick={() => removeMaladie(m)} className="hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMaladie}
            onChange={(e) => setNewMaladie(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMaladie()}
            placeholder="Ajouter une maladie chronique…"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
          />
          <button
            type="button"
            onClick={addMaladie}
            className="rounded-lg bg-[#007DFF] px-3 py-2 text-white hover:bg-[#00263C] transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </Card>

      {/* Médicaments actuels */}
      <Card icon={<Pill className="h-4 w-4 text-[#007DFF]" />} title="Médicaments actuels">
        <ul className="space-y-1.5 mb-3">
          {(carte?.medicamentsActuels ?? []).length === 0 && (
            <li className="text-sm text-zinc-400">Aucun médicament enregistré</li>
          )}
          {(carte?.medicamentsActuels ?? []).map((med, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2">
              <span className="flex-1 text-sm font-medium text-zinc-800">
                {med.nom}
                {med.dosage.length > 0 && <span className="ml-2 text-xs text-zinc-400 font-normal">{med.dosage}</span>}
              </span>
              <button
                type="button"
                onClick={() => removeMedicament(i)}
                className="text-zinc-300 hover:text-red-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMedicament.nom}
            onChange={(e) => setNewMedicament((p) => ({ ...p, nom: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addMedicament()}
            placeholder="Nom du médicament…"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
          />
          <input
            type="text"
            value={newMedicament.dosage}
            onChange={(e) => setNewMedicament((p) => ({ ...p, dosage: e.target.value }))}
            placeholder="Dosage (optionnel)"
            className="w-36 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
          />
          <button
            type="button"
            onClick={addMedicament}
            className="rounded-lg bg-[#007DFF] px-3 py-2 text-white hover:bg-[#00263C] transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </Card>

      {/* Antécédents chirurgicaux */}
      <Card icon={<Stethoscope className="h-4 w-4 text-zinc-500" />} title="Antécédents chirurgicaux">
        <ul className="space-y-1 mb-3">
          {(carte?.antecedentsChirurgicaux ?? []).length === 0 && (
            <li className="text-sm text-zinc-400">Aucun antécédent chirurgical</li>
          )}
          {(carte?.antecedentsChirurgicaux ?? []).map((a, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
              <span className="flex-1">
                {a.description}
                {a.date && <span className="text-zinc-400 ml-1">({a.date})</span>}
              </span>
              <button
                type="button"
                onClick={() => removeAntecedentChir(i)}
                className="text-zinc-300 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={newAntecedent.description}
            onChange={(e) => setNewAntecedent((p) => ({ ...p, description: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addAntecedentChir()}
            placeholder="Description (ex: Appendicectomie)…"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
          />
          <input
            type="text"
            value={newAntecedent.date ?? ''}
            onChange={(e) => setNewAntecedent((p) => ({ ...p, date: e.target.value }))}
            placeholder="Date (optionnel)"
            className="w-36 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
          />
          <button
            type="button"
            onClick={addAntecedentChir}
            className="rounded-lg bg-[#007DFF] px-3 py-2 text-white hover:bg-[#00263C] transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </Card>

      {/* Vaccinations */}
      <Card icon={<Heart className="h-4 w-4 text-emerald-500" />} title="Vaccinations">
        <div className="flex flex-wrap gap-2 mb-3">
          {(carte?.vaccinations ?? []).length === 0 && (
            <p className="text-sm text-zinc-400">Aucune vaccination enregistrée</p>
          )}
          {(carte?.vaccinations ?? []).map((v) => (
            <span
              key={v}
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-medium text-emerald-700"
            >
              {v}
              <button type="button" onClick={() => removeVaccin(v)} className="hover:text-emerald-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newVaccin}
            onChange={(e) => setNewVaccin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addVaccin()}
            placeholder="Ajouter un vaccin…"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
          />
          <button
            type="button"
            onClick={addVaccin}
            className="rounded-lg bg-[#007DFF] px-3 py-2 text-white hover:bg-[#00263C] transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </Card>

      {/* Notes médecin — dossier only */}
      <Card icon={<FileText className="h-4 w-4 text-zinc-400" />} title="Notes du médecin">
        <textarea
          rows={4}
          defaultValue={notesGenerales}
          onBlur={(e) => saveNotes(e.target.value)}
          placeholder="Observations, remarques importantes du médecin…"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30 resize-none"
        />
      </Card>
    </div>
  )
}

// ── Ordonnances ────────────────────────────────────────────────────────────

function OrdonnancesTab({
  patientId,
  medecinId,
}: {
  patientId: string
  medecinId: string
}) {
  const { data: ordonnances = [], isLoading } = useOrdonnances(patientId)
  const create = useCreateOrdonnance(patientId)
  const remove = useDeleteOrdonnance(patientId)

  const [showForm, setShowForm] = useState(false)
  const [notes, setNotes] = useState('')
  const [drugs, setDrugs] = useState<DrugForm[]>([
    { id: uid(), nom: '', dosage: '', frequence: '', duree: '' },
  ])
  const [openId, setOpenId] = useState<string | null>(null)

  function submitOrdonnance() {
    const meds = drugs.filter((d) => d.nom.trim())
    if (!meds.length) return
    const payload: MedicamentDto[] = meds.map(({ nom, dosage, frequence, duree }) => ({
      nom,
      dosage,
      frequence,
      duree,
    }))
    create.mutate(
      { medecinId, medicaments: payload, notes: notes.trim() || null },
      {
        onSuccess: () => {
          setShowForm(false)
          setNotes('')
          setDrugs([{ id: uid(), nom: '', dosage: '', frequence: '', duree: '' }])
        },
      },
    )
  }

  function updateDrug(idx: number, patch: Partial<DrugForm>) {
    setDrugs((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  }

  function addDrug() {
    setDrugs((prev) => [
      ...prev,
      { id: uid(), nom: '', dosage: '', frequence: '', duree: '' },
    ])
  }

  function removeDrug(idx: number) {
    if (drugs.length === 1) return
    setDrugs((prev) => prev.filter((_, i) => i !== idx))
  }

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
        ))}
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {ordonnances.length} ordonnance{ordonnances.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-[#007DFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00263C] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle ordonnance
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-[#007DFF]/30 bg-[#EBF4FF] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#007DFF]">Nouvelle ordonnance</p>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-zinc-400 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">
              Notes / motif de consultation
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Renouvellement traitement HTA"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-600">Médicaments prescrits</p>
            {drugs.map((drug, idx) => (
              <div
                key={drug.id}
                className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-500">Médicament {idx + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeDrug(idx)}
                    className="text-zinc-300 hover:text-red-500 transition-colors"
                    disabled={drugs.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={drug.nom}
                    onChange={(e) => updateDrug(idx, { nom: e.target.value })}
                    placeholder="Nom du médicament"
                    className="col-span-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
                  />
                  <input
                    type="text"
                    value={drug.dosage}
                    onChange={(e) => updateDrug(idx, { dosage: e.target.value })}
                    placeholder="Dosage (ex: 500mg)"
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
                  />
                  <input
                    type="text"
                    value={drug.duree}
                    onChange={(e) => updateDrug(idx, { duree: e.target.value })}
                    placeholder="Durée (ex: 30 jours)"
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
                  />
                  <input
                    type="text"
                    value={drug.frequence}
                    onChange={(e) => updateDrug(idx, { frequence: e.target.value })}
                    placeholder="Fréquence (ex: 1 cp matin)"
                    className="col-span-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addDrug}
              className="flex items-center gap-1.5 text-sm text-[#007DFF] font-medium hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un médicament
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={submitOrdonnance}
              disabled={create.isPending}
              className="flex-1 rounded-xl bg-[#007DFF] py-2.5 text-sm font-bold text-white hover:bg-[#00263C] transition-colors disabled:opacity-60"
            >
              {create.isPending ? 'Enregistrement…' : "Enregistrer l'ordonnance"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {ordonnances.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-14 text-center">
          <Pill className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
          <p className="text-sm text-zinc-400">Aucune ordonnance enregistrée</p>
        </div>
      )}

      {ordonnances.map((ord) => {
        const isOpen = openId === ord.id
        return (
          <div
            key={ord.id}
            className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
          >
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EBF4FF] text-[#007DFF]">
                <Pill className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">
                  {ord.notes ?? 'Ordonnance'}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatDateShortFR(ord.dateEmission)} ·{' '}
                  {ord.medicaments.length} médicament
                  {ord.medicaments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : ord.id)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 flex items-center gap-1"
                >
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  Détails
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(ord.id)}
                  className="text-zinc-300 hover:text-red-500 transition-colors p-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-4 space-y-3">
                {ord.medicaments.map((drug, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg bg-white border border-zinc-100 px-4 py-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EBF4FF] text-xs font-bold text-[#007DFF]">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800">{drug.nom}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        {drug.dosage && (
                          <span className="text-xs text-zinc-500">Dosage : {drug.dosage}</span>
                        )}
                        {drug.duree && (
                          <span className="text-xs text-zinc-500">Durée : {drug.duree}</span>
                        )}
                        {drug.frequence && (
                          <span className="text-xs text-zinc-500">
                            Fréquence : {drug.frequence}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Documents ──────────────────────────────────────────────────────────────

function DocumentsTab({ patientId }: { patientId: string }) {
  const { data: documents = [], isLoading } = useDocuments(patientId)
  const upload = useUploadDocument(patientId)
  const remove = useDeleteDocument(patientId)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      const typeDoc =
        file.type.startsWith('image/') ? 'IMAGE'
        : ext === 'pdf' ? 'PDF'
        : 'AUTRE'
      upload.mutate({ typeDoc, file })
    })
  }

  function FileIcon({ typeDoc }: { typeDoc: string }) {
    const Icon = typeDoc === 'IMAGE' ? FileImage : typeDoc === 'PDF' ? FileText : Paperclip
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EBF4FF]">
        <Icon className="h-4 w-4 text-[#007DFF]" />
      </span>
    )
  }

  if (isLoading)
    return <div className="h-32 animate-pulse rounded-xl bg-zinc-100" />

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center cursor-pointer hover:border-[#007DFF] hover:bg-[#EBF4FF]/50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
      >
        {upload.isPending ? (
          <p className="text-sm font-medium text-[#007DFF]">Téléversement en cours…</p>
        ) : (
          <>
            <Upload className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
            <p className="text-sm font-medium text-zinc-500">
              Glissez des fichiers ici ou{' '}
              <span className="text-[#007DFF] font-semibold">parcourir</span>
            </p>
            <p className="mt-1 text-xs text-zinc-400">PDF, images, comptes-rendus…</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center">
          <Paperclip className="mx-auto h-7 w-7 text-zinc-300 mb-2" />
          <p className="text-sm text-zinc-400">Aucun document</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white overflow-hidden">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <FileIcon typeDoc={doc.typeDoc} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">{doc.nom}</p>
                <p className="text-xs text-zinc-400">
                  {formatDateShortFR(doc.createdAt.slice(0, 10))} ·{' '}
                  {formatFileSize(doc.taille)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openProtectedFile(getDocumentDownloadUrl(patientId, doc.id)).catch(() => {})}
                className="text-zinc-400 hover:text-[#007DFF] transition-colors p-1"
                title="Télécharger"
              >
                <Download className="h-4 w-4" />
              </button>
              {confirmId === doc.id ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-zinc-500">Supprimer ?</span>
                  <button
                    type="button"
                    onClick={() => { remove.mutate(doc.id); setConfirmId(null) }}
                    disabled={remove.isPending}
                    className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="rounded-md border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(doc.id)}
                  className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                  title="Supprimer le document"
                  aria-label={`Supprimer ${doc.nom}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Historique (read-only) ─────────────────────────────────────────────────

function HistoriqueTab({ rdvs }: { rdvs: RendezVous[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const canPrepare = (statut: StatutRdv) => statut === 'EN_ATTENTE' || statut === 'CONFIRME'

  if (rdvs.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-14 text-center">
        <Calendar className="mx-auto h-7 w-7 text-zinc-300 mb-2" />
        <p className="text-sm text-zinc-400">Aucun rendez-vous</p>
      </div>
    )

  return (
    <div className="space-y-3">
      {rdvs.map((rdv) => {
        const isOpen = openId === rdv.id
        const hasQ = !!rdv.questionnaire?.message
        const showPrep = canPrepare(rdv.statut)
        return (
          <div
            key={rdv.id}
            className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
          >
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EBF4FF] text-[#007DFF]">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900">
                  {formatDateShortFR(rdv.dateRdv)} à {rdv.heureRdv}
                </p>
                {rdv.motif && (
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{rdv.motif}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUT_STYLES[rdv.statut]}`}
                >
                  {STATUT_LABEL[rdv.statut]}
                </span>
                {(hasQ || showPrep) && (
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : rdv.id)}
                    aria-expanded={isOpen}
                    className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      showPrep
                        ? 'bg-[#EBF4FF] text-[#007DFF] hover:bg-[#DFEFFE]'
                        : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    {showPrep ? 'Préparer le RDV' : 'Détails'}
                    {isOpen ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
            {isOpen && (hasQ || showPrep) && (
              <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-4 space-y-4 text-sm">
                {hasQ && rdv.questionnaire && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Questionnaire
                    </p>
                    <p>
                      <span className="text-zinc-500">Type :</span>{' '}
                      {rdv.questionnaire.typeConsultation === 'URGENCE' ? 'Urgence' : 'Consultation'}
                    </p>
                    <p>
                      <span className="text-zinc-500">Message :</span> {rdv.questionnaire.message}
                    </p>
                  </div>
                )}
                {showPrep && <DocumentsRequisSection rdvId={rdv.id} mode="medecin" />}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DossierPatientPage() {
  useRoleGuard('MEDECIN')
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const patientId = params.id as string
  const prenom = searchParams.get('prenom') ?? ''
  const nom = searchParams.get('nom') ?? ''
  const fullName = [prenom, nom].filter(Boolean).join(' ') || 'Patient'
  const initials = `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase() || 'P'
  const avatarColor = hslFromName(prenom, nom)

  const session = getSession()
  const medecinId = session?.role === 'MEDECIN' ? (session.id ?? '') : ''

  const [tab, setTab] = useState<TabId>('infos')
  const mounted = useMounted()

  const { data: allRdvs, isLoading: rdvsLoading } = useRdvsMedecin(medecinId)
  const { data: ordonnances = [] } = useOrdonnances(patientId)
  const { data: documents = [] } = useDocuments(patientId)

  const rdvs: RendezVous[] = (allRdvs ?? [])
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => {
      const da = new Date(`${a.dateRdv}T${a.heureRdv}`)
      const db = new Date(`${b.dateRdv}T${b.heureRdv}`)
      return db.getTime() - da.getTime()
    })

  const rdvsTermines = rdvs.filter((r) => r.statut === 'TERMINE').length
  const hasAccess = rdvs.length > 0

  if (!mounted || rdvsLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-zinc-100" />
      </main>
    )
  }

  if (!hasAccess) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux patients
        </button>
        <div className="rounded-2xl border border-red-100 bg-red-50 px-8 py-16 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-zinc-900">Accès non autorisé</h2>
          <p className="mx-auto max-w-sm text-sm text-zinc-500">
            Vous n&apos;avez aucun rendez-vous avec ce patient. L&apos;accès au dossier médical est
            réservé aux médecins ayant une relation de soin établie.
          </p>
        </div>
      </main>
    )
  }

  const nextRdv = rdvs.find((r) => r.statut === 'CONFIRME' || r.statut === 'EN_ATTENTE')

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 space-y-5 sm:py-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux patients
      </button>

      {/* Patient header — bandeau clinique */}
      <header className="overflow-hidden rounded-2xl border border-[#E7ECF3] bg-white shadow-sm">
        <div className="border-l-4 border-[#007DFF] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm ring-4 ring-white"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-extrabold tracking-tight text-[#010C2D]">{fullName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F6EE] px-2.5 py-1 text-[11px] font-semibold text-[#0B7A4B]">
                  <Stethoscope className="h-3 w-3" />
                  Relation de soin active
                </span>
                <span className="rounded-full bg-[#F1F4F7] px-2.5 py-1 text-[11px] font-semibold text-[#6B7A99]">
                  ID {patientId.slice(0, 8)}
                </span>
                {nextRdv && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DFEFFE] px-2.5 py-1 text-[11px] font-semibold text-[#1863A9]">
                    <Calendar className="h-3 w-3" />
                    Prochain RDV : {formatDateShortFR(nextRdv.dateRdv)} · {nextRdv.heureRdv}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* KPIs cliniques */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'RDV au total', value: rdvs.length, icon: <Calendar className="h-4 w-4" /> },
              { label: 'Consultations', value: rdvsTermines, icon: <Stethoscope className="h-4 w-4" /> },
              { label: 'Ordonnances', value: ordonnances.length, icon: <Pill className="h-4 w-4" /> },
              { label: 'Documents', value: documents.length, icon: <Paperclip className="h-4 w-4" /> },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-xl border border-[#EEF1F6] bg-[#FAFBFC] px-3.5 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EBF4FF] text-[#007DFF]">
                  {s.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-extrabold tabular-nums leading-none text-[#010C2D]">{s.value}</p>
                  <p className="mt-1 truncate text-[11px] text-[#6B7A99]">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Tabs — scrollables sur mobile, badges de comptage */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" className="flex min-w-max gap-6 border-b border-[#EEF1F6]">
          <TabBtn
            id="infos"
            active={tab === 'infos'}
            label="Informations médicales"
            icon={<User className="h-4 w-4" />}
            onClick={setTab}
          />
          <TabBtn
            id="ordonnances"
            active={tab === 'ordonnances'}
            label="Ordonnances"
            icon={<Pill className="h-4 w-4" />}
            count={ordonnances.length}
            onClick={setTab}
          />
          <TabBtn
            id="documents"
            active={tab === 'documents'}
            label="Documents"
            icon={<Paperclip className="h-4 w-4" />}
            count={documents.length}
            onClick={setTab}
          />
          <TabBtn
            id="historique"
            active={tab === 'historique'}
            label="Historique RDV"
            icon={<Calendar className="h-4 w-4" />}
            count={rdvs.length}
            onClick={setTab}
          />
        </div>
      </div>

      {/* Tab content */}
      {tab === 'infos' && <InfosTab patientId={patientId} />}
      {tab === 'ordonnances' && (
        <OrdonnancesTab patientId={patientId} medecinId={medecinId} />
      )}
      {tab === 'documents' && <DocumentsTab patientId={patientId} />}
      {tab === 'historique' &&
        (rdvsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        ) : (
          <HistoriqueTab rdvs={rdvs} />
        ))}
    </main>
  )
}
