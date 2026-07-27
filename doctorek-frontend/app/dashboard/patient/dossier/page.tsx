'use client'

import { useState, useRef } from 'react'
import { useSession } from '@/lib/useSession'
import {
  useOrdonnances,
  useDocuments,
  useDeleteOrdonnance,
  useCreateOrdonnance,
  useUploadDocument,
  useDeleteDocument,
} from '@/features/dossier/hooks'
import type { MedicamentDto } from '@/features/dossier/api'
import { useProches } from '@/features/famille/hooks'
import { getDocumentDownloadUrl, uploadOrdonnanceFichier, getOrdonnanceFichierUrl, openProtectedFile } from '@/features/dossier/api'

const TYPE_OPTIONS = [
  'Analyse de sang',
  'Radio / Imagerie',
  'Compte rendu',
  'Certificat médical',
  'Autre',
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${Math.round(bytes / 1024)} Ko`
}

export default function DossierPage() {
  const session = useSession()
  const selfId = session?.id ?? ''
  // Compte famille : dossier affiché = membre sélectionné (soi par défaut)
  const [selectedId, setSelectedId] = useState('')
  const patientId = selectedId || selfId

  const { data: profils } = useProches(!!selfId)
  const hasProches = (profils?.length ?? 0) > 1

  const [tab, setTab] = useState<'ordonnances' | 'documents'>('ordonnances')
  const [uploadType, setUploadType] = useState(TYPE_OPTIONS[0])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [docMode, setDocMode] = useState<'none' | 'photo' | 'fichier'>('none')
  const docPhotoRef = useRef<HTMLInputElement>(null)
  const docFichierRef = useRef<HTMLInputElement>(null)

  function resetDocForm() {
    setDocMode('none'); setUploadType(TYPE_OPTIONS[0]); setUploadFile(null); setUploadError(null)
    ;[fileRef, docPhotoRef, docFichierRef].forEach(r => { if (r.current) r.current.value = '' })
  }
  const [confirmOrdId, setConfirmOrdId] = useState<string | null>(null)
  // 'none' | 'saisir' | 'photo' | 'document'
  const [ordMode, setOrdMode] = useState<'none' | 'saisir' | 'photo' | 'document'>('none')
  const [ordMedecinNom, setOrdMedecinNom] = useState('')
  const [ordDate, setOrdDate] = useState('')
  const [ordNotes, setOrdNotes] = useState('')
  const [ordMeds, setOrdMeds] = useState<MedicamentDto[]>([{ nom: '', dosage: '', frequence: '', duree: '' }])
  const [ordError, setOrdError] = useState<string | null>(null)
  const [ordFile, setOrdFile] = useState<File | null>(null)
  const ordFileRef = useRef<HTMLInputElement>(null)
  const ordPhotoRef = useRef<HTMLInputElement>(null)
  const ordDocRef = useRef<HTMLInputElement>(null)

  function resetOrdForm() {
    setOrdMode('none'); setOrdMedecinNom(''); setOrdDate(''); setOrdNotes('')
    setOrdMeds([{ nom: '', dosage: '', frequence: '', duree: '' }])
    setOrdFile(null); setOrdError(null)
    ;[ordFileRef, ordPhotoRef, ordDocRef].forEach(r => { if (r.current) r.current.value = '' })
  }
  const [confirmDocId, setConfirmDocId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: ordonnances = [], isLoading: loadingOrds } = useOrdonnances(patientId)
  const { data: documents = [], isLoading: loadingDocs } = useDocuments(patientId)
  const deleteOrd = useDeleteOrdonnance(patientId)
  const createOrd = useCreateOrdonnance(patientId)
  const uploadDoc = useUploadDocument(patientId)
  const deleteDoc = useDeleteDocument(patientId)

  async function handleUpload(e: React.SubmitEvent) {
    e.preventDefault()
    setUploadError(null)
    if (!uploadFile) { setUploadError('Sélectionnez un fichier.'); return }
    try {
      await uploadDoc.mutateAsync({ typeDoc: uploadType, file: uploadFile })
      resetDocForm()
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Erreur lors de l'envoi.")
    }
  }

  const tabs = [
    { key: 'ordonnances' as const, label: 'Ordonnances', sub: 'Par votre médecin', count: ordonnances.length },
    { key: 'documents' as const, label: 'Mes documents', sub: 'Ajoutés par moi', count: documents.length },
  ]

  return (
    <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto" id="main-content">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#010C2D]">Dossier médical</h1>
        <p className="text-sm text-[#465058] mt-1">
          Ordonnances transmises par vos médecins et documents que vous partagez.
        </p>
      </div>

      {/* Compte famille : dossier du membre sélectionné */}
      {hasProches && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(profils ?? []).map((profil) => (
            <button
              key={profil.id}
              type="button"
              onClick={() => setSelectedId(profil.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                patientId === profil.id
                  ? 'bg-[#007DFF] text-white border-[#007DFF]'
                  : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500'
              }`}
            >
              {profil.self ? 'Moi' : profil.prenom}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div
        className="grid grid-cols-2 gap-1 p-1 rounded-2xl mb-6 bg-white shadow-sm border border-zinc-100"
        role="tablist"
        aria-label="Sections du dossier"
      >
        {tabs.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`flex flex-col items-center justify-center gap-0.5 py-3 rounded-xl text-sm transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] ${
                active ? 'bg-[#007DFF] text-white shadow-sm' : 'text-[#465058] hover:bg-zinc-50'
              }`}
            >
              <span className="font-bold">{t.label}</span>
              <span className={`text-[11px] font-medium ${active ? 'text-white/70' : 'text-zinc-400'}`}>
                {t.sub} · {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Ordonnances (doctor → patient, read-only) ── */}
      {tab === 'ordonnances' && (
        <div className="space-y-4" role="tabpanel" aria-label="Ordonnances">
          {/* Mode picker */}
          {ordMode === 'none' && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  key: 'saisir' as const,
                  icon: (
                    <svg className="h-6 w-6 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                      <rect x="9" y="3" width="6" height="4" rx="1"/><path strokeLinecap="round" d="M9 12h6M9 16h4"/>
                    </svg>
                  ),
                  label: 'Saisir', sub: 'Remplir le formulaire',
                },
                {
                  key: 'photo' as const,
                  icon: (
                    <svg className="h-6 w-6 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  ),
                  label: 'Photo', sub: "Scanner l'ordonnance",
                },
                {
                  key: 'document' as const,
                  icon: (
                    <svg className="h-6 w-6 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                  ),
                  label: 'Fichier', sub: 'PDF ou image',
                },
              ].map(({ key, icon, label, sub }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setOrdMode(key)
                    if (key === 'photo') setTimeout(() => ordPhotoRef.current?.click(), 100)
                    if (key === 'document') setTimeout(() => ordDocRef.current?.click(), 100)
                  }}
                  className="cursor-pointer flex flex-col items-center gap-2 rounded-2xl bg-white border border-zinc-100 shadow-sm px-3 py-5 hover:border-[#007DFF]/30 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#EBF4FF] flex items-center justify-center">
                    {icon}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#010C2D]">{label}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Hidden file inputs for photo/document modes */}
          <input ref={ordPhotoRef} type="file" accept="image/*" capture="environment"
            className="hidden" aria-hidden="true"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setOrdFile(f) }}
          />
          <input ref={ordDocRef} type="file" accept=".pdf,image/*"
            className="hidden" aria-hidden="true"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setOrdFile(f) }}
          />

          {/* Photo / document quick-submit form */}
          {(ordMode === 'photo' || ordMode === 'document') && (
            <form
              className="bg-white rounded-2xl shadow-sm border border-[#B6DAF7] p-5 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault(); setOrdError(null)
                if (!ordFile) { setOrdError('Sélectionnez un fichier.'); return }
                try {
                  const created = await createOrd.mutateAsync({
                    source: 'PATIENT',
                    medecinNom: ordMedecinNom.trim() || null,
                    dateEmission: ordDate || null,
                    medicaments: [],
                    notes: ordNotes.trim() || null,
                  })
                  if (created.id) await uploadOrdonnanceFichier(created.id, ordFile)
                  resetOrdForm()
                } catch { setOrdError("Erreur lors de l'ajout.") }
              }}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  {ordMode === 'photo' ? 'Photo' : 'Fichier'}
                </span>
                <h3 className="text-sm font-bold text-[#010C2D]">Joindre l&apos;ordonnance</h3>
              </div>

              {/* File preview / picker */}
              <div
                onClick={() => ordMode === 'photo' ? ordPhotoRef.current?.click() : ordDocRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-4 text-center transition-all ${
                  ordFile ? 'border-[#2EB67D] bg-emerald-50' : 'border-zinc-200 bg-zinc-50 hover:border-[#007DFF]/50'
                }`}
              >
                {ordFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 text-[#2EB67D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span className="text-sm font-semibold text-[#2EB67D] truncate max-w-[200px]">{ordFile.name}</span>
                    <button type="button" onClick={(ev) => { ev.stopPropagation(); setOrdFile(null) }}
                      aria-label="Retirer" className="text-zinc-400 hover:text-zinc-700">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 font-medium">
                    {ordMode === 'photo' ? 'Appuyez pour prendre une photo' : 'Appuyez pour choisir un fichier'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Médecin (optionnel)</label>
                  <input type="text" value={ordMedecinNom} onChange={e => setOrdMedecinNom(e.target.value)}
                    placeholder="Dr. Nom" className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#007DFF]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Date</label>
                  <input type="date" value={ordDate} onChange={e => setOrdDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#007DFF]"/>
                </div>
              </div>

              {ordError && <p role="alert" className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{ordError}</p>}

              <div className="flex gap-2">
                <button type="submit" disabled={createOrd.isPending || !ordFile}
                  className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#007DFF] hover:bg-[#00263C] disabled:opacity-50 transition-colors">
                  {createOrd.isPending ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button type="button" onClick={resetOrdForm}
                  className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-colors">
                  ← Retour
                </button>
              </div>
            </form>
          )}

          {/* Manual form */}
          {ordMode === 'saisir' && (
            <form
              className="bg-white rounded-2xl shadow-sm border border-[#B6DAF7] p-5 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()
                setOrdError(null)
                const validMeds = ordMeds.filter(m => m.nom.trim())
                if (!validMeds.length) { setOrdError('Ajoutez au moins un médicament.'); return }
                try {
                  const created = await createOrd.mutateAsync({
                    source: 'PATIENT',
                    medecinNom: ordMedecinNom.trim() || null,
                    dateEmission: ordDate || null,
                    medicaments: validMeds,
                    notes: ordNotes.trim() || null,
                  })
                  // Upload attached file if provided
                  if (ordFile && created.id) {
                    try { await uploadOrdonnanceFichier(created.id, ordFile) } catch { /* non-blocking */ }
                  }
                  resetOrdForm()
                } catch { setOrdError("Erreur lors de l'ajout.") }
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">Ajout manuel</span>
                <h3 className="text-sm font-bold text-[#010C2D]">Nouvelle ordonnance</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Nom du médecin</label>
                  <input
                    type="text"
                    value={ordMedecinNom}
                    onChange={e => setOrdMedecinNom(e.target.value)}
                    placeholder="Dr. Nom (optionnel)"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-[#333333] focus:outline-none focus:border-[#007DFF] focus:ring-2 focus:ring-[#007DFF]/10"
                  />
                </div>
                <div>
                  <label htmlFor="ord-date-emission" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Date d&apos;émission</label>
                  <input
                    id="ord-date-emission"
                    type="date"
                    value={ordDate}
                    onChange={e => setOrdDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-[#333333] focus:outline-none focus:border-[#007DFF] focus:ring-2 focus:ring-[#007DFF]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Médicaments *</label>
                <div className="space-y-2">
                  {ordMeds.map((med, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2 bg-zinc-50 rounded-xl p-3">
                      <input
                        type="text"
                        value={med.nom}
                        onChange={e => setOrdMeds(prev => prev.map((m, j) => j === i ? { ...m, nom: e.target.value } : m))}
                        placeholder="Nom du médicament *"
                        className="col-span-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-[#007DFF]"
                      />
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={e => setOrdMeds(prev => prev.map((m, j) => j === i ? { ...m, dosage: e.target.value } : m))}
                        placeholder="Dosage (ex: 500 mg)"
                        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-[#007DFF]"
                      />
                      <input
                        type="text"
                        value={med.frequence}
                        onChange={e => setOrdMeds(prev => prev.map((m, j) => j === i ? { ...m, frequence: e.target.value } : m))}
                        placeholder="Fréquence (ex: 2x/jour)"
                        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-[#007DFF]"
                      />
                      {ordMeds.length > 1 && (
                        <button type="button" onClick={() => setOrdMeds(prev => prev.filter((_, j) => j !== i))}
                          className="col-span-2 text-xs text-red-400 hover:text-red-600 text-right transition-colors">
                          Retirer ce médicament
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setOrdMeds(prev => [...prev, { nom: '', dosage: '', frequence: '', duree: '' }])}
                    className="cursor-pointer text-xs font-semibold text-[#007DFF] hover:text-[#00263C] transition-colors"
                  >
                    + Ajouter un médicament
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea
                  value={ordNotes}
                  onChange={e => setOrdNotes(e.target.value)}
                  placeholder="Instructions particulières…"
                  rows={2}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-[#333333] focus:outline-none focus:border-[#007DFF] focus:ring-2 focus:ring-[#007DFF]/10 resize-none"
                />
              </div>

              {ordError && <p role="alert" className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{ordError}</p>}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={createOrd.isPending}
                  className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#007DFF] hover:bg-[#00263C] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]">
                  {createOrd.isPending ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button type="button" onClick={resetOrdForm}
                  className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-colors">
                  ← Retour
                </button>
              </div>
            </form>
          )}

          {loadingOrds ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-[#007DFF]/30 border-t-[#007DFF] animate-spin" />
            </div>
          ) : ordonnances.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF4FF] flex items-center justify-center mx-auto mb-4">
                <svg className="h-6 w-6 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/><path strokeLinecap="round" d="M9 12h6M9 16h4"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700">Aucune ordonnance</p>
              <p className="text-xs text-zinc-400 mt-1">Vos ordonnances apparaîtront ici après vos consultations.</p>
            </div>
          ) : (
            ordonnances.map((ord) => (
              <div key={ord.id} className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {ord.source === 'PATIENT' ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">Ajout manuel</span>
                      ) : (
                        <span className="rounded-full bg-[#EBF4FF] px-2 py-0.5 text-[10px] font-bold text-[#1863A9] uppercase tracking-wider">Médecin</span>
                      )}
                      <p className="text-[11px] font-semibold text-[#465058]">
                        {formatDate(ord.dateEmission)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[#010C2D]">
                      {ord.medecinNom ? `Dr. ${ord.medecinNom}` : `${ord.medicaments.length} médicament${ord.medicaments.length > 1 ? 's' : ''}`}
                    </p>
                    {ord.medecinNom && (
                      <p className="text-xs text-zinc-400">{ord.medicaments.length} médicament{ord.medicaments.length > 1 ? 's' : ''}</p>
                    )}
                  </div>
                  {confirmOrdId === ord.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Supprimer ?</span>
                      <button
                        type="button"
                        onClick={() => { deleteOrd.mutate(ord.id); setConfirmOrdId(null) }}
                        className="cursor-pointer rounded-lg bg-red-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-600 transition-colors"
                      >
                        Oui
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmOrdId(null)}
                        className="cursor-pointer rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmOrdId(ord.id)}
                      aria-label="Supprimer cette ordonnance"
                      className="cursor-pointer p-2 rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <polyline strokeLinecap="round" points="3 6 5 6 21 6"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Medications */}
                <div className="px-5 py-4 space-y-2">
                  {ord.medicaments.map((med, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-xl bg-[#F8FAFC] px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#010C2D] truncate">{med.nom}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {med.frequence}{med.duree ? ` · ${med.duree}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#EBF4FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#007DFF]">
                        {med.dosage}
                      </span>
                    </div>
                  ))}
                </div>

                {ord.notes && (
                  <p className="px-5 pb-4 text-xs text-zinc-400 italic border-t border-zinc-50 pt-3">
                    {ord.notes}
                  </p>
                )}
                {ord.fichierNom && (
                  <div className="px-5 pb-4 border-t border-zinc-50 pt-3">
                    <button
                      type="button"
                      onClick={() => openProtectedFile(getOrdonnanceFichierUrl(ord.id)).catch(() => {})}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#EBF4FF] px-3 py-1.5 text-xs font-semibold text-[#007DFF] hover:bg-[#D6EAFF] transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                      </svg>
                      {ord.fichierNom}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Documents (patient-uploaded) ── */}
      {tab === 'documents' && (
        <div className="space-y-4" role="tabpanel" aria-label="Mes documents">

          {/* Mode picker — documents */}
          {docMode === 'none' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  key: 'photo' as const,
                  icon: (
                    <svg className="h-6 w-6 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  ),
                  label: 'Prendre une photo', sub: 'Scanner avec la caméra',
                },
                {
                  key: 'fichier' as const,
                  icon: (
                    <svg className="h-6 w-6 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                  ),
                  label: 'Téléverser un fichier', sub: 'PDF, JPG, PNG, DOC',
                },
              ].map(({ key, icon, label, sub }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setDocMode(key)
                    if (key === 'photo') setTimeout(() => docPhotoRef.current?.click(), 100)
                    if (key === 'fichier') setTimeout(() => docFichierRef.current?.click(), 100)
                  }}
                  className="cursor-pointer flex flex-col items-center gap-2 rounded-2xl bg-white border border-zinc-100 shadow-sm px-3 py-5 hover:border-[#007DFF]/30 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#EBF4FF] flex items-center justify-center">
                    {icon}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#010C2D]">{label}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Hidden inputs */}
          <input ref={docPhotoRef} type="file" accept="image/*" capture="environment"
            className="hidden" aria-hidden="true"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadFile(f) }}
          />
          <input ref={docFichierRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden" aria-hidden="true"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadFile(f) }}
          />

          {/* Upload form — shown after file selected */}
          {docMode !== 'none' && (
            <form onSubmit={handleUpload} className="bg-white rounded-2xl shadow-sm border border-[#B6DAF7] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#EBF4FF] px-2 py-0.5 text-[10px] font-bold text-[#1863A9] uppercase tracking-wider">
                  {docMode === 'photo' ? 'Photo' : 'Fichier'}
                </span>
                <h2 className="text-sm font-bold text-[#010C2D]">Ajouter un document</h2>
              </div>

              {/* File preview */}
              <div
                onClick={() => docMode === 'photo' ? docPhotoRef.current?.click() : docFichierRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-4 text-center transition-all ${
                  uploadFile ? 'border-[#2EB67D] bg-emerald-50' : 'border-zinc-200 bg-zinc-50 hover:border-[#007DFF]/50'
                }`}
              >
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 text-[#2EB67D] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span className="text-sm font-semibold text-[#2EB67D] truncate max-w-[200px]">{uploadFile.name}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setUploadFile(null) }}
                      aria-label="Retirer" className="text-zinc-400 hover:text-zinc-700">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 font-medium">
                    {docMode === 'photo' ? 'Appuyez pour prendre une photo' : 'Appuyez pour choisir un fichier'}
                  </p>
                )}
              </div>

              {/* Type selector */}
              <div>
                <label htmlFor="doc-type" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Type de document
                </label>
                <select
                  id="doc-type"
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-[#333333] focus:outline-none focus:border-[#007DFF] focus:ring-2 focus:ring-[#007DFF]/10"
                >
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {uploadError && (
                <p role="alert" className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {uploadError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploadDoc.isPending || !uploadFile}
                  className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#007DFF] hover:bg-[#00263C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
                >
                  {uploadDoc.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Envoi…
                    </span>
                  ) : 'Envoyer'}
                </button>
                <button type="button" onClick={resetDocForm}
                  className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition-colors">
                  ← Retour
                </button>
              </div>
            </form>
          )}

          {/* Documents list */}
          {loadingDocs ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 rounded-full border-2 border-[#007DFF]/30 border-t-[#007DFF] animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF4FF] flex items-center justify-center mx-auto mb-4">
                <svg className="h-6 w-6 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700">Aucun document</p>
              <p className="text-xs text-zinc-400 mt-1">Ajoutez vos analyses, radios ou comptes rendus.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-50 bg-zinc-50/60">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {documents.length} document{documents.length > 1 ? 's' : ''}
                </p>
              </div>
              <ul className="divide-y divide-zinc-50">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EBF4FF] flex items-center justify-center shrink-0">
                      <svg className="h-4 w-4 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#333333] truncate">{doc.nom}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        <span className="text-[#007DFF] font-medium">{doc.typeDoc}</span>
                        {doc.taille ? ` · ${formatSize(doc.taille)}` : ''}
                        {' · '}{new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openProtectedFile(getDocumentDownloadUrl(doc.patientId, doc.id)).catch(() => {})}
                        aria-label={`Télécharger ${doc.nom}`}
                        className="p-2 rounded-lg text-zinc-400 hover:text-[#007DFF] hover:bg-[#EBF4FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                      </button>
                      {confirmDocId === doc.id ? (
                        <div className="flex items-center gap-1.5 ml-1">
                          <button
                            type="button"
                            onClick={() => { deleteDoc.mutate(doc.id); setConfirmDocId(null) }}
                            className="cursor-pointer rounded-md bg-red-500 px-2 py-0.5 text-xs font-bold text-white hover:bg-red-600 transition-colors"
                          >
                            Oui
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDocId(null)}
                            className="cursor-pointer rounded-md border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-500 hover:bg-zinc-50 transition-colors"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDocId(doc.id)}
                          aria-label={`Supprimer ${doc.nom}`}
                          className="cursor-pointer p-2 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <polyline strokeLinecap="round" points="3 6 5 6 21 6"/>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
