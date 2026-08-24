'use client'

import { useState, useEffect } from 'react'
import { CarteVirtuelle, PatientProfile } from '@/lib/types'
import { getGoogleWalletSaveUrl } from '@/features/carte/api'
import QRCode from 'qrcode'
import { buildRectoSvg, buildVersoSvg } from './CarteVirtuelleExport'

interface CarteVirtuelleCardProps {
  carte: CarteVirtuelle
  profile?: PatientProfile | null
  firstName?: string
  lastName?: string
  onEdit?: () => void
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

// ── RECTO — même design que l'export (source unique : buildRectoSvg) ────────

export function CarteRecto({
  carte,
  profile,
  firstName,
  lastName,
  qrUrl,
}: {
  carte: CarteVirtuelle
  profile?: PatientProfile | null
  firstName?: string
  lastName?: string
  qrUrl?: string
}) {
  const [qrGenerated, setQrGenerated] = useState<string | undefined>(undefined)
  // Sans qrUrl, on ignore la dernière génération au lieu de la réinitialiser dans l'effet.
  const qrDataUrl = qrUrl ? qrGenerated : undefined

  useEffect(() => {
    if (!qrUrl) return
    let cancelled = false
    QRCode.toDataURL(qrUrl, { width: 192, margin: 1, color: { dark: '#010C2D', light: '#FFFFFF' } })
      .then((url) => { if (!cancelled) setQrGenerated(url) })
      .catch(() => { if (!cancelled) setQrGenerated(undefined) })
    return () => { cancelled = true }
  }, [qrUrl])

  const fullName =
    [firstName, lastName?.toUpperCase()].filter(Boolean).join(' ') ||
    'NOM ET PRÉNOM'

  const rawCin = profile?.numIdentite ?? ''
  const maskedCin =
    rawCin.length >= 3
      ? rawCin[0] + '*'.repeat(rawCin.length - 2) + rawCin[rawCin.length - 1]
      : rawCin || '-'

  const cnss = carte.assuranceNumero ?? '-'

  const svg = buildRectoSvg(
    fullName,
    maskedCin,
    cnss,
    carte.cardRef ?? '-',
    '/logo0.png',
    profile?.photoUrl ?? undefined,
    qrDataUrl,
  )

  return (
    <div
      style={{ width: '100%', height: '100%' }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

// ── VERSO ──────────────────────────────────────────────────────────────────────

export function CarteVerso({
  carte,
  profile,
  firstName,
  lastName,
  flat,
}: {
  carte: CarteVirtuelle
  profile?: PatientProfile | null
  firstName?: string
  lastName?: string
  flat?: boolean
}) {
  const svg = buildVersoSvg(
    lastName?.toUpperCase() || '-',
    firstName || '-',
    profile?.dateNaissance ?? '-',
    profile?.numIdentite ?? '-',
    `01/01/${new Date().getFullYear()}`,
    carte.assuranceNumero ?? carte.cardRef ?? '-',
    '/logo0.png',
  )

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        // Panneau arrière du flip 3D : pré-tourné pour être lisible une fois la carte retournée.
        transform: flat ? undefined : 'rotateY(180deg)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default function CarteVirtuelleCard({
  carte,
  profile,
  firstName,
  lastName,
  onEdit,
}: CarteVirtuelleCardProps) {
  const [downloading, setDownloading] = useState(false)
  const [addingToWallet, setAddingToWallet] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const qrUrl = carte.cardRef
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://doctorek.ma'}/carte/${carte.cardRef}`
    : undefined

  const downloadPng = async () => {
    setDownloading(true)
    try {
      const response = await fetch('/api/carte/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carte, profile, firstName, lastName }),
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const filename = `carte-nationale-doctorek-${carte.cardRef || 'doc'}.png`
      const file = new File([blob], filename, { type: 'image/png' })
      const canShareFile =
        navigator.maxTouchPoints > 0 &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })

      if (canShareFile) {
        try {
          await navigator.share({
            files: [file],
            title: 'Ma carte santé Doctorek',
          })
          return
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return
          // Le partage natif peut être refusé par le système : téléchargement de secours.
        }
      }

      downloadBlob(blob, filename)
    } catch {
      alert("Erreur lors de l'exportation de la carte. Veuillez réessayer.")
    } finally {
      setDownloading(false)
    }
  }

  const addToGoogleWallet = async () => {
    setAddingToWallet(true)
    try {
      const { saveUrl } = await getGoogleWalletSaveUrl(carte.patientId)
      window.location.href = saveUrl
    } catch {
      alert("Erreur lors de l'ajout à Google Wallet. Veuillez réessayer.")
    } finally {
      setAddingToWallet(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Card 3D flip container */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1.586',
          position: 'relative',
          perspective: '1400px',
          cursor: 'pointer',
          filter: 'drop-shadow(0 20px 40px rgba(0,125,255,0.15))',
        }}
        onClick={() => setFlipped(f => !f)}
        title="Cliquer pour retourner la carte"
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
            <CarteRecto carte={carte} profile={profile} firstName={firstName} lastName={lastName} qrUrl={qrUrl} />
          </div>
          <CarteVerso carte={carte} profile={profile} firstName={firstName} lastName={lastName} />
        </div>
      </div>

      <p className="text-center text-[#94A3B8] text-xs mt-3 font-medium tracking-wider select-none">
        {flipped ? '← RECTO' : 'VERSO →'} · Cliquez sur la carte pour la retourner
      </p>

      {/* Actions */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={downloadPng}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#007DFF] text-white shadow-lg shadow-blue-500/20 hover:bg-[#0052CC] transition-colors disabled:opacity-50"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {downloading ? 'Exportation...' : 'Télécharger la carte'}
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-white text-[#007DFF] border-2 border-[#007DFF] hover:bg-[#F0F7FF] transition-colors"
          >
            Modifier
          </button>
        )}
      </div>

      {/* Google Wallet */}
      <button
        onClick={addToGoogleWallet}
        disabled={addingToWallet}
        className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-white text-[#1F1F1F] border-2 border-[#007DFF] shadow-lg shadow-blue-500/15 hover:bg-[#F0F7FF] transition-colors disabled:opacity-50"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
          <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.32-9.08H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
          <path fill="#FBBC05" d="M11.68 28.17A13.93 13.93 0 0 1 10.95 24c0-1.45.25-2.86.73-4.17v-5.7H4.34A23.93 23.93 0 0 0 2 24c0 3.86.92 7.51 2.34 10.7l7.34-5.7z"/>
          <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.13l7.34 5.7c1.74-5.21 6.59-9.08 12.32-9.08z"/>
        </svg>
        {addingToWallet ? 'Ajout en cours...' : 'Ajouter à Google Wallet'}
      </button>
    </div>
  )
}
