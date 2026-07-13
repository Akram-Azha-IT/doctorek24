'use client'

import { useState } from 'react'
import { FileCheck2, Plus, X } from 'lucide-react'
import {
  useDocumentsRequis,
  useAddDocumentsRequis,
  useDeleteDocumentRequis,
  useMarquerDocumentFourni,
} from '../hooks'

interface DocumentsRequisSectionProps {
  rdvId: string
  /** 'medecin' = gère la liste (ajout/suppression) · 'patient' = coche ce qui est prêt */
  mode: 'medecin' | 'patient'
}

/**
 * Préparation du RDV : documents médicaux ou administratifs demandés au
 * patient en amont de la consultation.
 */
export function DocumentsRequisSection({ rdvId, mode }: DocumentsRequisSectionProps) {
  const { data: docs = [], isLoading } = useDocumentsRequis(rdvId)
  const addMutation = useAddDocumentsRequis(rdvId)
  const deleteMutation = useDeleteDocumentRequis(rdvId)
  const fourniMutation = useMarquerDocumentFourni(rdvId)

  const [newLibelle, setNewLibelle] = useState('')

  function handleAdd() {
    const libelle = newLibelle.trim()
    if (!libelle) return
    addMutation.mutate([libelle], { onSuccess: () => setNewLibelle('') })
  }

  const fournisCount = docs.filter((d) => d.fourni).length

  if (isLoading) {
    return <div className="h-10 animate-pulse rounded-lg bg-[#F0F2F5]" />
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <FileCheck2 className="h-4 w-4 text-[#007DFF]" />
        <p className="text-sm font-bold text-[#010C2D]">
          {mode === 'patient'
            ? 'Documents à apporter au rendez-vous'
            : 'Documents à préparer'}
        </p>
        {docs.length > 0 && (
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#6B7A99]">
            {fournisCount}/{docs.length} prêt{fournisCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {mode === 'patient' && docs.length > 0 && (
        <p className="text-sm text-[#465058]">
          Votre médecin vous demande d&apos;apporter ces documents.
          Cochez ce que vous avez déjà préparé :
        </p>
      )}

      {mode === 'medecin' && (
        <p className="text-xs text-[#6B7A99]">
          Listez les documents que le patient doit apporter (carte CNSS, analyses,
          radios…). Il sera notifié automatiquement et verra la liste sur son rendez-vous.
        </p>
      )}

      {docs.length === 0 ? (
        <p className="text-xs text-[#A0AEC0]">
          Aucun document demandé pour ce rendez-vous.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex min-h-[44px] items-center gap-3 rounded-xl border border-[#EEF1F6] bg-white px-3.5 py-2.5"
            >
              <input
                id={`doc-requis-${doc.id}`}
                type="checkbox"
                checked={doc.fourni}
                disabled={mode === 'medecin' || fourniMutation.isPending}
                onChange={(e) =>
                  fourniMutation.mutate({ docId: doc.id, fourni: e.target.checked })
                }
                className="h-5 w-5 shrink-0 cursor-pointer rounded border-[#C4CFDD] accent-[#007DFF] disabled:opacity-60 disabled:cursor-default"
              />
              <label
                htmlFor={`doc-requis-${doc.id}`}
                className={`flex-1 cursor-pointer text-sm ${
                  doc.fourni ? 'text-[#A0AEC0] line-through' : 'text-[#010C2D]'
                }`}
              >
                {doc.libelle}
              </label>
              {doc.fourni && (
                <span className="rounded-full bg-[#E6F8F0] px-2 py-0.5 text-[10px] font-semibold text-[#1B7A4E]">
                  Prêt
                </span>
              )}
              {mode === 'medecin' && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(doc.id)}
                  disabled={deleteMutation.isPending}
                  aria-label={`Retirer ${doc.libelle}`}
                  className="text-[#C4CFDD] transition-colors hover:text-[#E01E5A] disabled:opacity-40"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {mode === 'medecin' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newLibelle}
            onChange={(e) => setNewLibelle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Ex : Carte CNSS, analyses sanguines…"
            maxLength={255}
            className="flex-1 rounded-lg border border-[#E3E8EF] bg-white px-3 py-2 text-sm text-[#010C2D] placeholder-[#A0AEC0] focus:border-[#007DFF] focus:outline-none focus:ring-2 focus:ring-[#007DFF]/20"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newLibelle.trim() || addMutation.isPending}
            aria-label="Demander ce document"
            className="rounded-lg bg-[#007DFF] px-3 py-2 text-white transition-colors hover:bg-[#00263C] disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  )
}
