'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  getCarteByRef,
  getCarteDossier,
  carteOrdonnanceFichierUrl,
  carteDocumentDownloadUrl,
} from '@/features/carte/api'
import type { CarteDossier } from '@/features/carte/api'
import { SensibleUnlock } from '@/features/carte/components/SensibleUnlock'
import { ScanSummary } from '@/features/carte/components/ScanSummary'
import LogoLoader from '@/components/LogoLoader'
import { getPatientProfile } from '@/features/patient/api'
import { getRdvsPatient } from '@/features/agenda/api'
import { openProtectedFile } from '@/features/dossier/api'
import { getSession } from '@/lib/session'
import type { CartePublic, CarteSensible, PatientProfile, RendezVous } from '@/lib/types'

// ── Palette (matches home page) ──────────────────────────────────────────────
const C_BLUE    = '#007DFF'
const C_DARK    = '#00263C'
const C_NAVY    = '#010C2D'
const C_BODY    = '#465058'
const C_TEXT    = '#333333'
const C_BG      = '#F0F2F5'
const C_HAIRLINE = '#E2E8F0'   // filet institutionnel discret

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
// Flèche dessinée à la main (trait irrégulier façon marqueur) : marqueur de liste
// et de section, plus chaleureux qu'une puce.
function HandArrow({ className = 'w-5 h-3.5', color = C_BLUE }: { readonly className?: string; readonly color?: string }) {
  return (
    <svg className={`flex-shrink-0 ${className}`} viewBox="0 0 32 20" fill="none" aria-hidden="true">
      <path d="M2 11 C 9 9.5, 17 9, 27 10.2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M21.5 5.5 C 24.5 7.5, 26.5 9, 28 10.4 C 26 11.6, 23.8 13.6, 22 16.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SLabel({ children, className = 'mb-3' }: { readonly children: React.ReactNode; readonly className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <HandArrow className="w-5 h-3.5" color={C_BLUE} />
      <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: C_NAVY }}>
        {children}
      </p>
    </div>
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

// Surface unique de la page : une seule recette de carte (bord fin + ombre très douce)
// pour un rythme calme — la hiérarchie vient du contenu, pas de l'empilement d'effets.
function Card({ children, className = '' }: { readonly children: React.ReactNode; readonly className?: string }) {
  return (
    <section
      className={`bg-white rounded-2xl px-5 py-5 md:px-6 ${className}`}
      style={{ border: `1px solid ${C_HAIRLINE}`, boxShadow: '0 1px 2px rgba(1,12,45,0.04)' }}
    >
      {children}
    </section>
  )
}

// En-tête de carte : libellé + compteur aligné, évite de répéter la même ligne flex.
function CardHead({ label, count }: { readonly label: string; readonly count?: number }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <SLabel className="">{label}</SLabel>
      {count !== undefined && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full tabular-nums" style={{ background: `${C_BLUE}10`, color: C_BLUE }}>
          {count}
        </span>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl px-5 py-12 text-center" style={{ border: `1px solid ${C_HAIRLINE}` }}>
      <div className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${C_BLUE}10` }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C_BLUE} strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-medium" style={{ color: C_BODY }}>{message}</p>
    </div>
  )
}

// Icône compacte par onglet (cohérence stroke 2, style outline).
function TabIcon({ id }: { readonly id: TabId }) {
  const p: Record<TabId, string> = {
    alertes: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01',
    medical: 'M12 8v8m-4-4h8M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2z',
    antecedents: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    infos: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    rdv: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    ordonnances: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    documents: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={p[id]} />
    </svg>
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
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [dossier, setDossier] = useState<CarteDossier | null>(null)
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [rdvs, setRdvs] = useState<RendezVous[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('alertes')

  // Re-passage en chargement quand la ref change (pendant le rendu, pas dans l'effet).
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
        // Scan public : vital tout de suite. Profil + RDV seulement si connecté
        // (sinon 401 -> redirection login). Ordonnances/documents passent par l'OTP.
        if (data?.patientId && getSession()) {
          const [prof, appointments] = await Promise.allSettled([
            getPatientProfile(data.patientId),
            getRdvsPatient(data.patientId),
          ])
          setProfile(prof.status === 'fulfilled' ? prof.value : null)
          setRdvs(appointments.status === 'fulfilled' ? (appointments.value ?? []) : [])
        }
        setActiveTab('medical')
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
  const sortedRdvs = [...rdvs].sort(
    (a, b) => new Date(b.dateRdv).getTime() - new Date(a.dateRdv).getTime(),
  )

  // Champs sensibles : vides tant que l'OTP n'est pas validé
  const meds = sensible?.medicamentsActuels ?? []
  const antChir = sensible?.antecedentsChirurgicaux ?? []
  const vaccins = sensible?.vaccinations ?? []
  const antFam = sensible?.antecedentsFamiliaux ?? []
  const ordonnances = dossier?.ordonnances ?? []
  const documents = dossier?.documents ?? []

  // Déblocage OTP : révèle le sensible et charge le dossier (ordonnances + documents).
  async function handleUnlocked(s: CarteSensible, token: string) {
    setSensible(s)
    setAccessToken(token)
    try {
      setDossier(await getCarteDossier(ref, token))
    } catch {
      // le dossier peut être vide ou indisponible : on garde le sensible affiché
    }
  }

  const grantHeaders = accessToken ? { 'X-Carte-Access': accessToken } : undefined

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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: C_BG, fontFamily: 'var(--font-figtree), ui-sans-serif, system-ui, sans-serif' }}
    >
      <style>{`
        @keyframes dkRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .dk-rise { animation: dkRise .6s cubic-bezier(.16,1,.3,1) both; }
        .dk-row { transition: background-color .18s ease, transform .18s ease; }
        .dk-press { transition: transform .12s ease, box-shadow .18s ease; }
        .dk-press:active { transform: scale(.98); }
        /* Anneau de focus lisible sur fond clair comme sur pilule bleue (navigation clavier). */
        .dk-press:focus-visible { outline: 3px solid ${C_NAVY}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .dk-rise { animation: none; }
        }
      `}</style>

      <ScanSummary carte={carte} />
      {!sensible && <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6"><SensibleUnlock cardRef={carte.cardRef} onUnlocked={handleUnlocked} /></div>}
      {(sensible || profile) && <>
      {/* ── Barre d'onglets moderne (pilules scrollables, une seule rangée) ── */}
      <div className="sticky top-0 z-50 bg-white/85 backdrop-blur-md mt-5 md:mt-6" style={{ borderBottom: `1px solid ${C_HAIRLINE}` }}>
        <div className="max-w-3xl mx-auto px-3 md:px-8">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-2.5" role="tablist" aria-label="Sections de la carte">
            {tabs.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className="dk-press relative flex items-center gap-1.5 px-4 min-h-[44px] rounded-full text-[13px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer"
                  style={{
                    background: active ? C_BLUE : C_BG,
                    color: active ? '#FFFFFF' : C_BODY,
                    boxShadow: active ? '0 4px 12px -2px rgba(0,125,255,0.45)' : 'none',
                  }}
                >
                  <TabIcon id={tab.id} />
                  {tab.label}
                  {tab.dot && !active && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: tab.dot }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Contenu de l'onglet (ré-animé à chaque changement) ── */}
      <div key={activeTab} className="dk-rise flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-4 md:py-6">

        {/* ── ALERTES ── */}
        {activeTab === 'alertes' && (
          <div className="space-y-4">
            {carte.allergies.length > 0 ? (
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${C_HAIRLINE}`, boxShadow: '0 1px 2px rgba(1,12,45,0.04)' }}>
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
              <EmptyState message="Allergies non renseignées" />
            )}
          </div>
        )}

        {/* ── MÉDICAL ── */}
        {activeTab === 'medical' && (
          <div className="space-y-4">
            {/* Maladies chroniques : information publique (utile en urgence) */}
            <Card>
              <SLabel>Maladies chroniques</SLabel>
              {carte.maladiesChroniques.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {carte.maladiesChroniques.map((m) => <Tag key={m} color="#7C3AED">{m}</Tag>)}
                </div>
              ) : (
                <p className="text-xs" style={{ color: C_BODY }}>Non renseigné</p>
              )}
            </Card>

            {/* Médicaments : sensible, derrière OTP */}
            {sensible ? (
              <Card>
                <SLabel>Médicaments actuels</SLabel>
                {meds.length > 0 ? (
                  <div className="space-y-1.5">
                    {meds.map((m) => (
                      <div
                        key={`${m.nom}-${m.dosage}`}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                        style={{ background: C_BG }}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <HandArrow className="w-4 h-3" color={C_BLUE} />
                          <span className="text-xs font-semibold truncate" style={{ color: C_TEXT }}>{m.nom}</span>
                        </span>
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
                  <p className="text-xs" style={{ color: C_BODY }}>Non renseigné</p>
                )}
              </Card>
            ) : (
              null
            )}
          </div>
        )}

        {/* ── ANTÉCÉDENTS ── (sensible, derrière OTP) */}
        {activeTab === 'antecedents' && (
          <div className="space-y-4">

            {sensible && (antChir.length > 0 || vaccins.length > 0 || antFam.length > 0) && (
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <SLabel>Antécédents chirurgicaux</SLabel>
                    {antChir.length > 0 ? (
                      <div className="space-y-2.5">
                        {antChir.map((a) => (
                          <div key={a.description} className="flex items-start gap-2">
                            <HandArrow className="w-4 h-3 mt-1" color="#7C3AED" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-snug" style={{ color: C_TEXT }}>{a.description}</p>
                              {a.date && <p className="text-xs font-mono mt-0.5" style={{ color: `${C_BODY}80` }}>{a.date}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: C_BODY }}>Non renseigné</p>
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
                        <p className="text-xs" style={{ color: C_BODY }}>Non renseigné</p>
                      )}
                    </div>
                    <div>
                      <SLabel>Antécédents familiaux</SLabel>
                      {antFam.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {antFam.map((a) => <Tag key={a} color="#D97706">{a}</Tag>)}
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: C_BODY }}>Non renseigné</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}
            {sensible && antChir.length === 0 && vaccins.length === 0 && antFam.length === 0 && (
              <EmptyState message="Aucun antécédent renseigné" />
            )}
          </div>
        )}

        {/* ── INFOS ── */}
        {activeTab === 'infos' && (
          <div className="space-y-3">
            <Card>
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
            </Card>

            {/* Assurance : sensible, derrière OTP */}
            {sensible ? (
              (sensible.assuranceNom || sensible.assuranceNumero) && (
                <Card>
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
                </Card>
              )
            ) : (
              null
            )}

            {carte.contactsUrgence.length > 0 && (
              <Card>
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
              </Card>
            )}
          </div>
        )}

        {/* ── RDV ── */}
        {activeTab === 'rdv' && (
          <div>
            {sortedRdvs.length > 0 ? (
              <Card>
                <CardHead label="Rendez-vous" count={sortedRdvs.length} />
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
              </Card>
            ) : (
              <EmptyState message="Aucun rendez-vous enregistré" />
            )}
          </div>
        )}

        {/* ── ORDONNANCES ── (dossier, derrière OTP) */}
        {activeTab === 'ordonnances' && (
          <div>

            {sensible && ordonnances.length > 0 && (
              <Card>
                <CardHead label="Ordonnances" count={ordonnances.length} />
                <div className="space-y-3">
                  {ordonnances.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${C_HAIRLINE}` }}
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
                            onClick={() => openProtectedFile(carteOrdonnanceFichierUrl(carte.cardRef, ord.id), grantHeaders).catch(() => {})}
                            className="dk-press inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors hover:brightness-95 cursor-pointer"
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
              </Card>
            )}
            {sensible && ordonnances.length === 0 && (
              <EmptyState message="Aucune ordonnance enregistrée" />
            )}
          </div>
        )}

        {/* ── DOCUMENTS ── (dossier, derrière OTP) */}
        {activeTab === 'documents' && (
          <div>

            {sensible && documents.length > 0 && (
              <Card>
                <CardHead label="Documents médicaux" count={documents.length} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => openProtectedFile(carteDocumentDownloadUrl(carte.cardRef, doc.id), grantHeaders).catch(() => {})}
                      className="dk-press flex items-start gap-2.5 py-3 px-3 rounded-xl transition-colors hover:bg-gray-50 text-left cursor-pointer"
                      style={{ border: `1px solid ${C_HAIRLINE}` }}
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
              </Card>
            )}
            {sensible && documents.length === 0 && (
              <EmptyState message="Aucun document enregistré" />
            )}
          </div>
        )}

      </div>

      </>}
      <footer className="mx-auto mt-auto w-full max-w-3xl px-5 py-6 text-center text-xs leading-relaxed text-[#465058]">
        Doctorek · Fiche de partage médical
      </footer>

    </div>
  )
}
