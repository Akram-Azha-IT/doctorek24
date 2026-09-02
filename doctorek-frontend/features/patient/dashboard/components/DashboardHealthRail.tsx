'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  ExternalLink,
  WalletCards,
} from 'lucide-react'
import { CarteRecto } from '@/features/carte/components/CarteVirtuelleCard'
import { getGoogleWalletSaveUrl } from '@/features/carte/api'
import type { CarteVirtuelle, PatientProfile } from '@/lib/types'

interface DashboardHealthRailProps {
  carte: CarteVirtuelle | null | undefined
  carteLoading: boolean
  profile: PatientProfile | null | undefined
  firstName: string | null
  lastName: string | null
}

function maskedReference(reference: string): string {
  const suffix = reference.slice(-4)
  return `•••• •••• ${suffix}`
}

export function DashboardHealthRail({
  carte,
  carteLoading,
  profile,
  firstName,
  lastName,
}: DashboardHealthRailProps) {
  const [addingToWallet, setAddingToWallet] = useState(false)

  const medicalFields = [
    {
      label: 'Groupe sanguin',
      value: carte?.groupeSanguin ?? 'À renseigner',
      complete: Boolean(carte?.groupeSanguin),
    },
    {
      label: 'Allergies',
      value: carte ? (carte.allergies.length > 0 ? `${carte.allergies.length} renseignée${carte.allergies.length > 1 ? 's' : ''}` : 'Aucune') : 'À renseigner',
      complete: Boolean(carte),
    },
    {
      label: 'Taille',
      value: carte?.tailleCm ? `${carte.tailleCm} cm` : 'À renseigner',
      complete: Boolean(carte?.tailleCm),
    },
    {
      label: 'Poids',
      value: carte?.poidsKg ? `${carte.poidsKg} kg` : 'À renseigner',
      complete: Boolean(carte?.poidsKg),
    },
  ]
  const completedCount = medicalFields.filter((field) => field.complete).length
  const completion = Math.round((completedCount / medicalFields.length) * 100)
  const qrUrl = carte?.cardRef
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://doctorek.ma'}/carte/${carte.cardRef}`
    : undefined

  async function addToGoogleWallet() {
    if (!carte || addingToWallet) return

    const walletWindow = window.open('about:blank', '_blank')
    if (!walletWindow) {
      alert("Autorisez les fenêtres pop-up pour ouvrir Google Wallet dans un nouvel onglet.")
      return
    }

    walletWindow.opener = null
    setAddingToWallet(true)
    try {
      const { saveUrl } = await getGoogleWalletSaveUrl(carte.patientId)
      walletWindow.location.replace(saveUrl)
    } catch {
      walletWindow.close()
      alert("Impossible d'ouvrir Google Wallet. Veuillez réessayer.")
    } finally {
      setAddingToWallet(false)
    }
  }

  return (
    <aside className="space-y-5">
      <section className="rounded-[22px] border border-[#DCE7F3] bg-white p-5 shadow-[0_10px_32px_rgba(0,38,60,0.06)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#60758B]">Accès sécurisé</p>
            <h2 className="mt-1 text-base font-bold text-[#010C2D]">Ma carte médicale</h2>
          </div>
          {carte && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#208A62]">
              <span className="h-2 w-2 rounded-full bg-[#2EB67D]" />
              Active
            </span>
          )}
        </div>

        {carteLoading ? (
          <div className="aspect-[1.586] animate-pulse rounded-2xl bg-[#EDF3F8]" />
        ) : carte ? (
          <>
            <div className="overflow-hidden rounded-2xl border border-[#C8D9E9] bg-[#F8FBFF] shadow-[0_12px_28px_rgba(0,38,60,0.10)]">
              <div className="aspect-[1.586] w-full">
                <CarteRecto
                  carte={carte}
                  profile={profile}
                  firstName={firstName ?? undefined}
                  lastName={lastName ?? undefined}
                  qrUrl={qrUrl}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#61758A]">
              <span>N° de carte</span>
              <span className="font-semibold tabular-nums text-[#20364D]">{maskedReference(carte.cardRef)}</span>
            </div>
            <Link
              href="/dashboard/patient/carte"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#007DFF] px-4 text-sm font-bold text-white transition-colors hover:bg-[#006EDC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2"
            >
              Ouvrir la carte
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={addToGoogleWallet}
              disabled={addingToWallet}
              className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#B7C9DB] bg-white px-4 text-sm font-bold text-[#17324D] transition-colors hover:border-[#007DFF] hover:bg-[#F3F8FE] disabled:cursor-wait disabled:opacity-60"
            >
              <WalletCards className="h-4 w-4 text-[#007DFF]" aria-hidden="true" />
              {addingToWallet ? 'Ouverture…' : 'Ajouter à Google Wallet'}
            </button>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#BFD1E3] bg-[#F8FBFE] p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F4FF] text-[#007DFF]">
              <CreditCard className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-3 font-bold text-[#010C2D]">Votre carte n&apos;est pas encore créée</p>
            <p className="mt-1 text-sm leading-5 text-[#61758A]">Gardez vos informations de santé accessibles en cas de besoin.</p>
            <Link
              href="/dashboard/patient/carte"
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#007DFF] px-4 text-sm font-bold text-white hover:bg-[#006EDC]"
            >
              Créer ma carte
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-[22px] border border-[#DCE7F3] bg-white p-5 shadow-[0_8px_28px_rgba(0,38,60,0.05)]">
        <h2 className="text-base font-bold text-[#010C2D]">Mon profil médical</h2>
        <div className="mt-4 flex items-center gap-4">
          <div
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(#2EB67D ${completion * 3.6}deg, #E5EDF5 0deg)` }}
            role="img"
            aria-label={`Profil médical complété à ${completion} %`}
          >
            <span className="absolute inset-[5px] rounded-full bg-white" />
            <span className="relative text-sm font-bold tabular-nums text-[#010C2D]">{completion}%</span>
          </div>
          <div>
            <p className="font-semibold text-[#010C2D]">
              {completion === 100 ? 'Profil complet' : 'Quelques informations manquent'}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#61758A]">
              Des données à jour facilitent votre prise en charge.
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-[#E7EEF5] border-y border-[#E7EEF5]">
          {medicalFields.map((field) => (
            <div key={field.label} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="flex items-center gap-2 text-[#52667B]">
                {field.complete ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2EB67D]" aria-hidden="true" />
                ) : (
                  <CircleAlert className="h-4 w-4 shrink-0 text-[#D98C18]" aria-hidden="true" />
                )}
                {field.label}
              </span>
              <span className={`text-right text-xs font-semibold ${field.complete ? 'text-[#20364D]' : 'text-[#B06B0C]'}`}>
                {field.value}
              </span>
            </div>
          ))}
        </div>

        {completion < 100 && (
          <Link
            href="/dashboard/patient/carte"
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#B7C9DB] text-sm font-bold text-[#005FBE] transition-colors hover:border-[#007DFF] hover:bg-[#F3F8FE]"
          >
            Compléter mon profil
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </section>
    </aside>
  )
}
