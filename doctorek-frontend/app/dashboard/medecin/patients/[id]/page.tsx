'use client'

import { useState, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useRdvsMedecin } from '@/features/agenda/hooks'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import type { RendezVous, StatutRdv } from '@/lib/types'
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
import { getDocumentDownloadUrl } from '@/features/dossier/api'
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
  if (!bytes) return '—'
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
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-3">
        {icon}
        <p className="text-sm font-semibold text-zinc-700">{title}</p>
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
  onClick,
}: {
  id: TabId
  active: boolean
  label: string
  icon: React.ReactNode
  onClick: (id: TabId) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
        active
          ? 'bg-[#1863A9] text-white shadow-sm'
          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Informations médicales ─────────────────────────────────────────────────

function InfosTab({ patientId }: { patientId: string }) {
  const { data, isLoading } = useInfosMedicales(patientId)
  const upsert = useUpsertInfosMedicales(patientId)
  const [newAllergie, setNewAllergie] = useState('')

  const infos = data ?? {
    patientId,
    groupeSanguin: '',
    allergies: [],
    antecedents: '',
    traitementsCours: '',
    notesGenerales: '',
  }

  function save(patch: Partial<typeof infos>) {
    upsert.mutate({
      groupeSanguin: patch.groupeSanguin ?? infos.groupeSanguin ?? null,
      allergies: patch.allergies ?? infos.allergies,
      antecedents: patch.antecedents ?? infos.antecedents ?? null,
      traitementsCours: patch.traitementsCours ?? infos.traitementsCours ?? null,
      notesGenerales: patch.notesGenerales ?? infos.notesGenerales ?? null,
    })
  }

  function addAllergie() {
    const val = newAllergie.trim()
    if (!val || infos.allergies.includes(val)) return
    save({ allergies: [...infos.allergies, val] })
    setNewAllergie('')
  }

  function removeAllergie(a: string) {
    save({ allergies: infos.allergies.filter((x) => x !== a) })
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
      <Card icon={<Heart className="h-4 w-4 text-red-500" />} title="Groupe sanguin">
        <div className="flex flex-wrap gap-2">
          {GROUPES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => save({ groupeSanguin: g })}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                infos.groupeSanguin === g
                  ? 'border-[#1863A9] bg-[#1863A9] text-white'
                  : 'border-zinc-200 text-zinc-600 hover:border-[#1863A9] hover:text-[#1863A9]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </Card>

      <Card
        icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
        title="Allergies"
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {infos.allergies.length === 0 && (
            <p className="text-sm text-zinc-400">Aucune allergie enregistrée</p>
          )}
          {infos.allergies.map((a) => (
            <span
              key={a}
              className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-sm font-medium text-amber-700"
            >
              {a}
              <button
                type="button"
                onClick={() => removeAllergie(a)}
                className="hover:text-amber-900"
              >
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
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1863A9]/30"
          />
          <button
            type="button"
            onClick={addAllergie}
            className="rounded-lg bg-[#1863A9] px-3 py-2 text-white hover:bg-[#064178] transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </Card>

      <Card
        icon={<ClipboardList className="h-4 w-4 text-[#1863A9]" />}
        title="Antécédents médicaux"
      >
        <textarea
          rows={4}
          defaultValue={infos.antecedents ?? ''}
          onBlur={(e) => save({ antecedents: e.target.value })}
          placeholder="Hypertension, diabète type 2, chirurgies antérieures…"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1863A9]/30 resize-none"
        />
      </Card>

      <Card
        icon={<Pill className="h-4 w-4 text-purple-500" />}
        title="Médicaments en cours"
      >
        <textarea
          rows={3}
          defaultValue={infos.traitementsCours ?? ''}
          onBlur={(e) => save({ traitementsCours: e.target.value })}
          placeholder="Metformine 500mg, Lisinopril 10mg…"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1863A9]/30 resize-none"
        />
      </Card>

      <Card
        icon={<FileText className="h-4 w-4 text-zinc-400" />}
        title="Notes générales"
      >
        <textarea
          rows={4}
          defaultValue={infos.notesGenerales ?? ''}
          onBlur={(e) => save({ notesGenerales: e.target.value })}
          placeholder="Observations, remarques importantes du médecin…"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1863A9]/30 resize-none"
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
          className="flex items-center gap-2 rounded-xl bg-[#1863A9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#064178] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle ordonnance
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-[#1863A9]/30 bg-[#E8F2FC] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#1863A9]">Nouvelle ordonnance</p>
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
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1863A9]/30"
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
                    className="col-span-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1863A9]/30"
                  />
                  <input
                    type="text"
                    value={drug.dosage}
                    onChange={(e) => updateDrug(idx, { dosage: e.target.value })}
                    placeholder="Dosage (ex: 500mg)"
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1863A9]/30"
                  />
                  <input
                    type="text"
                    value={drug.duree}
                    onChange={(e) => updateDrug(idx, { duree: e.target.value })}
                    placeholder="Durée (ex: 30 jours)"
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1863A9]/30"
                  />
                  <input
                    type="text"
                    value={drug.frequence}
                    onChange={(e) => updateDrug(idx, { frequence: e.target.value })}
                    placeholder="Fréquence (ex: 1 cp matin)"
                    className="col-span-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1863A9]/30"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addDrug}
              className="flex items-center gap-1.5 text-sm text-[#1863A9] font-medium hover:underline"
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
              className="flex-1 rounded-xl bg-[#1863A9] py-2.5 text-sm font-bold text-white hover:bg-[#064178] transition-colors disabled:opacity-60"
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
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
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
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

  function fileIcon(typeDoc: string) {
    if (typeDoc === 'IMAGE') return '🖼️'
    if (typeDoc === 'PDF') return '📄'
    return '📎'
  }

  if (isLoading)
    return <div className="h-32 animate-pulse rounded-xl bg-zinc-100" />

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center cursor-pointer hover:border-[#1863A9] hover:bg-[#E8F2FC]/50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
      >
        {upload.isPending ? (
          <p className="text-sm font-medium text-[#1863A9]">Téléversement en cours…</p>
        ) : (
          <>
            <Upload className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
            <p className="text-sm font-medium text-zinc-500">
              Glissez des fichiers ici ou{' '}
              <span className="text-[#1863A9] font-semibold">parcourir</span>
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
              <span className="text-xl" aria-hidden>
                {fileIcon(doc.typeDoc)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">{doc.nom}</p>
                <p className="text-xs text-zinc-400">
                  {formatDateShortFR(doc.createdAt.slice(0, 10))} ·{' '}
                  {formatFileSize(doc.taille)}
                </p>
              </div>
              <a
                href={getDocumentDownloadUrl(patientId, doc.id)}
                download={doc.nom}
                className="text-zinc-400 hover:text-[#1863A9] transition-colors p-1"
                title="Télécharger"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => remove.mutate(doc.id)}
                className="text-zinc-300 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
        const hasQ = !!rdv.questionnaire?.motif
        return (
          <div
            key={rdv.id}
            className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
          >
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F2FC] text-[#1863A9]">
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
                {hasQ && (
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : rdv.id)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 flex items-center gap-1"
                  >
                    <ClipboardList className="h-3 w-3" />
                    {isOpen ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
            {hasQ && isOpen && rdv.questionnaire && (
              <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-4 space-y-2 text-sm">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Questionnaire
                </p>
                <p>
                  <span className="text-zinc-500">Motif :</span> {rdv.questionnaire.motif}
                </p>
                <p>
                  <span className="text-zinc-500">1ère consultation :</span>{' '}
                  {rdv.questionnaire.premierConsultation ? 'Oui' : 'Non'}
                </p>
                {rdv.questionnaire.intensiteDouleur != null && (
                  <p>
                    <span className="text-zinc-500">Douleur :</span>{' '}
                    {rdv.questionnaire.intensiteDouleur}/5
                  </p>
                )}
                {rdv.questionnaire.notesComplementaires && (
                  <p>
                    <span className="text-zinc-500">Notes :</span>{' '}
                    {rdv.questionnaire.notesComplementaires}
                  </p>
                )}
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

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux patients
      </button>

      {/* Patient header */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5">
        <div className="flex items-center gap-5">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-zinc-900">{fullName}</h1>
            <p className="mt-0.5 text-sm text-zinc-400">ID patient : {patientId.slice(0, 8)}…</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#E8F2FC] px-3 py-2">
            <Stethoscope className="h-4 w-4 text-[#1863A9]" />
            <span className="text-sm font-semibold text-[#1863A9]">Dossier médical</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3">
          {[
            { label: 'RDV total', value: rdvs.length },
            { label: 'Consultations', value: rdvsTermines },
            { label: 'Ordonnances', value: ordonnances.length },
            { label: 'Documents', value: documents.length },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-center"
            >
              <p className="text-2xl font-bold text-zinc-800">{s.value}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
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
          onClick={setTab}
        />
        <TabBtn
          id="documents"
          active={tab === 'documents'}
          label="Documents"
          icon={<Paperclip className="h-4 w-4" />}
          onClick={setTab}
        />
        <TabBtn
          id="historique"
          active={tab === 'historique'}
          label="Historique RDV"
          icon={<Calendar className="h-4 w-4" />}
          onClick={setTab}
        />
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
