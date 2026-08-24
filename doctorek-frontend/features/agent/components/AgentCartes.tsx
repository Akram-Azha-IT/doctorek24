'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, CalendarDays, ChevronDown, Clock3, MapPin, Star } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import type {
  AgentCard,
  AgentCreneauxCarte,
  AgentMedecinCarte,
  AgentRdvBrouillon,
  BookingSlot,
  RendezVous,
} from '@/lib/types'
import { FlecheManuscrite } from './FlecheManuscrite'

interface AgentCartesProps {
  readonly cartes: AgentCard[]
  readonly onReserver: (slot: BookingSlot) => void
  readonly onBrouillon: (brouillon: AgentRdvBrouillon) => void
}

function formatJour(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date(`${iso}T00:00:00`))
}

function formatJourCourt(iso: string): string {
  const cible = new Date(`${iso}T00:00:00`)
  const maintenant = new Date()
  const aujourdHui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())
  const difference = Math.round((cible.getTime() - aujourdHui.getTime()) / 86_400_000)

  if (difference === 0) return "Aujourd’hui"
  if (difference === 1) return 'Demain'
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(cible).replace('.', '')
}

function finDuCreneau(debut: string, dureeMinutes: number): string {
  const [h, m] = debut.split(':').map(Number)
  const total = h * 60 + m + dureeMinutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/* ── Médecins ──────────────────────────────────────────────────────────────── */

function LigneMedecin({ carte, prioritaire = false }: { readonly carte: AgentMedecinCarte; readonly prioritaire?: boolean }) {
  const { profil, noteMoyenne, nombreAvis, distanceKm } = carte

  return (
    <Link
      href={`/medecins/${profil.id}`}
      className={`group flex min-h-[76px] items-center gap-3 rounded-[1.35rem] bg-white px-3.5 py-3 shadow-[0_4px_14px_rgba(1,12,45,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(1,12,45,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] ${
        prioritaire ? 'border border-[#9DCCF7]' : 'border border-[#E1EAF3]'
      }`}
    >
      <Avatar name={`${profil.firstName} ${profil.lastName}`} photoUrl={profil.photoUrl} size={48} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-[14px] font-extrabold text-[#010C2D] group-hover:text-[#007DFF]">
            Dr {profil.firstName} {profil.lastName}
          </p>
          <BadgeCheck className="h-4 w-4 shrink-0 fill-[#2EB67D] text-white" strokeWidth={2.4} aria-label="Profil vérifié" />
        </div>
        <p className="mt-0.5 truncate text-[12px] font-medium text-[#53677B]">
          {profil.specialite} · {profil.ville}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] font-semibold text-[#667585]">
          {noteMoyenne !== null && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Star className="h-3.5 w-3.5 fill-[#F5B82E] text-[#F5B82E]" aria-hidden="true" />
              {noteMoyenne.toFixed(1)}
              {nombreAvis ? <span className="font-normal text-[#8A97A6]">({nombreAvis})</span> : null}
            </span>
          )}
          {distanceKm !== null && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {distanceKm.toFixed(1)} km
            </span>
          )}
        </div>
      </div>

      <FlecheManuscrite className="h-5 w-8 shrink-0 text-[#E7A11A] transition-transform duration-300 group-hover:translate-x-1 group-hover:-rotate-3 group-hover:text-[#007DFF]" />
    </Link>
  )
}

/* ── Créneaux ──────────────────────────────────────────────────────────────── */

function CarteCreneaux({
  carte,
  onReserver,
}: {
  readonly carte: AgentCreneauxCarte
  readonly onReserver: (slot: BookingSlot) => void
}) {
  const jours = carte.jours.filter((j) => j.creneaux.some((c) => c.disponible))

  if (jours.length === 0) {
    return (
      <p className="rounded-2xl bg-white px-3.5 py-3 text-[13px] text-[#465058] ring-1 ring-[#EAEEF3]">
        Aucun créneau libre sur cette période.
      </p>
    )
  }

  return (
    <div className="rounded-[1.35rem] border border-[#CFE1F2] bg-white px-3.5 py-3.5 shadow-[0_5px_16px_rgba(1,12,45,0.06)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EBF5FF] text-[#007DFF]">
          <CalendarDays className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <p className="text-[13px] font-extrabold text-[#010C2D]">
          Dr {carte.medecin.firstName} {carte.medecin.lastName}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {jours.map((jour) => (
          <div key={jour.date}>
            <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-wide text-[#8A97A6]">
              {formatJour(jour.date)}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {jour.creneaux.map((creneau, index) =>
                creneau.disponible ? (
                  <button
                    key={`${creneau.debut}-${creneau.fin}-${index}`}
                    type="button"
                    onClick={() =>
                      onReserver({
                        medecin: carte.medecin,
                        date: jour.date,
                        debut: creneau.debut,
                        fin: creneau.fin,
                      })
                    }
                    className="min-h-[44px] rounded-xl border border-[#B9D9F7] bg-[#F4FAFF] px-2 py-2 text-[13px] font-extrabold tabular-nums text-[#007DFF] transition-all hover:border-[#007DFF] hover:bg-[#EBF5FF] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
                  >
                    {creneau.debut}
                  </button>
                ) : (
                  <span
                    key={`${creneau.debut}-${creneau.fin}-${index}`}
                    className="min-h-[44px] rounded-xl bg-[#F4F6F8] px-2 py-2 text-center text-[13px] font-semibold tabular-nums text-[#8A97A6] line-through"
                  >
                    {creneau.debut}
                  </span>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CarteCorrespondance({
  medecins,
  carte,
  onReserver,
}: {
  readonly medecins: AgentMedecinCarte[]
  readonly carte: AgentCreneauxCarte
  readonly onReserver: (slot: BookingSlot) => void
}) {
  const [horairesDeveloppes, setHorairesDeveloppes] = useState(false)
  const [profilsDeveloppes, setProfilsDeveloppes] = useState(false)
  const horairesId = useId()
  const profilsId = useId()
  const principal = medecins.find((medecin) => medecin.profil.id === carte.medecin.id) ?? medecins[0]
  const tousLesCreneaux = carte.jours.flatMap((jour) =>
    jour.creneaux
      .filter((creneau) => creneau.disponible)
      .map((creneau) => ({ ...creneau, date: jour.date }))
  )
  const creneauxAffiches = horairesDeveloppes ? tousLesCreneaux : tousLesCreneaux.slice(0, 3)
  const autresMedecins = principal
    ? medecins.filter((medecin) => medecin.profil.id !== principal.profil.id)
    : []

  if (!principal) return <CarteCreneaux carte={carte} onReserver={onReserver} />

  return (
    <div className="rounded-[1.55rem] border border-[#CFE1F2] bg-white p-4 shadow-[0_8px_24px_rgba(1,12,45,0.07)] sm:p-5">
      <Link
        href={`/medecins/${principal.profil.id}`}
        className="group flex items-center gap-3.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
      >
        <Avatar
          name={`${principal.profil.firstName} ${principal.profil.lastName}`}
          photoUrl={principal.profil.photoUrl}
          size={64}
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[17px] font-extrabold text-[#010C2D] group-hover:text-[#007DFF]">
              Dr {principal.profil.firstName} {principal.profil.lastName}
            </p>
            <BadgeCheck className="h-4 w-4 shrink-0 fill-[#2EB67D] text-white" strokeWidth={2.4} aria-label="Profil vérifié" />
          </div>
          <p className="mt-0.5 truncate text-[14px] font-medium text-[#53677B]">
            {principal.profil.specialite} · {principal.profil.ville}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-[#667585]">
            {principal.noteMoyenne !== null && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Star className="h-4 w-4 fill-[#F5B82E] text-[#F5B82E]" aria-hidden="true" />
                {principal.noteMoyenne.toFixed(1)}
                {principal.nombreAvis ? <span className="font-normal text-[#8A97A6]">({principal.nombreAvis})</span> : null}
              </span>
            )}
            {principal.distanceKm !== null && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {principal.distanceKm.toFixed(1)} km
              </span>
            )}
          </div>
        </div>

        <FlecheManuscrite className="h-5 w-8 shrink-0 text-[#E7A11A] transition-transform duration-300 group-hover:translate-x-1 group-hover:-rotate-3 group-hover:text-[#007DFF]" />
      </Link>

      {tousLesCreneaux.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[12.5px] font-extrabold text-[#010C2D]">Choisissez votre créneau</p>
              <p className="mt-0.5 text-[10.5px] text-[#7B8C9F]">Vous le vérifierez avant de confirmer.</p>
            </div>
            <Clock3 className="h-4 w-4 shrink-0 text-[#007DFF]" aria-hidden="true" />
          </div>

          <div id={horairesId} className="grid grid-cols-3 gap-2.5">
            {creneauxAffiches.map((creneau, index) => (
              <button
                key={`${creneau.date}-${creneau.debut}-${creneau.fin}-${index}`}
                type="button"
                aria-label={`Choisir ${formatJour(creneau.date)} à ${creneau.debut} avec Dr ${carte.medecin.firstName} ${carte.medecin.lastName}`}
                onClick={() => onReserver({
                  medecin: carte.medecin,
                  date: creneau.date,
                  debut: creneau.debut,
                  fin: creneau.fin,
                })}
                className="group/creneau min-h-[72px] rounded-2xl border border-[#B9D9F7] bg-[#F4FAFF] px-2 py-2 text-center transition-all hover:-translate-y-0.5 hover:border-[#007DFF] hover:bg-[#EBF5FF] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
              >
                <span className="block text-[11.5px] font-semibold text-[#397CB9]">{formatJourCourt(creneau.date)}</span>
                <span className="mt-0.5 block text-[16px] font-extrabold tabular-nums text-[#007DFF]">{creneau.debut}</span>
                <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wide text-[#7BA8CF] transition-colors group-hover/creneau:text-[#007DFF]">Choisir</span>
              </button>
            ))}
          </div>

          {tousLesCreneaux.length > 3 && (
            <button
              type="button"
              aria-expanded={horairesDeveloppes}
              aria-controls={horairesId}
              onClick={() => setHorairesDeveloppes((valeur) => !valeur)}
              className="mt-2.5 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl text-[11.5px] font-extrabold text-[#397CB9] transition-colors hover:bg-[#F1F7FD] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
            >
              {horairesDeveloppes
                ? 'Afficher moins d’horaires'
                : `Afficher tous les horaires (${tousLesCreneaux.length})`}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${horairesDeveloppes ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#F6F8FA] px-3.5 py-3 text-[13px] text-[#667585]">
          Aucun créneau libre sur cette période.
        </p>
      )}

      {autresMedecins.length > 0 && (
        <div className="mt-3 border-t border-[#E6EDF5] pt-2.5">
          <button
            type="button"
            aria-expanded={profilsDeveloppes}
            aria-controls={profilsId}
            onClick={() => setProfilsDeveloppes((valeur) => !valeur)}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl text-[11.5px] font-extrabold text-[#53677B] transition-colors hover:bg-[#F5F8FB] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
          >
            + {autresMedecins.length} autre{autresMedecins.length > 1 ? 's' : ''} profil{autresMedecins.length > 1 ? 's' : ''} correspondant{autresMedecins.length > 1 ? 's' : ''}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${profilsDeveloppes ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          <div
            id={profilsId}
            hidden={!profilsDeveloppes}
            className="mt-2 flex flex-col gap-2"
          >
            {autresMedecins.map((medecin) => (
              <LigneMedecin key={medecin.profil.id} carte={medecin} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Rendez-vous du patient ────────────────────────────────────────────────── */

function CarteRdvs({ rdvs }: { readonly rdvs: RendezVous[] }) {
  if (rdvs.length === 0) {
    return (
      <p className="rounded-2xl bg-white px-3.5 py-3 text-[13px] text-[#465058] ring-1 ring-[#EAEEF3]">
        Vous n&apos;avez aucun rendez-vous à venir.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rdvs.map((rdv) => (
        <Link
          key={rdv.id}
          href="/patient/rdvs"
          className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 ring-1 ring-[#EAEEF3] shadow-[0_1px_2px_rgba(1,12,45,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(1,12,45,0.08)]"
        >
          <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-[#EBF5FF] leading-none">
            <span className="text-[14px] font-bold tabular-nums text-[#007DFF]">
              {rdv.dateRdv.slice(8, 10)}
            </span>
            <span className="text-[9px] font-semibold uppercase text-[#3793E0]">
              {new Intl.DateTimeFormat('fr-FR', { month: 'short' })
                .format(new Date(`${rdv.dateRdv}T00:00:00`))
                .replace('.', '')}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold tabular-nums text-[#010C2D]">{rdv.heureRdv}</p>
            <p className="truncate text-[12.5px] text-[#465058]">{rdv.motif ?? 'Consultation'}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#F1F6FD] px-2 py-0.5 text-[11px] font-semibold text-[#465058]">
            {rdv.statut.toLowerCase()}
          </span>
        </Link>
      ))}
    </div>
  )
}

/* ── Brouillon de rendez-vous ──────────────────────────────────────────────── */

function CarteBrouillon({
  brouillon,
  onBrouillon,
}: {
  readonly brouillon: AgentRdvBrouillon
  readonly onBrouillon: (brouillon: AgentRdvBrouillon) => void
}) {
  if (!brouillon.creneauLibre) {
    return (
      <div className="rounded-2xl bg-white px-3.5 py-3 ring-1 ring-[#FFDEDE] shadow-[0_1px_2px_rgba(1,12,45,0.06)]">
        <p className="text-[13px] font-semibold text-[#E01E5A]">
          {brouillon.indisponibilite ?? 'Ce créneau n&apos;est plus disponible.'}
        </p>
        <p className="mt-1 text-[12.5px] text-[#465058]">
          Demandez-moi d&apos;autres disponibilités.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white px-3.5 py-3.5 ring-1 ring-[#D8E3EE] shadow-[0_1px_2px_rgba(1,12,45,0.06)]">
      <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="col-span-2">
          <dt className="text-[11px] text-[#8A97A6]">Praticien</dt>
          <dd className="text-[13.5px] font-semibold text-[#010C2D]">{brouillon.medecinNom}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#8A97A6]">Date</dt>
          <dd className="text-[13.5px] font-semibold tabular-nums text-[#010C2D]">
            {formatJour(brouillon.date)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#8A97A6]">Heure</dt>
          <dd className="text-[13.5px] font-semibold tabular-nums text-[#010C2D]">
            {brouillon.heure} ({brouillon.dureeMinutes} min)
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => onBrouillon(brouillon)}
        className="min-h-[44px] w-full rounded-xl bg-[#00263C] px-4 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2"
      >
        Vérifier et confirmer
      </button>
      <p className="mt-2 text-[11.5px] leading-snug text-[#8A97A6]">
        Rien n&apos;est réservé tant que vous n&apos;avez pas confirmé.
      </p>
    </div>
  )
}

/* ── Aiguillage ────────────────────────────────────────────────────────────── */

/**
 * Rendu des blocs riches d'un tour.
 *
 * Chaque carte provient du retour réel d'un service métier : le texte du modèle
 * ne fait que les annoncer. C'est pourquoi les noms, adresses et horaires
 * affichés ici sont fiables même si la phrase générée est approximative.
 */
export function AgentCartes({ cartes, onReserver, onBrouillon }: AgentCartesProps) {
  if (cartes.length === 0) return null

  const carteMedecins = cartes.find((carte) => carte.type === 'medecins')
  const carteMedecin = cartes.find((carte) => carte.type === 'medecin')
  const carteCreneaux = cartes.find((carte) => carte.type === 'creneaux')
  const medecins = carteMedecins
    ? carteMedecins.donnees as AgentMedecinCarte[]
    : carteMedecin
      ? [carteMedecin.donnees as AgentMedecinCarte]
      : []

  if (carteCreneaux && medecins.length > 0 && cartes.every((carte) => ['medecins', 'medecin', 'creneaux'].includes(carte.type))) {
    return (
      <CarteCorrespondance
        medecins={medecins}
        carte={carteCreneaux.donnees as AgentCreneauxCarte}
        onReserver={onReserver}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {cartes.map((carte, index) => {
        const cle = `${carte.type}-${index}`

        switch (carte.type) {
          case 'medecins':
            return (
              <div key={cle} className="flex flex-col gap-1.5">
                {(carte.donnees as AgentMedecinCarte[]).map((m, medecinIndex) => (
                  <LigneMedecin key={m.profil.id} carte={m} prioritaire={medecinIndex === 0} />
                ))}
              </div>
            )
          case 'medecin':
            return <LigneMedecin key={cle} carte={carte.donnees as AgentMedecinCarte} prioritaire />
          case 'creneaux':
            return (
              <CarteCreneaux
                key={cle}
                carte={carte.donnees as AgentCreneauxCarte}
                onReserver={onReserver}
              />
            )
          case 'rdvs':
            return <CarteRdvs key={cle} rdvs={carte.donnees as RendezVous[]} />
          case 'brouillon':
            return (
              <CarteBrouillon
                key={cle}
                brouillon={carte.donnees as AgentRdvBrouillon}
                onBrouillon={onBrouillon}
              />
            )
          default:
            return null
        }
      })}
    </div>
  )
}

export { finDuCreneau }
