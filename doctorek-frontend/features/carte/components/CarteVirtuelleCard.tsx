'use client'

import { useState } from 'react'
import { CarteVirtuelle, PatientProfile } from '@/lib/types'
import { getGoogleWalletSaveUrl } from '@/features/carte/api'
import QrCodeDisplay from './QrCodeDisplay'

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

// ── RECTO — inline SVG ──────────────────────────────────────────────────────

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
  const fullName =
    [firstName, lastName?.toUpperCase()].filter(Boolean).join(' ') ||
    'NOM ET PRÉNOM'

  const rawCin = profile?.numIdentite ?? ''
  const maskedCin =
    rawCin.length >= 3
      ? rawCin[0] + '*'.repeat(rawCin.length - 2) + rawCin[rawCin.length - 1]
      : rawCin || '-'

  const cnss = carte.assuranceNumero ?? '-'

  return (
    <svg
      viewBox="0 0 856 540"
      style={{ width: '100%', height: '100%', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Card rounded clip */}
        <clipPath id="card-clip-recto">
          <rect width="856" height="540" rx="28" />
        </clipPath>
        {/* Circular photo clip */}
        <clipPath id="photo-clip-recto">
          <circle cx="132" cy="292" r="82" />
        </clipPath>
        {/* Name text clip (prevents overflow into chip area) */}
        <clipPath id="name-clip-recto">
          <rect x="248" y="198" width="418" height="54" />
        </clipPath>
        {/* EMV chip gradient */}
        <linearGradient id="chip-grad-recto" x1="0" y1="0" x2="60" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E5C158" />
          <stop offset="0.5" stopColor="#FCEEAA" />
          <stop offset="1" stopColor="#C29B35" />
        </linearGradient>
        {/* Zellige background watermark */}
        <pattern id="zellige-recto" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0 L40 20 L20 40 L0 20 Z M10 10 L30 30 M30 10 L10 30" stroke="#0066FF" strokeWidth="0.5" fill="none" />
          <circle cx="20" cy="20" r="14" stroke="#0066FF" strokeWidth="0.3" fill="none" />
        </pattern>
      </defs>

      <g clipPath="url(#card-clip-recto)">
        {/* ── Background ── */}
        <rect width="856" height="540" fill="#FFFFFF" />
        <rect width="856" height="540" fill="url(#zellige-recto)" opacity="0.03" />

        {/* ── Top Moroccan stripe ── */}
        <rect x="0" y="0" width="428" height="7" fill={C_RED} />
        <rect x="428" y="0" width="428" height="7" fill={C_GREEN} />

        {/* ── HEADER ── */}
        {/* Left: Logo image */}
        <image
          href="/logo0.png"
          x="20"
          y="16"
          width="170"
          height="58"
          preserveAspectRatio="xMinYMid meet"
        />

        {/* Right: Arabic title + subtitle */}
        <text
          x="832"
          y="44"
          textAnchor="end"
          fontFamily="system-ui,-apple-system,sans-serif"
          fontSize="14"
          fontWeight="800"
          fill={C_TEXT}
        >
          المملكة المغربية
        </text>
        <text
          x="832"
          y="65"
          textAnchor="end"
          fontFamily="system-ui,-apple-system,sans-serif"
          fontSize="11"
          fontWeight="700"
          fill={C_BLUE}
          letterSpacing="0.5"
        >
          Carte Santé Virtuelle
        </text>

        {/* ── ECG separator ── */}
        <line x1="24" y1="96" x2="832" y2="96" stroke={C_BLUE} strokeWidth="0.6" opacity="0.15" />
        <path
          d="M24 96 L310 96 L326 96 L336 80 L346 112 L356 80 L366 96 L392 96 L832 96"
          stroke={C_BLUE}
          strokeWidth="1.5"
          opacity="0.45"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* ── BODY ── */}

        {/* Photo ring */}
        <circle cx="132" cy="292" r="90" fill="none" stroke={C_BLUE} strokeWidth="3" opacity="0.75" />

        {/* Photo or silhouette */}
        {profile?.photoUrl ? (
          <image
            href={profile.photoUrl}
            x="50"
            y="210"
            width="164"
            height="164"
            clipPath="url(#photo-clip-recto)"
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <g clipPath="url(#photo-clip-recto)">
            <circle cx="132" cy="292" r="82" fill={C_BLUE} />
            <circle cx="132" cy="264" r="29" fill="white" opacity="0.9" />
            <ellipse cx="132" cy="344" rx="44" ry="36" fill="white" opacity="0.9" />
          </g>
        )}

        {/* Patient name */}
        <g clipPath="url(#name-clip-recto)">
          <text
            x="248"
            y="236"
            fontFamily="system-ui,-apple-system,sans-serif"
            fontSize="22"
            fontWeight="900"
            fill={C_TEXT}
            letterSpacing="0.3"
          >
            {fullName}
          </text>
        </g>

        {/* CIN */}
        <text
          x="248"
          y="272"
          fontFamily="system-ui,-apple-system,sans-serif"
          fontSize="8"
          fontWeight="700"
          fill={C_LABEL}
          letterSpacing="2"
        >
          CIN
        </text>
        <text
          x="248"
          y="295"
          fontFamily="'Courier New',Courier,monospace"
          fontSize="17"
          fontWeight="800"
          fill={C_TEXT}
          letterSpacing="2"
        >
          {maskedCin}
        </text>
        <line x1="248" y1="307" x2="562" y2="307" stroke="#E5E7EB" strokeWidth="1" />

        {/* CNSS / AMO */}
        <text
          x="248"
          y="327"
          fontFamily="system-ui,-apple-system,sans-serif"
          fontSize="8"
          fontWeight="700"
          fill={C_LABEL}
          letterSpacing="2"
        >
          N° CNSS / AMO
        </text>
        <text
          x="248"
          y="350"
          fontFamily="'Courier New',Courier,monospace"
          fontSize="16"
          fontWeight="800"
          fill={C_TEXT}
          letterSpacing="1.5"
        >
          {cnss}
        </text>

        {/* EMV Chip */}
        <g transform="translate(694, 226)">
          <rect width="62" height="48" rx="8" fill="url(#chip-grad-recto)" />
          <line x1="19" y1="0" x2="19" y2="48" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          <line x1="43" y1="0" x2="43" y2="48" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          <line x1="0" y1="16" x2="62" y2="16" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          <line x1="0" y1="32" x2="62" y2="32" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          <rect x="19" y="16" width="24" height="16" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.8" />
          <circle cx="31" cy="24" r="3.5" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" fill="none" />
        </g>

        {/* QR Code — real generated code */}
        {qrUrl ? (
          <foreignObject x="682" y="290" width="84" height="84">
            <div style={{ width: 84, height: 84, borderRadius: 5, overflow: 'hidden' }}>
              <QrCodeDisplay value={qrUrl} size={84} />
            </div>
          </foreignObject>
        ) : (
          <g transform="translate(682, 290)">
            <rect width="84" height="84" rx="5" fill="#F3F4F6" />
            <rect x="8" y="8" width="24" height="24" rx="2" fill="none" stroke={C_TEXT} strokeWidth="2" />
            <rect x="14" y="14" width="12" height="12" fill={C_TEXT} />
            <rect x="52" y="8" width="24" height="24" rx="2" fill="none" stroke={C_TEXT} strokeWidth="2" />
            <rect x="58" y="14" width="12" height="12" fill={C_TEXT} />
            <rect x="8" y="52" width="24" height="24" rx="2" fill="none" stroke={C_TEXT} strokeWidth="2" />
            <rect x="14" y="58" width="12" height="12" fill={C_TEXT} />
            <rect x="42" y="44" width="8" height="8" fill={C_TEXT} />
            <rect x="58" y="52" width="16" height="8" fill={C_TEXT} />
            <rect x="50" y="68" width="8" height="8" fill={C_TEXT} />
            <rect x="66" y="68" width="8" height="8" fill={C_TEXT} />
            <rect x="42" y="10" width="8" height="16" fill={C_TEXT} />
            <rect x="10" y="42" width="16" height="8" fill={C_TEXT} />
          </g>
        )}

        {/* ── FOOTER ── */}
        <rect x="0" y="460" width="856" height="80" fill={C_BLUE} />

        {/* Footer: Logo white */}
        <image
          href="/logo0.png"
          x="24"
          y="472"
          width="120"
          height="38"
          preserveAspectRatio="xMinYMid meet"
          style={{ filter: 'brightness(0) invert(1)' }}
        />

        {/* Separator 1 */}
        <text x="158" y="500" fontFamily="system-ui,-apple-system,sans-serif" fontSize="18" fontWeight="300" fill="rgba(255,255,255,0.35)">|</text>

        {/* Website */}
        <text
          x="174"
          y="500"
          fontFamily="system-ui,-apple-system,sans-serif"
          fontSize="11"
          fontWeight="600"
          fill="rgba(255,255,255,0.85)"
          letterSpacing="0.5"
        >
          www.doctorek.ma
        </text>

        {/* Separator 2 */}
        <text x="334" y="500" fontFamily="system-ui,-apple-system,sans-serif" fontSize="18" fontWeight="300" fill="rgba(255,255,255,0.35)">|</text>

        {/* Phone icon */}
        <g
          transform="translate(352, 488)"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path d="M14 10.5v2a1.5 1.5 0 01-1.6 1.5 12 12 0 01-5.2-1.8 12 12 0 01-3.6-3.6A12 12 0 011.8 3.1 1.5 1.5 0 013.3 1.5h2a1.5 1.5 0 011.5 1.3c.1.7.3 1.4.5 2.1a1.5 1.5 0 01-.3 1.6L6.2 7.3A12 12 0 009.7 10.8l.8-.8a1.5 1.5 0 011.6-.3c.7.2 1.4.4 2.1.5A1.5 1.5 0 0114 10.5z" />
        </g>

        {/* Phone number */}
        <text
          x="376"
          y="500"
          fontFamily="system-ui,-apple-system,sans-serif"
          fontSize="11"
          fontWeight="600"
          fill="rgba(255,255,255,0.85)"
          letterSpacing="0.5"
        >
          080 100 2000
        </text>
      </g>
    </svg>
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
