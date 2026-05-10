'use client'

import { useState } from 'react'
import { CarteVirtuelle } from '@/lib/types'

// Couleurs du thème Doctorek (extraites de votre image)
const C_DOC_BLUE = '#0066FF' // Le bleu vif de votre site
const C_DOC_DARK = '#003B95' // Un bleu plus foncé pour le contraste
const C_BG_CARD  = '#FFFFFF' // Fond blanc pur étatique
const C_TEXT     = '#111827' // Texte principal (presque noir)
const C_LABEL    = '#6B7280' // Gris pour les libellés
const C_RED      = '#C1272D' // Rouge drapeau marocain
const C_GREEN    = '#006233' // Vert drapeau marocain
const C_GOLD     = '#D4AF37' // Or pour la puce

interface CarteVirtuelleCardProps {
  carte: CarteVirtuelle
  firstName?: string
  lastName?: string
  onEdit?: () => void
}

// ── ICONES & SVG OFFICIELS ────────────────────────────────────────────────────────

function CorrectMoroccanFlag({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.67)} viewBox="0 0 30 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <rect width="30" height="20" rx="2" fill={C_RED}/>
      <path d="M15 4 L18.5 14.8 L9.3 8.1 L20.7 8.1 L11.5 14.8 Z" stroke={C_GREEN} strokeWidth="1.2" strokeLinejoin="miter" fill="none"/>
    </svg>
  )
}

function EmvChip({ size }: { size: number }) {
  const h = Math.round(size * 0.8)
  return (
    <svg width={size} height={h} viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: `clamp(${size * 0.6}px, ${size * 0.15}vw, ${size}px)`, height: 'auto' }}>
      <rect width="40" height="32" rx="6" fill="url(#chipGradientState)"/>
      <defs>
        <linearGradient id="chipGradientState" x1="0" y1="0" x2="40" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E5C158"/>
          <stop offset="0.5" stopColor="#FCEEAA"/>
          <stop offset="1" stopColor="#C29B35"/>
        </linearGradient>
      </defs>
      {/* Lignes de contact de la puce */}
      <path d="M12 0V32 M28 0V32 M0 11H40 M0 21H40 M12 11H28V21H12Z" stroke="rgba(0,0,0,0.2)" strokeWidth="1"/>
      <circle cx="20" cy="16" r="3" stroke="rgba(0,0,0,0.1)" strokeWidth="1" fill="none"/>
    </svg>
  )
}

function ZelligeWatermark() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03, pointerEvents: 'none' }} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="state-zellige" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0 L40 20 L20 40 L0 20 Z M10 10 L30 30 M30 10 L10 30" stroke={C_DOC_BLUE} strokeWidth="0.5" fill="none"/>
          <circle cx="20" cy="20" r="14" stroke={C_DOC_BLUE} strokeWidth="0.3" fill="none"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#state-zellige)"/>
    </svg>
  )
}

function QrCodePlaceholder() {
  // Faux QR code pour le verso (donne un aspect très officiel)
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="4" fill="#F3F4F6"/>
      <path d="M10 10H40V40H10V10ZM20 20H30V30H20V20Z" fill={C_TEXT}/>
      <path d="M60 10H90V40H60V10ZM70 20H80V30H70V20Z" fill={C_TEXT}/>
      <path d="M10 60H40V90H10V60ZM20 70H30V80H20V70Z" fill={C_TEXT}/>
      <rect x="50" y="50" width="10" height="10" fill={C_TEXT}/>
      <rect x="70" y="60" width="20" height="10" fill={C_TEXT}/>
      <rect x="60" y="80" width="10" height="10" fill={C_TEXT}/>
      <rect x="80" y="80" width="10" height="10" fill={C_TEXT}/>
      <rect x="50" y="10" width="10" height="20" fill={C_TEXT}/>
      <rect x="10" y="50" width="20" height="10" fill={C_TEXT}/>
    </svg>
  )
}

function MrzLine({ firstName = "PATIENT", lastName = "DOCTOREK", docId = "VMC2026C6E480" }) {
  // Génère la zone de lecture optique (Machine Readable Zone)
  const line1 = `I<MAR${docId}<<<<<<<<<<<<<<<<<`
  const line2 = `${lastName.replace(/\s/g, '<')}<<${firstName.replace(/\s/g, '<')}<<<<<<<<<<<<<<<<<<`

  return (
    <div style={{
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: 'clamp(5px, 1.8vw, 9px)',
      lineHeight: 1.2,
      letterSpacing: '0.1em',
      color: C_TEXT,
      fontWeight: 600,
      textTransform: 'uppercase',
      opacity: 0.85
    }}>
      <div>{line1.substring(0, 30)}</div>
      <div>{line2.substring(0, 30)}</div>
    </div>
  )
}

// ── RECTO ──────────────────────────────────────────────────────────────────────

export function CarteRecto({ carte, firstName, lastName }: { carte: CarteVirtuelle; firstName?: string; lastName?: string }) {
  const nom = lastName?.toUpperCase() || '—'
  const prenom = firstName || '—'
  const expiryDate = new Date(); expiryDate.setFullYear(expiryDate.getFullYear() + 3)
  const expiry = expiryDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div style={{
      position: 'absolute', inset: 0,
      borderRadius: 'min(3vw, 12px)', overflow: 'hidden',
      background: C_BG_CARD,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0,0,0,0.1)',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
    }}>
      <ZelligeWatermark />

      {/* Liseré haut rouge/vert */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${C_RED} 0%, ${C_RED} 50%, ${C_GREEN} 50%, ${C_GREEN} 100%)` }} />

      {/* Header Étatique */}
      <div style={{ padding: 'clamp(10px, 3vw, 14px) clamp(14px, 4vw, 20px) 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: C_TEXT, fontSize: 'clamp(5px, 1.6vw, 8px)', fontWeight: 800, letterSpacing: '0.05em' }}>ROYAUME DU MAROC</div>
          <div style={{ color: C_LABEL, fontSize: 'clamp(4px, 1.2vw, 6px)', fontWeight: 600, marginTop: '1px' }}>MINISTÈRE DE LA SANTÉ</div>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ color: '#007DFF', fontSize: 'clamp(14px, 4vw, 22px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.01em', lineHeight: 1 }}>Doctorek</span>
        </div>

        <div style={{ flex: 1, textAlign: 'right', direction: 'rtl' }}>
          <div style={{ color: C_TEXT, fontSize: 'clamp(6px, 1.8vw, 9px)', fontWeight: 800 }}>المملكة المغربية</div>
          <div style={{ color: C_LABEL, fontSize: 'clamp(4px, 1.2vw, 6px)', fontWeight: 600, marginTop: '1px' }}>وزارة الصحة</div>
        </div>
      </div>

      {/* Titre central + caducée */}
      <div style={{ textAlign: 'center', marginTop: 'clamp(4px, 1.2vw, 8px)', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(4px, 1vw, 8px)' }}>
          <div style={{ height: '1px', flex: 1, background: `${C_DOC_BLUE}50`, marginLeft: 'clamp(14px, 4vw, 20px)' }} />
          <div style={{ color: C_DOC_BLUE, fontSize: 'clamp(7px, 2.2vw, 11px)', fontWeight: 900, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            CARTE MÉDICALE NATIONALE
          </div>
          <div style={{ height: '1px', flex: 1, background: `${C_DOC_BLUE}50`, marginRight: 'clamp(14px, 4vw, 20px)' }} />
        </div>
      </div>

      {/* Doctorek background copyright watermark */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: C_DOC_BLUE, fontSize: 'clamp(28px, 9vw, 56px)', fontWeight: 900, fontStyle: 'italic', opacity: 0.045, letterSpacing: '-0.02em', transform: 'rotate(-18deg)', whiteSpace: 'nowrap', userSelect: 'none' }}>
          Doctorek
        </span>
      </div>

      {/* Corps de la carte */}
      <div style={{ padding: 'clamp(8px, 2vw, 12px) clamp(14px, 4vw, 20px)', display: 'flex', gap: 'clamp(10px, 3vw, 16px)', position: 'relative', zIndex: 2 }}>

        {/* Colonne Photo */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: 'clamp(60px, 16vw, 80px)', height: 'clamp(80px, 21vw, 105px)',
            background: '#F3F4F6', borderRadius: '6px', border: '1.5px solid #D1D5DB',
            overflow: 'hidden'
          }}>
            {carte.photoUrl ? (
              <img src={carte.photoUrl} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            ) : (
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="#D1D5DB"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            )}
          </div>
        </div>

        {/* Colonne Informations (Disposition type CNI) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(5px, 1.2vw, 8px)', justifyContent: 'center' }}>
          <div>
            <div style={{ color: C_LABEL, fontSize: 'clamp(6px, 1.6vw, 8px)', fontWeight: 600 }}>
              Nom / النسب
            </div>
            <div style={{ color: C_TEXT, fontSize: 'clamp(11px, 3vw, 14px)', fontWeight: 800, lineHeight: 1.1 }}>{nom}</div>
          </div>

          <div>
            <div style={{ color: C_LABEL, fontSize: 'clamp(6px, 1.6vw, 8px)', fontWeight: 600 }}>
              Prénom / الاسم الشخصي
            </div>
            <div style={{ color: C_TEXT, fontSize: 'clamp(11px, 3vw, 14px)', fontWeight: 800, lineHeight: 1.1 }}>{prenom}</div>
          </div>

          <div style={{ display: 'flex', gap: 'clamp(10px, 3vw, 20px)' }}>
            <div>
              <div style={{ color: C_LABEL, fontSize: 'clamp(6px, 1.6vw, 8px)', fontWeight: 600 }}>Né(e) le / تاريخ الازدياد</div>
              <div style={{ color: C_TEXT, fontSize: 'clamp(9px, 2.4vw, 12px)', fontWeight: 700 }}>{carte.dateNaissance ?? '—'}</div>
            </div>
            <div>
              <div style={{ color: C_LABEL, fontSize: 'clamp(6px, 1.6vw, 8px)', fontWeight: 600 }}>N° Carte / رقم البطاقة</div>
              <div style={{ color: C_TEXT, fontSize: 'clamp(9px, 2.4vw, 12px)', fontWeight: 800 }}>{carte.cardRef ?? '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Doctorek */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(6px, 1.5vw, 10px) clamp(14px, 4vw, 20px)', background: '#F8FAFC', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
        <span style={{ color: '#007DFF', fontSize: 'clamp(7px, 2vw, 11px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.01em' }}>Doctorek</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: C_LABEL, fontSize: 'clamp(4px, 1.2vw, 6px)', fontWeight: 600, marginRight: '4px' }}>Valable jusqu'au:</span>
          <span style={{ color: C_TEXT, fontSize: 'clamp(6px, 1.8vw, 9px)', fontWeight: 800 }}>{expiry}</span>
        </div>
      </div>
    </div>
  )
}

// ── VERSO ──────────────────────────────────────────────────────────────────────

export function CarteVerso({
  carte,
  firstName,
  lastName,
  flat,
}: {
  carte: CarteVirtuelle
  firstName?: string
  lastName?: string
  flat?: boolean
}) {
  const nom = lastName?.toUpperCase() || '—'
  const prenom = firstName || '—'
  const createdYear = new Date().getFullYear()

  const bilingualRows = [
    { fr: 'Nom', ar: 'النسب',                      value: nom },
    { fr: 'Prénom', ar: 'الاسم الشخصي',             value: prenom },
    { fr: 'Date de naissance', ar: 'تاريخ الازدياد', value: carte.dateNaissance ?? '—' },
    { fr: 'C.I.N.', ar: 'ب.ت.و',                   value: carte.numIdentite ?? '—' },
    { fr: "Date d'immatriculation", ar: 'تاريخ التسجيل', value: `01/01/${createdYear}` },
  ]

  return (
    <div style={{
      position: 'absolute', inset: 0,
      borderRadius: 'min(3vw, 12px)', overflow: 'hidden',
      background: C_BG_CARD,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0,0,0,0.1)',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      display: 'flex', flexDirection: 'column',
      ...(flat ? {} : { transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }),
    }}>
      <ZelligeWatermark />

      {/* Doctorek background copyright watermark */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: C_DOC_BLUE, fontSize: 'clamp(28px, 9vw, 56px)', fontWeight: 900, fontStyle: 'italic', opacity: 0.045, letterSpacing: '-0.02em', transform: 'rotate(-18deg)', whiteSpace: 'nowrap', userSelect: 'none' }}>
          Doctorek
        </span>
      </div>

      {/* Liseré haut rouge/vert */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${C_RED} 0%, ${C_RED} 50%, ${C_GREEN} 50%, ${C_GREEN} 100%)` }} />

      {/* Header — logo gauche / N° immatriculation droite */}
      <div style={{ padding: 'clamp(10px, 3vw, 14px) clamp(14px, 4vw, 20px) clamp(6px, 1.5vw, 8px)', background: C_DOC_BLUE, position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Logo Doctorek */}
        <span style={{ color: '#FFFFFF', fontSize: 'clamp(10px, 2.8vw, 16px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.01em' }}>Doctorek</span>
        {/* N° immatriculation */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(4px, 1.1vw, 6px)', fontWeight: 600, letterSpacing: '0.05em' }}>
            N° D'IMMATRICULATION / رقم التسجيل
          </div>
          <div style={{ color: '#FFFFFF', fontSize: 'clamp(9px, 2.6vw, 13px)', fontWeight: 900, fontFamily: '"Courier New", Courier, monospace', letterSpacing: '0.08em', marginTop: '1px' }}>
            {carte.assuranceNumero ?? carte.cardRef ?? '—'}
          </div>
        </div>
      </div>

      {/* Corps : champs bilingues + notice */}
      <div style={{ flex: 1, padding: 'clamp(6px, 1.5vw, 10px) clamp(14px, 4vw, 20px)', position: 'relative', zIndex: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2px, 0.6vw, 4px)' }}>
          {bilingualRows.map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 'clamp(2px, 0.5vw, 3px)' }}>
              <span style={{ color: C_LABEL, fontSize: 'clamp(4px, 1.1vw, 6px)', fontWeight: 600, minWidth: 'clamp(50px, 13vw, 72px)', flexShrink: 0 }}>
                {row.fr}
              </span>
              <span style={{ color: C_TEXT, fontSize: 'clamp(7px, 2vw, 10px)', fontWeight: 800, flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px' }}>
                {row.value}
              </span>
              <span style={{ color: C_LABEL, fontSize: 'clamp(4px, 1.1vw, 6px)', fontWeight: 600, direction: 'rtl', textAlign: 'right', minWidth: 'clamp(50px, 13vw, 72px)', flexShrink: 0 }}>
                {row.ar}
              </span>
            </div>
          ))}
        </div>

        {/* Confidentiality notice + QR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 10px)', marginTop: 'clamp(3px, 0.8vw, 6px)', marginBottom: 'clamp(4px, 1.2vw, 8px)' }}>
          <div style={{ flex: 1, background: '#EEF4FF', border: `1px solid ${C_DOC_BLUE}22`, borderRadius: '5px', padding: 'clamp(3px, 0.7vw, 5px) clamp(5px, 1.2vw, 8px)', display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 6px)' }}>
            <svg viewBox="0 0 24 24" style={{ width: 'clamp(10px, 2.5vw, 14px)', flexShrink: 0 }} fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill={C_DOC_BLUE} opacity="0.9"/>
              <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <div style={{ color: C_TEXT, fontSize: 'clamp(4px, 1.05vw, 6px)', fontWeight: 700, lineHeight: 1.35 }}>
                Cette carte est strictement personnelle et confidentielle.
              </div>
              <div style={{ color: C_LABEL, fontSize: 'clamp(3.5px, 0.85vw, 5px)', fontWeight: 500, lineHeight: 1.3, marginTop: '1px' }}>
                En cas de perte ou de vol, contacter le Ministère de la Santé.
              </div>
            </div>
          </div>
          <div style={{ width: 'clamp(24px, 6.5vw, 42px)', height: 'clamp(24px, 6.5vw, 42px)', flexShrink: 0 }}>
            <QrCodePlaceholder />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#F8FAFC', borderTop: '1px solid #E5E7EB', padding: 'clamp(3px, 0.8vw, 5px) clamp(14px, 4vw, 20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <span style={{ color: C_DOC_BLUE, fontSize: 'clamp(7px, 2vw, 12px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
          Doctorek
        </span>
        <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: 'clamp(3.5px, 0.9vw, 6px)', color: C_LABEL, letterSpacing: '0.06em', fontWeight: 600 }}>
          CARTE MÉDICALE NATIONALE — MA
        </div>
      </div>
    </div>
  )
}

// ── Composant Principal et Menu ──────────────────────────────────────────────

export default function CarteVirtuelleCard({ carte, firstName, lastName, onEdit }: CarteVirtuelleCardProps) {
  const [downloading, setDownloading] = useState(false)
  const [flipped, setFlipped] = useState(false)

  const downloadPng = async () => {
    setDownloading(true)
    try {
      const response = await fetch('/api/carte/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carte, firstName, lastName }),
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
      alert('Erreur lors de l\'exportation de la carte. Veuillez réessayer.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Carte 3D flip */}
      <div
        style={{ width: '100%', aspectRatio: '1.586', position: 'relative', perspective: '1400px', cursor: 'pointer', filter: 'drop-shadow(0 20px 40px rgba(0,125,255,0.15))' }}
        onClick={() => setFlipped(f => !f)}
        title="Cliquer pour retourner la carte"
      >
        <div style={{
          position: 'absolute', inset: 0,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          <CarteRecto carte={carte} firstName={firstName} lastName={lastName} />
          <CarteVerso carte={carte} firstName={firstName} lastName={lastName} />
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
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

      {/* Trust badges */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1.5 bg-[#F0F7FF] rounded-xl py-3 px-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#007DFF]">
            <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[11px] font-semibold text-[#1863A9] text-center leading-tight">Reconnu partout</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 bg-[#F0FDF8] rounded-xl py-3 px-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#2EB67D]">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span className="text-[11px] font-semibold text-[#1a7a52] text-center leading-tight">Données sécurisées</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 bg-[#FFF8F0] rounded-xl py-3 px-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#ECB22E]">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[11px] font-semibold text-[#92600a] text-center leading-tight">Service Certifié</span>
        </div>
      </div>
    </div>
  )
}
