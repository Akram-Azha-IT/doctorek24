'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  CalendarCheck,
  ChevronDown,
  CircleUserRound,
  Clock3,
  CreditCard,
  HeartPulse,
  Mail,
  MessageCircleQuestion,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react'

const CATEGORIES = [
  {
    id: 'rendez-vous',
    label: 'Rendez-vous',
    description: 'Prendre, déplacer ou annuler un rendez-vous',
    icon: CalendarCheck,
  },
  {
    id: 'compte',
    label: 'Compte et connexion',
    description: 'Accéder à votre espace et gérer vos informations',
    icon: CircleUserRound,
  },
  {
    id: 'dossier',
    label: 'Dossier médical',
    description: 'Documents, proches et informations de santé',
    icon: HeartPulse,
  },
  {
    id: 'medecins',
    label: 'Espace médecin',
    description: 'Agenda, profil professionnel et patients',
    icon: Stethoscope,
  },
  {
    id: 'paiement',
    label: 'Paiement',
    description: 'Tarifs, justificatifs et questions de facturation',
    icon: CreditCard,
  },
  {
    id: 'confidentialite',
    label: 'Sécurité et données',
    description: 'Confidentialité et protection de vos données',
    icon: ShieldCheck,
  },
] as const

type CategoryId = (typeof CATEGORIES)[number]['id']

const FAQS: ReadonlyArray<{
  id: string
  category: CategoryId
  question: string
  answer: React.ReactNode
}> = [
  {
    id: 'prendre-rdv',
    category: 'rendez-vous',
    question: 'Comment prendre rendez-vous avec un médecin ?',
    answer: (
      <p>
        Recherchez un praticien par spécialité et par ville, ouvrez son profil puis choisissez un
        créneau disponible. Après confirmation, le rendez-vous apparaît dans votre espace patient.
      </p>
    ),
  },
  {
    id: 'annuler-rdv',
    category: 'rendez-vous',
    question: 'Comment annuler un rendez-vous ?',
    answer: (
      <p>
        Depuis votre espace patient, ouvrez <strong>Mes rendez-vous</strong>, sélectionnez le rendez-vous
        concerné puis cliquez sur <strong>Annuler</strong>. Le praticien sera automatiquement informé.
      </p>
    ),
  },
  {
    id: 'confirmation-rdv',
    category: 'rendez-vous',
    question: "Où retrouver la confirmation de mon rendez-vous ?",
    answer: (
      <p>
        La confirmation est visible dans la rubrique <strong>Mes rendez-vous</strong>. Vous y trouverez
        la date, l’heure, l’adresse du cabinet et le statut du rendez-vous.
      </p>
    ),
  },
  {
    id: 'connexion',
    category: 'compte',
    question: "Je n’arrive pas à me connecter, que faire ?",
    answer: (
      <p>
        Vérifiez l’adresse e-mail utilisée lors de votre inscription. Si le problème persiste,
        contactez notre équipe en indiquant votre nom et l’adresse associée au compte, sans jamais
        communiquer votre mot de passe.
      </p>
    ),
  },
  {
    id: 'modifier-informations',
    category: 'compte',
    question: 'Comment modifier mes informations personnelles ?',
    answer: (
      <p>
        Connectez-vous à votre espace puis ouvrez la rubrique <strong>Mon compte</strong>. Vous pouvez y
        mettre à jour vos coordonnées et vos informations personnelles.
      </p>
    ),
  },
  {
    id: 'proche',
    category: 'dossier',
    question: 'Puis-je gérer le dossier d’un proche ?',
    answer: (
      <p>
        Oui. La rubrique <strong>Mes proches</strong> de votre espace patient permet de rattacher un proche
        et de gérer ses informations selon les autorisations accordées.
      </p>
    ),
  },
  {
    id: 'documents',
    category: 'dossier',
    question: 'Qui peut consulter mes documents médicaux ?',
    answer: (
      <p>
        Seuls les professionnels autorisés dans le cadre de votre prise en charge peuvent accéder
        aux informations nécessaires. Les accès sont contrôlés et vos données ne sont jamais vendues.
      </p>
    ),
  },
  {
    id: 'agenda-medecin',
    category: 'medecins',
    question: 'Comment définir mes disponibilités de consultation ?',
    answer: (
      <p>
        Dans votre espace médecin, ouvrez <strong>Disponibilités</strong> puis ajoutez vos plages horaires
        et la durée habituelle d’une consultation. Les créneaux proposés aux patients sont générés
        automatiquement.
      </p>
    ),
  },
  {
    id: 'profil-medecin',
    category: 'medecins',
    question: 'Comment compléter mon profil professionnel ?',
    answer: (
      <p>
        Depuis votre tableau de bord médecin, accédez à <strong>Mon profil</strong> pour renseigner votre
        spécialité, votre adresse, vos langues, votre présentation et vos informations tarifaires.
      </p>
    ),
  },
  {
    id: 'tarifs',
    category: 'paiement',
    question: 'Le prix de la consultation est-il affiché ?',
    answer: (
      <p>
        Les informations tarifaires communiquées par le praticien figurent sur son profil. Le prix
        final et les modalités de paiement restent confirmés par le cabinet médical.
      </p>
    ),
  },
  {
    id: 'securite',
    category: 'confidentialite',
    question: 'Comment Doctorek protège-t-il mes données ?',
    answer: (
      <p>
        Les échanges sont chiffrés et l’accès aux informations est limité selon le rôle de chaque
        utilisateur. Consultez notre{' '}
        <Link href="/confidentialite" className="font-bold text-[#007DFF] hover:underline">
          politique de confidentialité
        </Link>{' '}
        pour connaître le détail de vos droits.
      </p>
    ),
  },
]

const FAQ_SEARCH_TERMS: Readonly<Record<string, string>> = {
  'prendre-rdv': 'réserver réservation créneau disponibilité praticien spécialité ville',
  'annuler-rdv': 'annulation supprimer déplacer reporter praticien prévenir',
  'confirmation-rdv': 'date heure adresse cabinet statut espace patient retrouver',
  connexion: 'email e-mail adresse mot de passe accès authentification',
  'modifier-informations': 'coordonnées profil téléphone email identité mise à jour',
  proche: 'famille enfant parent rattacher autorisation gérer',
  documents: 'confidentialité accès médecin professionnel santé sécurité partage',
  'agenda-medecin': 'plage horaire durée consultation créneau patient calendrier',
  'profil-medecin': 'spécialité adresse langues présentation tarif professionnel',
  tarifs: 'prix consultation coût facturation paiement justificatif cabinet',
  securite: 'protection confidentialité chiffrement droits informations personnelles',
}

const PRIMARY_INTENTS = [
  { label: 'Prendre un rendez-vous', faqId: 'prendre-rdv', icon: CalendarCheck },
  { label: 'Gérer mon compte', faqId: 'modifier-informations', icon: CircleUserRound },
  { label: 'Protéger mes données', faqId: 'securite', icon: ShieldCheck },
] as const

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function AccentArrow({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <svg
      viewBox="0 0 52 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 20.5C15.5 21 28.5 17.5 41 8"
        stroke="#ECB22E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M31.5 6L42.5 7.5L37.5 17"
        stroke="#ECB22E"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HelpCenter() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>('prendre-rdv')
  const [showAllFaqs, setShowAllFaqs] = useState(false)

  const filteredFaqs = useMemo(() => {
    const needle = normalize(query.trim())
    return FAQS.filter((faq) => {
      const inCategory = category === 'all' || faq.category === category
      const categoryDetails = CATEGORIES.find((item) => item.id === faq.category)
      const searchableText = [
        faq.question,
        FAQ_SEARCH_TERMS[faq.id],
        categoryDetails?.label,
        categoryDetails?.description,
      ].join(' ')
      const inSearch = !needle || normalize(searchableText).includes(needle)
      return inCategory && inSearch
    })
  }, [category, query])

  const hasActiveFilter = category !== 'all' || query.trim().length > 0
  const suggestions = query.trim().length >= 2 ? filteredFaqs.slice(0, 5) : []
  const visibleFaqs = hasActiveFilter || showAllFaqs ? filteredFaqs : filteredFaqs.slice(0, 6)
  const hiddenFaqCount = filteredFaqs.length - visibleFaqs.length

  function scrollToQuestions() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('questions')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  function resetFilters() {
    setCategory('all')
    setQuery('')
    setOpenId('prendre-rdv')
    setShowAllFaqs(false)
  }

  function selectCategory(id: CategoryId) {
    setCategory((current) => (current === id ? 'all' : id))
    setQuery('')
    setOpenId(null)
    setShowAllFaqs(false)
    scrollToQuestions()
  }

  function selectQuestion(faqId: string) {
    const faq = FAQS.find((item) => item.id === faqId)
    if (!faq) return
    setCategory('all')
    setQuery(faq.question)
    setOpenId(faq.id)
    setShowAllFaqs(false)
    scrollToQuestions()
  }

  return (
    <>
      <section className="bg-white px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[1120px]">
          <div>
            <h1 className="text-balance text-center text-[38px] font-extrabold leading-[1.06] tracking-[-0.045em] text-[#00263C] sm:text-left sm:text-5xl lg:whitespace-nowrap lg:text-[58px]">
              Comment puis-je vous aider ?
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#607684] sm:text-base">
              Trouvez des réponses claires et avancez sereinement, étape par étape.
            </p>
          </div>

          <div className="relative mt-8 rounded-[26px] bg-[#007DFF] p-5 shadow-[0_18px_42px_rgba(0,125,255,0.18)] sm:p-7">
            <label className="block text-sm font-bold text-white">
              Décrivez votre besoin
              <span className="relative mt-3 block">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#007DFF]" aria-hidden="true" />
                <input
                  type="search"
                  maxLength={120}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setCategory('all')
                    setOpenId(null)
                    setShowAllFaqs(false)
                  }}
                  placeholder="Décrivez votre besoin en quelques mots…"
                  className="h-[60px] w-full rounded-2xl border border-white bg-white py-4 pl-14 pr-12 text-[15px] font-semibold text-[#00263C] shadow-[0_10px_26px_rgba(0,38,60,0.14)] outline-none placeholder:font-normal placeholder:text-[#7B8A96] focus:ring-4 focus:ring-[#00263C]/25"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setShowAllFaqs(false)
                    }}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-[#607684] transition-colors duration-200 hover:bg-[#EBF4FF] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] motion-reduce:transition-none"
                    aria-label="Effacer la recherche"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </span>
            </label>
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[#E7F3FF]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Vos informations restent confidentielles et sécurisées.
            </p>

            {suggestions.length > 0 && (
              <div className="absolute left-5 right-5 top-[116px] z-30 overflow-hidden rounded-2xl border border-[#D5E5F2] bg-white p-2 shadow-[0_22px_50px_rgba(0,38,60,0.2)] sm:left-7 sm:right-7 sm:top-[132px]">
                <ul>
                  {suggestions.map((faq) => (
                    <li key={faq.id}>
                      <button
                        type="button"
                        onClick={() => selectQuestion(faq.id)}
                        className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#00263C] transition-colors duration-200 hover:bg-[#EDF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#007DFF] motion-reduce:transition-none"
                      >
                        <AccentArrow className="h-5 w-9 shrink-0" />
                        {faq.question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3" aria-label="Besoins fréquents">
            {PRIMARY_INTENTS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.faqId}
                  type="button"
                  onClick={() => selectQuestion(item.faqId)}
                  className="group relative flex min-h-[132px] cursor-pointer flex-col items-start rounded-[22px] border border-[#DCE6EF] bg-white p-4 text-left shadow-[0_8px_22px_rgba(0,38,60,0.06)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-[#9CCEFF] hover:shadow-[0_14px_32px_rgba(0,38,60,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-h-[150px] sm:p-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#E5F2FF] text-[#007DFF] sm:h-11 sm:w-11 sm:rounded-2xl">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="mt-3 max-w-[10rem] text-[13px] font-extrabold leading-5 text-[#00263C] sm:text-[15px]">
                    {item.label}
                  </span>
                  <AccentArrow className="absolute bottom-3 right-3 h-6 w-10 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 sm:bottom-4 sm:right-4" />
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section id="questions" className="scroll-mt-24 border-t border-[#E2EAF1] bg-[#F7FAFD] px-4 py-12 sm:px-8 sm:py-16" aria-labelledby="faq-title">
        <div className="mx-auto grid max-w-[1120px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-10">
          <div>
            <div className="mb-6">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#007DFF]">
                  {hasActiveFilter
                    ? `${filteredFaqs.length} résultat${filteredFaqs.length > 1 ? 's' : ''}`
                    : 'Questions fréquentes'}
                </p>
                <h2 id="faq-title" className="mt-2 break-words text-2xl font-extrabold text-[#010C2D] sm:text-3xl">
                  {category === 'all'
                    ? query
                      ? `Résultats pour « ${query} »`
                      : 'Questions recommandées'
                    : CATEGORIES.find((item) => item.id === category)?.label}
                </h2>
              </div>
            </div>

            <div className="mb-7 flex flex-wrap gap-2" aria-label="Filtrer les questions par thème">
              {CATEGORIES.map((item) => {
                const selected = category === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectCategory(item.id)}
                    aria-pressed={selected}
                    className={`min-h-10 cursor-pointer rounded-full border px-3.5 py-2 text-xs font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2 motion-reduce:transition-none ${selected ? 'border-[#007DFF] bg-[#007DFF] text-white' : 'border-[#C9DBEB] bg-white text-[#465058] hover:border-[#007DFF] hover:text-[#007DFF]'}`}
                  >
                    {item.label}
                  </button>
                )
              })}
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-[#C9DBEB] bg-white px-3.5 py-2 text-xs font-bold text-[#00263C] transition-colors duration-200 hover:border-[#007DFF] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2 motion-reduce:transition-none"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Tout afficher
                </button>
              )}
            </div>

            <p className="sr-only" role="status" aria-live="polite">
              {filteredFaqs.length} réponse{filteredFaqs.length > 1 ? 's' : ''} affichée{filteredFaqs.length > 1 ? 's' : ''}.
            </p>

            <div className="space-y-3">
              {visibleFaqs.map((faq) => {
                const open = openId === faq.id
                return (
                  <article key={faq.id} className={`relative overflow-hidden rounded-[22px] border bg-white pl-14 transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none sm:pl-20 ${open ? 'border-[#9CCEFF] shadow-[0_12px_30px_rgba(0,125,255,0.09)]' : 'border-[#DCE6EF] shadow-[0_5px_16px_rgba(0,38,60,0.035)]'}`}>
                    <AccentArrow className="absolute left-3 top-5 h-7 w-10 sm:left-5 sm:top-6 sm:h-8 sm:w-12" />
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : faq.id)}
                        aria-expanded={open}
                        aria-controls={`${faq.id}-answer`}
                        className="flex min-h-[76px] w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left text-[15px] font-bold text-[#00263C] transition-colors duration-200 hover:bg-[#F7FBFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#007DFF] motion-reduce:transition-none sm:px-6 sm:text-base"
                      >
                        {faq.question}
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 motion-reduce:transition-none ${open ? 'bg-[#007DFF] text-white' : 'bg-[#EDF6FF] text-[#007DFF]'}`}>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </span>
                      </button>
                    </h3>
                    {open && (
                      <div id={`${faq.id}-answer`} className="animate-in border-t border-[#E7EEF4] px-4 py-5 text-[14px] leading-7 text-[#465058] fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none sm:px-6">
                        {faq.answer}
                      </div>
                    )}
                  </article>
                )
              })}

              {filteredFaqs.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-[#B9CCDA] bg-[#F7FAFD] px-6 py-10 text-center">
                  <Search className="mx-auto h-7 w-7 text-[#8BAFC8]" aria-hidden="true" />
                  <p className="mt-4 font-bold text-[#00263C]">Aucune réponse trouvée</p>
                  <p className="mt-2 text-sm text-[#607684]">Essayez des mots plus simples ou contactez notre équipe.</p>
                </div>
              )}

              {hiddenFaqCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllFaqs(true)}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-[#C9DBEB] bg-[#F7FAFD] px-5 py-3 text-sm font-extrabold text-[#00263C] transition-colors duration-200 hover:border-[#007DFF] hover:bg-[#EDF6FF] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2 motion-reduce:transition-none"
                >
                  Afficher {hiddenFaqCount} question{hiddenFaqCount > 1 ? 's' : ''} de plus
                </button>
              )}
            </div>
          </div>

          <aside className="overflow-hidden rounded-[26px] bg-[#00263C] p-7 text-white shadow-[0_18px_40px_rgba(0,38,60,0.16)] lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#007DFF]">
              <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#B6DAF7]">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                Sous 1 jour
              </span>
            </div>
            <h2 className="mt-5 text-xl font-extrabold">Une autre question ?</h2>
            <p className="mt-3 text-sm leading-6 text-[#B6DAF7]">
              Notre équipe vous répond du lundi au vendredi. Décrivez votre problème sans partager de données médicales sensibles.
            </p>
            <a
              href="mailto:contact@doctorek.ma"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#00263C] transition-colors duration-200 hover:bg-[#E5F2FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#00263C] motion-reduce:transition-none"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Écrire à l’équipe
            </a>
            <p className="mt-4 text-center text-xs text-[#8BAFC8]">contact@doctorek.ma</p>
          </aside>
        </div>
      </section>
    </>
  )
}
