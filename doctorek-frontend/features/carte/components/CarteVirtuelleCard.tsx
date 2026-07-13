'use client'

import { useState, useEffect } from 'react'
import { CarteVirtuelle, PatientProfile } from '@/lib/types'
import { getGoogleWalletSaveUrl } from '@/features/carte/api'
import QRCode from 'qrcode'
import { buildRectoSvg } from './CarteVirtuelleExport'

const C_BLUE  = '#007DFF'
const C_DARK  = '#003B95'
const C_TEXT  = '#111827'
const C_LABEL = '#6B7280'
const C_RED   = '#C1272D'
const C_GREEN = '#006233'

interface CarteVirtuelleCardProps {
  carte: CarteVirtuelle
  profile?: PatientProfile | null
  firstName?: string
  lastName?: string
  onEdit?: () => void
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
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    if (!qrUrl) { setQrDataUrl(undefined); return }
    QRCode.toDataURL(qrUrl, { width: 192, margin: 1, color: { dark: '#010C2D', light: '#FFFFFF' } })
      .then((url) => { if (!cancelled) setQrDataUrl(url) })
      .catch(() => { if (!cancelled) setQrDataUrl(undefined) })
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
  const nom = lastName?.toUpperCase() || '-'
  const prenom = firstName || '-'
  const createdYear = new Date().getFullYear()

  const rows = [
    { fr: 'Nom',                   ar: 'النسب',            value: nom },
    { fr: 'Prénom',                 ar: 'الاسم الشخصي',     value: prenom },
    { fr: 'Date de naissance',      ar: 'تاريخ الازدياد',   value: profile?.dateNaissance ?? '-' },
    { fr: 'C.I.N.',                 ar: 'ب.ت.و',           value: profile?.numIdentite ?? '-' },
    { fr: "Date d'immatriculation", ar: 'تاريخ التسجيل',    value: `01/01/${createdYear}` },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'min(3vw, 12px)',
        overflow: 'hidden',
        background: '#F8FAFD',
        boxShadow: '0 4px 24px rgba(0,125,255,0.12), inset 0 0 0 1px rgba(0,125,255,0.1)',
        fontFamily: 'system-ui,-apple-system,sans-serif',
        display: 'flex',
        flexDirection: 'column',
        ...(flat
          ? {}
          : {
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden' as const,
            }),
      }}
    >
      {/* Logo watermark */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo0.png"
          alt=""
          style={{
            width: '55%',
            opacity: 0.04,
            transform: 'rotate(-12deg)',
            userSelect: 'none',
            filter: `hue-rotate(0deg) saturate(0)`,
          }}
        />
      </div>

      {/* Top stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '5px',
          background: `linear-gradient(90deg, ${C_RED} 50%, ${C_GREEN} 50%)`,
          zIndex: 3,
        }}
      />

      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C_BLUE} 0%, ${C_DARK} 100%)`,
          padding: 'clamp(10px,2.8vw,16px) clamp(14px,3.5vw,22px)',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo0.png"
          alt="Doctorek"
          style={{
            height: 'clamp(18px,4.5vw,28px)',
            width: 'auto',
            filter: 'brightness(0) invert(1)',
            flexShrink: 0,
          }}
        />
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 'clamp(5px,1.15vw,7px)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            N° Immatriculation / رقم التسجيل
          </div>
          <div
            style={{
              color: '#FFFFFF',
              fontSize: 'clamp(10px,2.8vw,15px)',
              fontWeight: 900,
              fontFamily: '"Courier New", Courier, monospace',
              letterSpacing: '0.1em',
              marginTop: '2px',
            }}
          >
            {carte.assuranceNumero ?? carte.cardRef ?? '-'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: 'clamp(8px,2vw,14px) clamp(14px,3.5vw,22px)',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(3px,0.7vw,5px)',
        }}
      >
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: '4px',
              background: i % 2 === 0 ? 'rgba(0,125,255,0.04)' : 'transparent',
              borderRadius: '5px',
              padding: 'clamp(3px,0.7vw,5px) clamp(6px,1.4vw,10px)',
            }}
          >
            <span
              style={{
                color: C_LABEL,
                fontSize: 'clamp(5px,1.2vw,7px)',
                fontWeight: 700,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              {row.fr}
            </span>
            <span
              style={{
                color: C_TEXT,
                fontSize: 'clamp(8px,2.1vw,12px)',
                fontWeight: 800,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
                borderLeft: `2px solid ${C_BLUE}30`,
                borderRight: `2px solid ${C_BLUE}30`,
                padding: '0 clamp(6px,1.5vw,10px)',
              }}
            >
              {row.value}
            </span>
            <span
              style={{
                color: C_LABEL,
                fontSize: 'clamp(5px,1.2vw,7px)',
                fontWeight: 700,
                direction: 'rtl',
                textAlign: 'right',
                letterSpacing: '0.01em',
              }}
            >
              {row.ar}
            </span>
          </div>
        ))}
      </div>

      {/* Security notice */}
      <div
        style={{
          margin: '0 clamp(14px,3.5vw,22px) clamp(6px,1.5vw,10px)',
          background: `linear-gradient(135deg, #EEF6FF 0%, #F0FDF9 100%)`,
          border: `1px solid ${C_BLUE}25`,
          borderRadius: '8px',
          padding: 'clamp(4px,1vw,7px) clamp(8px,2vw,12px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px,1.5vw,10px)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <svg viewBox="0 0 24 24" style={{ width: 'clamp(12px,3vw,18px)', flexShrink: 0 }} fill="none">
          <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill={C_BLUE} opacity="0.85" />
          <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ color: C_TEXT, fontSize: 'clamp(5px,1.2vw,7px)', fontWeight: 700, lineHeight: 1.4 }}>
            Carte strictement personnelle et confidentielle
          </div>
          <div style={{ color: C_LABEL, fontSize: 'clamp(4px,0.9vw,6px)', fontWeight: 500, marginTop: '1px', lineHeight: 1.3 }}>
            En cas de perte ou vol, contactez le Ministère de la Santé.
          </div>
        </div>
        <svg viewBox="0 0 80 80" style={{ width: 'clamp(22px,5.5vw,36px)', flexShrink: 0 }} fill="none">
          <rect width="80" height="80" rx="4" fill="#F3F4F6" />
          <path d="M8 8H32V32H8V8ZM16 16H24V24H16V16Z" fill={C_TEXT} />
          <path d="M48 8H72V32H48V8ZM56 16H64V24H56V16Z" fill={C_TEXT} />
          <path d="M8 48H32V72H8V48ZM16 56H24V64H16V56Z" fill={C_TEXT} />
          <rect x="40" y="40" width="8" height="8" fill={C_TEXT} />
          <rect x="56" y="48" width="16" height="8" fill={C_TEXT} />
          <rect x="48" y="64" width="8" height="8" fill={C_TEXT} />
          <rect x="64" y="64" width="8" height="8" fill={C_TEXT} />
          <rect x="40" y="8" width="8" height="16" fill={C_TEXT} />
          <rect x="8" y="40" width="16" height="8" fill={C_TEXT} />
        </svg>
      </div>

      {/* Footer */}
      <div
        style={{
          background: C_BLUE,
          padding: 'clamp(5px,1.3vw,8px) clamp(14px,3.5vw,22px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo0.png"
          alt="Doctorek"
          style={{
            height: 'clamp(14px,3.5vw,22px)',
            width: 'auto',
            filter: 'brightness(0) invert(1)',
          }}
        />
        <div
          style={{
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: 'clamp(4px,0.95vw,6.5px)',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}
        >
          CARTE MÉDICALE NATIONALE - MA
        </div>
      </div>
    </div>
  )
}

// ── Composant Principal ──────────────────────────────────────────────────────

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
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `carte-nationale-doctorek-${carte.cardRef || 'doc'}.png`
      a.click()
      URL.revokeObjectURL(url)
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
