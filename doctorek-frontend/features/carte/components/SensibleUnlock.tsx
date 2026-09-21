'use client'

import { useState } from 'react'
import { requestCarteOtp, verifyCarteOtp, getCarteSensible } from '../api'
import type { CarteSensible } from '@/lib/types'

interface SensibleUnlockProps {
  readonly cardRef: string
  readonly onUnlocked: (sensible: CarteSensible, accessToken: string) => void
}

const C_BLUE = '#007DFF'
const C_NAVY = '#010C2D'
const C_BODY = '#465058'

/**
 * Déverrouille les informations sensibles de la carte : un code est envoyé au patient
 * (consentement), puis saisi ici. Rien de sensible n'est chargé avant validation serveur.
 */
export function SensibleUnlock({ cardRef, onUnlocked }: SensibleUnlockProps) {
  const [step, setStep] = useState<'idle' | 'sent'>('idle')
  const [masked, setMasked] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendCode() {
    setLoading(true)
    setError(null)
    try {
      const res = await requestCarteOtp(cardRef)
      setMasked(res.maskedDestination)
      setStep('sent')
    } catch {
      setError("Impossible d'envoyer le code. Réessayez dans un instant.")
    } finally {
      setLoading(false)
    }
  }

  async function unlock() {
    if (code.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      const grant = await verifyCarteOtp(cardRef, code)
      const sensible = await getCarteSensible(cardRef, grant.accessToken)
      onUnlocked(sensible, grant.accessToken)
    } catch {
      setError('Code invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="bg-white rounded-2xl px-5 py-5 sm:px-6 text-left"
      style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
    >
      <div
        className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
        style={{ background: `${C_BLUE}12` }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C_BLUE} strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="font-bold text-lg mb-1" style={{ color: C_NAVY }}>Dossier médical protégé</h2>

      {step === 'idle' ? (
        <>
          <p className="text-sm leading-relaxed mb-4" style={{ color: C_BODY }}>
            Traitements, antécédents et documents : demandez l&apos;accord du patient.
            Le code d&apos;accès sera envoyé à son adresse email.
          </p>
          <button
            type="button"
            onClick={sendCode}
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{ background: C_BLUE }}
          >
            {loading ? 'Envoi…' : 'Demander l’accès au dossier'}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm mb-4 max-w-xs mx-auto" style={{ color: C_BODY }}>
            Code envoyé à <span className="font-semibold" style={{ color: C_NAVY }}>{masked}</span>.
            Demandez-le au patient et saisissez-le ci-dessous.
          </p>
          <input
            aria-label="Code reçu par le patient"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="______"
            className="w-40 mx-auto block text-center text-xl font-bold tracking-[0.5em] rounded-xl px-3 py-2.5 mb-4 focus:outline-none"
            style={{ border: '1px solid #D5DCE5', color: C_NAVY }}
          />
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={sendCode}
              disabled={loading}
              className="text-sm font-semibold disabled:opacity-50"
              style={{ color: C_BODY }}
            >
              Renvoyer
            </button>
            <button
              type="button"
              onClick={unlock}
              disabled={loading || code.length !== 6}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40"
              style={{ background: C_BLUE }}
            >
              {loading ? 'Vérification…' : 'Débloquer'}
            </button>
          </div>
        </>
      )}

      {error && <p className="text-xs mt-4" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  )
}
