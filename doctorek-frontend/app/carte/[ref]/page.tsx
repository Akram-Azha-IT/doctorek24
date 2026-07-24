'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { getCarteByRef } from '@/features/carte/api'
import { SensibleUnlock } from '@/features/carte/components/SensibleUnlock'
import LogoLoader from '@/components/LogoLoader'
import { getPatientProfile } from '@/features/patient/api'
import { getRdvsPatient } from '@/features/agenda/api'
import { getOrdonnances, getDocuments, getDocumentDownloadUrl, getOrdonnanceFichierUrl, openProtectedFile } from '@/features/dossier/api'
import type { OrdonnanceDto, DocumentMedicalDto } from '@/features/dossier/api'
import type { CartePublic, CarteSensible, PatientProfile, RendezVous } from '@/lib/types'

// ── Palette (matches home page) ──────────────────────────────────────────────
// Horodatage au chargement du module — évite Date.now() pendant le rendu (règle purity).
const PAGE_LOADED_AT = Date.now()

const C_BLUE    = '#007DFF'
const C_DARK    = '#00263C'
const C_NAVY    = '#010C2D'
const C_BODY    = '#465058'
const C_TEXT    = '#333333'
const C_BG      = '#F0F2F5'
const C_HERO_BG = '#EBF4FF'
const C_RED     = '#C1272D'
const C_GREEN   = '#006233'

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
}

const STATUT_COLOR: Record<string, { bg: string; text: string }> = {
  EN_ATTENTE: { bg: '#FEF9C3', text: '#854D0E' },
  CONFIRME:   { bg: '#DCFCE7', text: '#166534' },
  ANNULE:     { bg: '#FEE2E2', text: '#991B1B' },
  TERMINE:    { bg: '#E0F2FE', text: '#0C4A6E' },
}

// ── Helper components ─────────────────────────────────────────────────────────
function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: C_BODY }}>
      {children}
    </p>
  )
}

function Tag({ children, color = C_BLUE }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border"
      style={{ background: `${color}12`, color, borderColor: `${color}25` }}
    >
      {children}
    </span>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C_BODY }}>{label}</p>
      <p className="text-sm font-semibold leading-snug" style={{ color: C_NAVY }}>{value}</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl px-5 py-12 text-center" style={{ border: '1px solid #E5E7EB' }}>
      <div className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${C_BLUE}10` }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C_BLUE} strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-medium" style={{ color: C_BODY }}>{message}</p>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
type TabId = 'alertes' | 'medical' | 'antecedents' | 'infos' | 'rdv' | 'ordonnances' | 'documents'

interface Tab {
  id: TabId
  label: string
  dot?: string
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CarteScanPage() {
  const params = useParams()
  const ref = params?.ref as string

  const [carte, setCarte] = useState<CartePublic | null>(null)
  const [sensible, setSensible] = useState<CarteSensible | null>(null)
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [rdvs, setRdvs] = useState<RendezVous[]>([])
  const [ordonnances, setOrdonnances] = useState<OrdonnanceDto[]>([])
  const [documents, setDocuments] = useState<DocumentMedicalDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('alertes')

  // Re-passage en chargement quand la ref change — pendant le rendu, pas dans l'effet.
  const [prevRef, setPrevRef] = useState(ref)
  if (prevRef !== ref) {
    setPrevRef(ref)
    setLoading(true)
  }

  useEffect(() => {
    if (!ref) return
    getCarteByRef(ref)
      .then(async (data) => {
        setCarte(data)
        if (data?.patientId) {
          const [prof, appointments, ords, docs] = await Promise.allSettled([
            getPatientProfile(data.patientId),
            getRdvsPatient(data.patientId),
            getOrdonnances(data.patientId),
            getDocuments(data.patientId),
          ])
          setProfile(prof.status === 'fulfilled' ? prof.value : null)
          setRdvs(appointments.status === 'fulfilled' ? (appointments.value ?? []) : [])
          setOrdonnances(ords.status === 'fulfilled' ? (ords.value ?? []) : [])
          setDocuments(docs.status === 'fulfilled' ? (docs.value ?? []) : [])
        }
        if (data?.allergies?.length === 0) setActiveTab('medical')
      })
      .catch(() => setError('Carte introuvable ou accès refusé.'))
      .finally(() => setLoading(false))
  }, [ref])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C_BG }}>
        <LogoLoader label="Chargement…" />
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !carte) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C_BG }}>
        <div className="bg-white rounded-2xl p-10 max-w-xs mx-4 text-center" style={{ boxShadow: '0 4px 28px rgba(0,0,0,0.08)' }}>
          <div className="w-11 h-11 rounded-xl mx-auto mb-4 flex items-center justify-center bg-red-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2" />
              <path d="M12 8v4m0 4h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="font-bold text-base mb-1" style={{ color: C_NAVY }}>Carte introuvable</h2>
          <p className="text-sm" style={{ color: C_BODY }}>{error ?? 'QR code invalide ou carte désactivée.'}</p>
        </div>
      </div>
    )
  }

  // ── Computed values ────────────────────────────────────────────────────────
  const fullName = [carte.firstName, carte.lastName?.toUpperCase()].filter(Boolean).join(' ') || '-'
  const age = profile?.dateNaissance
    ? Math.floor((PAGE_LOADED_AT - new Date(profile.dateNaissance).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null
  const bmi =
    carte.tailleCm && carte.poidsKg
      ? (carte.poidsKg / Math.pow(carte.tailleCm / 100, 2)).toFixed(1)
      : null
  const sortedRdvs = [...rdvs].sort(
    (a, b) => new Date(b.dateRdv).getTime() - new Date(a.dateRdv).getTime(),
  )

  // Champs sensibles : vides tant que l'OTP n'est pas validé
  const meds = sensible?.medicamentsActuels ?? []
  const antChir = sensible?.antecedentsChirurgicaux ?? []
  const vaccins = sensible?.vaccinations ?? []
  const antFam = sensible?.antecedentsFamiliaux ?? []

  const tabs: Tab[] = [
    { id: 'alertes',     label: 'Alertes',      dot: carte.allergies.length > 0 ? '#DC2626' : undefined },
    { id: 'medical',     label: 'Médical' },
    { id: 'antecedents', label: 'Antécédents' },
    { id: 'infos',       label: 'Infos' },
    { id: 'rdv',         label: 'RDV',          dot: rdvs.length > 0 ? C_BLUE : undefined },
    { id: 'ordonnances', label: 'Ordonnances',  dot: ordonnances.length > 0 ? C_BLUE : undefined },
    { id: 'documents',   label: 'Documents',    dot: documents.length > 0 ? C_BLUE : undefined },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: C_BG }}>

      {/* ── Header ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: C_HERO_BG, boxShadow: '0 4px 24px rgba(0,125,255,0.08)' }}
      >
        {/* Morocco stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${C_RED} 50%, ${C_GREEN} 50%)` }}
        />

        {/* Dot-grid texture — matches home page */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${C_BLUE} 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Organic blob — matches home page */}
        <div
          className="absolute hidden md:block pointer-events-none select-none"
          style={{
            right: '60px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '300px',
            height: '320px',
            background: 'linear-gradient(145deg, #B6DAF7 0%, #DFEFFE 100%)',
            borderRadius: '62% 38% 54% 46% / 55% 48% 52% 45%',
            opacity: 0.55,
          }}
        />

        {/* Decorative curves — matches home page */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
          <svg className="absolute left-0 top-1/2 -translate-y-1/2 opacity-[0.06]" width="140" height="180" viewBox="0 0 140 180" fill="none">
            <path d="M-10 60 Q30 20 70 55 Q110 90 130 40"  stroke={C_BLUE} strokeWidth="3"   strokeLinecap="round" />
            <path d="M-5  95 Q40 72 80  95 Q120 118 132 78" stroke={C_BLUE} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M5  130 Q45 118 90 128 Q125 138 136 116" stroke={C_BLUE} strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          {/* Watermark */}
          <svg className="absolute right-0 bottom-0 opacity-[0.035]" width="480" height="130" viewBox="0 0 480 130">
            <text
              x="10" y="108"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize="106"
              fontWeight="bold"
              fontStyle="italic"
              fill={C_BLUE}
              letterSpacing="-4"
            >
              Doctorek
            </text>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 md:px-8 pt-6 md:pt-8 pb-5 md:pb-6 max-w-5xl mx-auto">
          {/* Brand bar */}
          <div className="flex items-center gap-2.5 mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo0.png" alt="Doctorek" className="h-5 md:h-6 w-auto" />
            <div className="h-3.5 w-px" style={{ background: `${C_BLUE}35` }} />
            <span
              className="text-[10px] font-bold tracking-[0.2em] uppercase"
              style={{ color: `${C_BLUE}90` }}
            >
              Dossier Médical
            </span>
          </div>

          {/* Identity row — on mobile: avatar + name side by side, stats below */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  background: `${C_BLUE}12`,
                  border: `2px solid ${C_BLUE}25`,
                }}
              >
                {profile?.photoUrl ? (
                  <Image
                    src={profile.photoUrl}
                    alt={fullName}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" fill={C_BLUE} opacity="0.65" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill={C_BLUE} opacity="0.65" />
                  </svg>
                )}
              </div>

              {/* Name + details */}
              <div className="flex-1 min-w-0">
                <h1
                  className="font-bold text-xl md:text-2xl leading-tight tracking-tight"
                  style={{ color: C_NAVY }}
                >
                  {fullName}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: C_BODY }}>
                  {[age ? `${age} ans` : null, profile?.dateNaissance].filter(Boolean).join(' · ')}
                </p>
                {profile?.numIdentite && (
                  <p className="text-xs font-mono mt-0.5 tracking-wider" style={{ color: `${C_BODY}80` }}>
                    CIN {profile.numIdentite}
                  </p>
                )}
              </div>
            </div>

            {/* Badges + physical stats row */}
            <div className="flex flex-wrap items-center gap-2">
              {carte.groupeSanguin && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
                  style={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6 10 4 14 4 17a8 8 0 0016 0c0-3-2-7-8-15z" />
                  </svg>
                  {carte.groupeSanguin}
                </span>
              )}
              {carte.donneurOrganes && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                  style={{ background: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' }}
                >
                  Donneur d&apos;organes
                </span>
              )}

              {/* Physical stats inline on mobile */}
              {(carte.tailleCm || carte.poidsKg) && (
                <div className="flex gap-1.5 ml-auto md:ml-0">
                  {carte.tailleCm && (
                    <div
                      className="rounded-xl px-3 py-1.5 text-center bg-white"
                      style={{ border: `1px solid ${C_BLUE}20`, boxShadow: '0 1px 6px rgba(0,125,255,0.07)' }}
                    >
                      <div className="font-bold text-sm leading-none" style={{ color: C_NAVY }}>
                        {carte.tailleCm}
                        <span className="text-[10px] font-semibold" style={{ color: C_BODY }}> cm</span>
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: `${C_BODY}80` }}>Taille</div>
                    </div>
                  )}
                  {carte.poidsKg && (
                    <div
                      className="rounded-xl px-3 py-1.5 text-center bg-white"
                      style={{ border: `1px solid ${C_BLUE}20`, boxShadow: '0 1px 6px rgba(0,125,255,0.07)' }}
                    >
                      <div className="font-bold text-sm leading-none" style={{ color: C_NAVY }}>
                        {carte.poidsKg}
                        <span className="text-[10px] font-semibold" style={{ color: C_BODY }}> kg</span>
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: `${C_BODY}80` }}>Poids</div>
                    </div>
                  )}
                  {bmi && (
                    <div
                      className="rounded-xl px-3 py-1.5 text-center bg-white"
                      style={{ border: `1px solid ${C_BLUE}20`, boxShadow: '0 1px 6px rgba(0,125,255,0.07)' }}
                    >
                      <div className="font-bold text-sm leading-none" style={{ color: C_NAVY }}>{bmi}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: `${C_BODY}80` }}>IMC</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Tab bar ── */}
      <div
        className="sticky top-0 z-50 bg-white"
        style={{ borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
      >
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          {/* Mobile: 2-row grid, same underline style as desktop */}
          <div className="md:hidden">
            <div className="grid grid-cols-4 border-b" style={{ borderColor: '#E5E7EB' }}>
              {tabs.slice(0, 4).map((tab) => {
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors border-b-2 -mb-px"
                    style={{
                      color: active ? C_BLUE : C_BODY,
                      borderBottomColor: active ? C_BLUE : 'transparent',
                    }}
                  >
                    {tab.dot && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tab.dot }} />
                    )}
                    {tab.label}
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-3 border-b" style={{ borderColor: '#E5E7EB' }}>
              {tabs.slice(4).map((tab) => {
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors border-b-2 -mb-px"
                    style={{
                      color: active ? C_BLUE : C_BODY,
                      borderBottomColor: active ? C_BLUE : 'transparent',
                    }}
                  >
                    {tab.dot && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tab.dot }} />
                    )}
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Desktop: classic underline tab bar */}
          <div className="hidden md:flex overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 border-b-2"
                  style={{
                    color: active ? C_BLUE : C_BODY,
                    borderBottomColor: active ? C_BLUE : 'transparent',
                  }}
                >
                  {tab.dot && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: active ? tab.dot : `${tab.dot}80` }}
                    />
                  )}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-4 md:py-6">

        {/* ── ALERTES ── */}
        {activeTab === 'alertes' && (
          <div className="space-y-4">
            {carte.allergies.length > 0 ? (
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div
                  className="px-5 py-3 flex items-center gap-2.5"
                  style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#DC2626" strokeWidth="2" fill="#FEE2E2" />
                    <path d="M12 9v4m0 4h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#DC2626' }}>
                    Allergies connues
                  </span>
                  <span
                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: '#FEE2E2', color: '#DC2626' }}
                  >
                    {carte.allergies.length}
                  </span>
                </div>
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {carte.allergies.map((a, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState message="Aucune allergie connue" />
            )}
          </div>
        )}

        {/* ── MÉDICAL ── */}
        {activeTab === 'medical' && (
          <div className="space-y-4">
            {/* Maladies chroniques : information publique (utile en urgence) */}
            <div
              className="bg-white rounded-2xl px-6 py-5"
              style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
            >
              <SLabel>Maladies chroniques</SLabel>
              {carte.maladiesChroniques.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {carte.maladiesChroniques.map((m) => <Tag key={m} color="#7C3AED">{m}</Tag>)}
                </div>
              ) : (
                <p className="text-xs" style={{ color: C_BODY }}>Aucune</p>
              )}
            </div>

            {/* Médicaments : sensible, derrière OTP */}
            {sensible ? (
              <div
                className="bg-white rounded-2xl px-6 py-5"
                style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
              >
                <SLabel>Médicaments actuels</SLabel>
                {meds.length > 0 ? (
                  <div className="space-y-1.5">
                    {meds.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                        style={{ background: C_BG }}
                      >
                        <span className="text-xs font-semibold truncate" style={{ color: C_TEXT }}>{m.nom}</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                          style={{ background: `${C_BLUE}12`, color: C_BLUE }}
                        >
                          {m.dosage}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: C_BODY }}>Aucun</p>
                )}
              </div>
            ) : (
              <SensibleUnlock cardRef={carte.cardRef} onUnlocked={setSensible} />
            )}
          </div>
        )}

        {/* ── ANTÉCÉDENTS ── (sensible, derrière OTP) */}
        {activeTab === 'antecedents' && (
          <div className="space-y-4">
            {!sensible && <SensibleUnlock cardRef={carte.cardRef} onUnlocked={setSensible} />}
            {sensible && (antChir.length > 0 || vaccins.length > 0 || antFam.length > 0) && (
              <div
                className="bg-white rounded-2xl px-6 py-5"
                style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <SLabel>Antécédents chirurgicaux</SLabel>
                    {antChir.length > 0 ? (
                      <div className="space-y-2.5">
                        {antChir.map((a, i) => (
                          <div key={i}>
                            <p className="text-sm font-medium leading-snug" style={{ color: C_TEXT }}>{a.description}</p>
                            {a.date && <p className="text-xs font-mono mt-0.5" style={{ color: `${C_BODY}80` }}>{a.date}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: C_BODY }}>Aucun</p>
                    )}
                  </div>
                  <div className="space-y-5">
                    <div>
                      <SLabel>Vaccinations</SLabel>
                      {vaccins.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {vaccins.map((v) => <Tag key={v} color="#059669">{v}</Tag>)}
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: C_BODY }}>Aucune</p>
                      )}
                    </div>
                    <div>
                      <SLabel>Antécédents familiaux</SLabel>
                      {antFam.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {antFam.map((a) => <Tag key={a} color="#D97706">{a}</Tag>)}
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: C_BODY }}>Aucun</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {sensible && antChir.length === 0 && vaccins.length === 0 && antFam.length === 0 && (
              <EmptyState message="Aucun antécédent renseigné" />
            )}
          </div>
        )}

        {/* ── INFOS ── */}
        {activeTab === 'infos' && (
          <div className="space-y-3">
            <div
              className="bg-white rounded-2xl px-6 py-5"
              style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
            >
              <SLabel>Informations personnelles</SLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Genre"      value={profile?.genre} />
                <Field label="Nationalité" value={profile?.nationalite} />
                <Field label="Téléphone"  value={profile?.telephone} />
                <Field
                  label="Adresse"
                  value={[profile?.adresseRue, profile?.adresseVille, profile?.adressePays].filter(Boolean).join(', ') || null}
                />
              </div>
            </div>

            {/* Assurance : sensible, derrière OTP */}
            {sensible ? (
              (sensible.assuranceNom || sensible.assuranceNumero) && (
                <div
                  className="bg-white rounded-2xl px-6 py-5"
                  style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                >
                  <SLabel>Assurance</SLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <Field label="Organisme"  value={sensible.assuranceNom} />
                    <Field label="N° adhérent" value={sensible.assuranceNumero} />
                    {sensible.assuranceDetails && (
                      <div className="col-span-2">
                        <Field label="Détails" value={sensible.assuranceDetails} />
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <SensibleUnlock cardRef={carte.cardRef} onUnlocked={setSensible} />
            )}

            {carte.contactsUrgence.length > 0 && (
              <div
                className="bg-white rounded-2xl px-6 py-5"
                style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
              >
                <SLabel>Contacts d&apos;urgence</SLabel>
                <div className="space-y-2">
                  {carte.contactsUrgence.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-4 rounded-xl" style={{ background: '#FFFBEB' }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#92400E' }}>{c.nom}</p>
                        <p className="text-xs" style={{ color: '#B45309' }}>{c.lien}</p>
                      </div>
                      <a
                        href={`tel:${c.telephone}`}
                        className="text-sm font-mono font-bold underline"
                        style={{ color: '#92400E' }}
                      >
                        {c.telephone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RDV ── */}
        {activeTab === 'rdv' && (
          <div>
            {sortedRdvs.length > 0 ? (
              <div
                className="bg-white rounded-2xl px-6 py-5"
                style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <SLabel>Rendez-vous</SLabel>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${C_BLUE}10`, color: C_BLUE }}
                  >
                    {sortedRdvs.length}
                  </span>
                </div>
                <div className="space-y-0">
                  {sortedRdvs.map((rdv) => {
                    const colors = STATUT_COLOR[rdv.statut] ?? { bg: '#F3F4F6', text: '#374151' }
                    return (
                      <div
                        key={rdv.id}
                        className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 border-b last:border-0"
                        style={{ borderColor: '#F3F4F6' }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold" style={{ color: C_TEXT }}>{rdv.dateRdv}</span>
                            <span className="text-xs" style={{ color: C_BODY }}>à {rdv.heureRdv}</span>
                          </div>
                          {rdv.motif && (
                            <p className="text-xs truncate mt-0.5" style={{ color: `${C_BODY}80` }}>{rdv.motif}</p>
                          )}
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {STATUT_LABEL[rdv.statut] ?? rdv.statut}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <EmptyState message="Aucun rendez-vous enregistré" />
            )}
          </div>
        )}

        {/* ── ORDONNANCES ── */}
        {activeTab === 'ordonnances' && (
          <div>
            {ordonnances.length > 0 ? (
              <div
                className="bg-white rounded-2xl px-6 py-5"
                style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <SLabel>Ordonnances</SLabel>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${C_BLUE}10`, color: C_BLUE }}
                  >
                    {ordonnances.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {ordonnances.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid #E5E7EB' }}
                    >
                      <div
                        className="flex items-center justify-between px-4 py-2.5"
                        style={{ background: C_BG, borderBottom: '1px solid #E5E7EB' }}
                      >
                        <span className="text-xs font-semibold" style={{ color: C_BODY }}>
                          {new Date(ord.dateEmission).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {ord.medicaments.length > 0 && (
                          <span className="text-xs font-bold" style={{ color: C_BLUE }}>
                            {ord.medicaments.length} médicament{ord.medicaments.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {ord.medicaments.length > 0 && (
                        <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                          {ord.medicaments.map((med, i) => (
                            <div key={i} className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-sm font-bold truncate" style={{ color: C_DARK }}>{med.nom}</span>
                                <span
                                  className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ background: `${C_BLUE}10`, color: C_BLUE }}
                                >
                                  {med.dosage}
                                </span>
                              </div>
                              <p className="text-xs" style={{ color: `${C_BODY}80` }}>{med.frequence} · {med.duree}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {ord.fichierNom && (
                        <div className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openProtectedFile(getOrdonnanceFichierUrl(ord.id)).catch(() => {})}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                            style={{ background: `${C_BLUE}10`, color: C_BLUE }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {ord.fichierNom}
                          </button>
                        </div>
                      )}
                      {ord.notes && (
                        <div
                          className="px-4 py-2.5"
                          style={{ background: C_BG, borderTop: '1px solid #E5E7EB' }}
                        >
                          <p className="text-xs italic" style={{ color: C_BODY }}>{ord.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState message="Aucune ordonnance enregistrée" />
            )}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <div>
            {documents.length > 0 ? (
              <div
                className="bg-white rounded-2xl px-6 py-5"
                style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <SLabel>Documents médicaux</SLabel>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${C_BLUE}10`, color: C_BLUE }}
                  >
                    {documents.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => openProtectedFile(getDocumentDownloadUrl(doc.patientId, doc.id)).catch(() => {})}
                      className="flex items-start gap-2.5 py-2.5 px-3 rounded-xl transition-colors hover:bg-gray-50 text-left"
                      style={{ border: '1px solid #E5E7EB' }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${C_BLUE}10` }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C_BLUE} strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate leading-snug" style={{ color: C_TEXT }}>{doc.nom}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: `${C_BODY}80` }}>
                          {doc.typeDoc}{doc.taille ? ` · ${(doc.taille / 1024).toFixed(0)} Ko` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState message="Aucun document enregistré" />
            )}
          </div>
        )}

      </div>

      {/* ── Footer ── */}
      <div className="max-w-5xl mx-auto w-full px-4 md:px-8 pb-5 md:pb-6">
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{ background: C_DARK }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo0.png" alt="Doctorek" className="h-5 w-auto brightness-0 invert" />
          <div className="text-right">
            <p className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{carte.cardRef}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Confidentiel</p>
          </div>
        </div>
      </div>

    </div>
  )
}
