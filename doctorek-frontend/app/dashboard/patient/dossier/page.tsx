'use client'

import { useState, useRef } from 'react'
import { getSession } from '@/lib/session'
import {
  useOrdonnances,
  useDocuments,
  useDeleteOrdonnance,
  useUploadDocument,
  useDeleteDocument,
} from '@/features/dossier/hooks'
import { getDocumentDownloadUrl } from '@/features/dossier/api'

const C_BLUE = '#007DFF'
const C_DARK = '#00263C'
const C_TEXT = '#333333'

const TYPE_OPTIONS = [
  'Analyse de sang',
  'Radio / Imagerie',
  'Compte rendu',
  'Certificat médical',
  'Autre',
]

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${C_BLUE}12` }}>
        <span style={{ color: C_BLUE }}>{icon}</span>
      </div>
      <p className="text-sm text-gray-400 font-medium">{message}</p>
    </div>
  )
}

export default function DossierPage() {
  const session = getSession()
  const patientId = session?.id ?? ''

  const [tab, setTab] = useState<'ordonnances' | 'documents'>('ordonnances')
  const [uploadType, setUploadType] = useState(TYPE_OPTIONS[0])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: ordonnances = [], isLoading: loadingOrds } = useOrdonnances(patientId)
  const { data: documents = [], isLoading: loadingDocs } = useDocuments(patientId)
  const deleteOrd = useDeleteOrdonnance(patientId)
  const uploadDoc = useUploadDocument(patientId)
  const deleteDoc = useDeleteDocument(patientId)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setUploadError(null)
    if (!uploadFile) { setUploadError('Sélectionnez un fichier.'); return }
    try {
      await uploadDoc.mutateAsync({ typeDoc: uploadType, file: uploadFile })
      setUploadFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch {
      setUploadError('Erreur lors de l\'upload. Réessayez.')
    }
  }

  const tabs = [
    { key: 'ordonnances' as const, label: 'Ordonnances', count: ordonnances.length },
    { key: 'documents' as const, label: 'Documents', count: documents.length },
  ]

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-black" style={{ color: C_DARK }}>Mes Documents Médicaux</h1>
        <p className="text-sm text-gray-400 mt-1">Ordonnances et fichiers médicaux</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mb-6 bg-white shadow-sm border border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={
              tab === t.key
                ? { background: C_BLUE, color: 'white' }
                : { color: '#465058' }
            }
          >
            {t.label}
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={
                tab === t.key
                  ? { background: 'rgba(255,255,255,0.25)', color: 'white' }
                  : { background: `${C_BLUE}12`, color: C_BLUE }
              }
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Ordonnances tab */}
      {tab === 'ordonnances' && (
        <div className="space-y-4">
          {loadingOrds ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C_BLUE} transparent transparent transparent` }} />
            </div>
          ) : ordonnances.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm">
              <EmptyState
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <path d="M9 12h6M9 16h4" strokeLinecap="round" />
                  </svg>
                }
                message="Aucune ordonnance enregistrée"
              />
            </div>
          ) : (
            ordonnances.map((ord) => (
              <div key={ord.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {new Date(ord.dateEmission).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: C_TEXT }}>
                      {ord.medicaments.length} médicament{ord.medicaments.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteOrd.mutate(ord.id)}
                    disabled={deleteOrd.isPending}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Supprimer"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                      <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                      <path d="M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-2">
                  {ord.medicaments.map((med, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: '#F8FAFC' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold" style={{ color: C_DARK }}>{med.nom}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${C_BLUE}12`, color: C_BLUE }}>
                          {med.dosage}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-gray-500">{med.frequence}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{med.duree}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {ord.notes && (
                  <p className="text-xs text-gray-400 italic mt-3 border-t border-gray-100 pt-3">{ord.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Documents tab */}
      {tab === 'documents' && (
        <div className="space-y-4">
          {/* Upload form */}
          <form onSubmit={handleUpload} className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-bold mb-4" style={{ color: C_DARK }}>Ajouter un document</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Type de document</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#007DFF] transition-colors"
                  style={{ color: C_TEXT }}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Fichier</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>
            {uploadError && (
              <p className="text-xs text-red-500 mt-3">{uploadError}</p>
            )}
            <button
              type="submit"
              disabled={uploadDoc.isPending || !uploadFile}
              className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50"
              style={{ background: C_BLUE }}
            >
              {uploadDoc.isPending ? 'Envoi…' : 'Envoyer le document'}
            </button>
          </form>

          {/* Documents list */}
          {loadingDocs ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C_BLUE} transparent transparent transparent` }} />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm">
              <EmptyState
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                }
                message="Aucun document enregistré"
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${C_BLUE}12` }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C_BLUE} strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: C_TEXT }}>{doc.nom}</p>
                    <p className="text-xs text-gray-400">
                      {doc.typeDoc}
                      {doc.taille ? ` · ${(doc.taille / 1024).toFixed(0)} Ko` : ''}
                      {' · '}{new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={getDocumentDownloadUrl(doc.patientId, doc.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Télécharger"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </a>
                    <button
                      type="button"
                      onClick={() => deleteDoc.mutate(doc.id)}
                      disabled={deleteDoc.isPending}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                        <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                        <path d="M9 6V4h6v2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
