import { HeartPulse, Phone, ShieldCheck, UserRound } from 'lucide-react'
import type { CartePublic } from '@/lib/types'

const surface = 'rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6'

/** Only displays the existing public scan payload; never fetches protected fields. */
export function ScanSummary({ carte }: { carte: CartePublic }) {
  const name = [carte.firstName, carte.lastName].filter(Boolean).join(' ') || 'Titulaire de la carte'
  const updated = new Date(carte.updatedAt)
  const date = Number.isNaN(updated.getTime()) ? null : updated.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Casablanca' })
  return <>
    <header className="border-b border-[#E2E8F0] bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo0.png" alt="Doctorek" className="h-7 w-auto" />
        <span className="text-xs font-semibold text-[#465058]">Fiche médicale</span>
      </div>
    </header>
    <main id="main-content" className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-5 sm:px-6">
      <section aria-label="Titulaire" className="rounded-2xl border border-[#B6DAF7] bg-[#DFEFFE] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1863A9]"><UserRound size={24} aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#465058]">Carte médicale Doctorek</p>
            <h1 className="mt-1 break-words text-2xl font-bold leading-tight tracking-tight text-[#00263C]">{name}</h1>
          </div>
        </div>
        <p className="mt-4 text-sm text-[#465058]">Informations renseignées dans le dossier patient.</p>
        {date && <p className="mt-1 text-xs text-[#465058]">Fiche mise à jour le {date}</p>}
      </section>

      <section aria-labelledby="scan-essential" className={surface}>
        <h2 id="scan-essential" className="flex items-center gap-2 text-lg font-bold text-[#00263C]"><HeartPulse size={20} className="text-[#1863A9]" aria-hidden="true" />À connaître</h2>
        <dl className="mt-4 divide-y divide-[#E2E8F0]">
          <div className="pb-4">
            <dt className="text-sm font-semibold text-[#333333]">Allergies renseignées</dt>
            <dd className="mt-2">
              {carte.allergies.length ? <ul className="flex flex-wrap gap-2">{carte.allergies.map((item, index) => <li key={index} className="break-words rounded-lg border border-[#FFDEDE] bg-[#FFDEDE]/40 px-3 py-2 text-sm font-semibold text-[#9F1640]">{item}</li>)}</ul> : <p className="text-sm text-[#465058]">Non renseigné</p>}
            </dd>
          </div>
          <div className="py-4">
            <dt className="text-sm font-semibold text-[#333333]">Maladies chroniques</dt>
            <dd className="mt-2 text-sm leading-relaxed text-[#465058]">{carte.maladiesChroniques.length ? carte.maladiesChroniques.join(' · ') : 'Non renseigné'}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 pt-4">
            <dt className="text-sm text-[#465058]">Groupe sanguin renseigné</dt>
            <dd className="text-base font-bold text-[#00263C]">{carte.groupeSanguin || 'Non renseigné'}</dd>
          </div>
        </dl>
        <p className="mt-4 border-t border-[#E2E8F0] pt-3 text-xs leading-relaxed text-[#465058]">Une rubrique non renseignée ne signifie pas une absence d’allergie ou de maladie.</p>
      </section>

      <section aria-labelledby="scan-contacts" className={surface}>
        <h2 id="scan-contacts" className="text-lg font-bold text-[#00263C]">Contacts à prévenir</h2>
        {carte.contactsUrgence.length ? <ul className="mt-3 divide-y divide-[#E2E8F0]">{carte.contactsUrgence.map((contact, index) => {
          const number = contact.telephone.replace(/[\s().-]/g, '')
          const callable = /^\+?\d{5,15}$/.test(number)
          return <li key={index} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0"><p className="break-words font-semibold text-[#333333]">{contact.nom}</p><p className="text-sm text-[#465058]">{contact.lien}</p><p className="text-sm text-[#465058]">{contact.telephone}</p></div>
            {callable && <a href={`tel:${number}`} aria-label={`Appeler ${contact.nom}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#DFEFFE] px-4 text-sm font-semibold text-[#064178] focus-visible:outline-2 focus-visible:outline-offset-2"><Phone size={16} aria-hidden="true" />Appeler</a>}
          </li>
        })}</ul> : <p className="mt-3 text-sm text-[#465058]">Aucun contact renseigné.</p>}
      </section>

      <details className={`${surface} group`}>
        <summary className="min-h-11 cursor-pointer content-center text-base font-semibold text-[#00263C] focus-visible:outline-2 focus-visible:outline-offset-4">Autres informations</summary>
        <dl className="mt-4 space-y-3 border-t border-[#E2E8F0] pt-4 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-[#465058]">Taille</dt><dd className="font-semibold text-[#333333]">{carte.tailleCm ? `${carte.tailleCm} cm` : 'Non renseignée'}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-[#465058]">Poids</dt><dd className="font-semibold text-[#333333]">{carte.poidsKg ? `${carte.poidsKg} kg` : 'Non renseigné'}</dd></div>
          {carte.donneurOrganes && <div className="flex justify-between gap-4"><dt className="text-[#465058]">Don d’organes</dt><dd className="font-semibold text-[#333333]">Donneur déclaré</dd></div>}
        </dl>
      </details>
      <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-[#465058]"><ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />Cette synthèse est accessible avec le lien de la carte. Le dossier complémentaire nécessite une autorisation.</p>
    </main>
  </>
}
