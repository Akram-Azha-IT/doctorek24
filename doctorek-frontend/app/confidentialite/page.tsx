import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { EyeOff, LockKeyhole, Mail, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Doctorek',
  description:
    'Traitement des données personnelles et de santé sur Doctorek, conformément à la loi 09-08.',
}

/** Date de la version en vigueur, alignée sur doctorek.consentement.version côté backend. */
const VERSION = '2026-08-10'
const VERSION_LABEL = '10 août 2026'

const SECTIONS = [
  { id: 'responsable', titre: 'Responsable du traitement' },
  { id: 'donnees', titre: 'Données collectées' },
  { id: 'finalites', titre: 'Finalités' },
  { id: 'destinataires', titre: 'Qui accède à vos données' },
  { id: 'duree', titre: 'Durée de conservation' },
  { id: 'securite', titre: 'Sécurité' },
  { id: 'droits', titre: 'Vos droits' },
  { id: 'cndp', titre: 'Déclaration CNDP' },
] as const

function Section({
  id,
  numero,
  titre,
  children,
}: Readonly<{
  id: string
  numero: number
  titre: string
  children: React.ReactNode
}>) {
  return (
    <section id={id} className="scroll-mt-28 px-5 py-7 sm:px-8 sm:py-9">
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 sm:gap-4">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF4FF] text-sm font-extrabold tabular-nums text-[#007DFF] ring-1 ring-[#D5E8FA]"
          aria-hidden="true"
        >
          {numero.toString().padStart(2, '0')}
        </span>
        <div>
          <h2 className="mb-3 text-[18px] font-bold tracking-[-0.02em] text-[#010C2D] sm:text-xl">
            {titre}
          </h2>
          <div className="space-y-3 text-[14px] leading-7 text-[#465058] sm:text-[15px]">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main id="main-content">
        <section className="relative overflow-hidden border-b border-[#DCEBFC] bg-[#EBF4FF]">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(0,125,255,0.16) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:py-16">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C9E2FA] bg-white/85 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#007DFF] shadow-sm">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Politique de confidentialité
              </p>
              <h1 className="max-w-[680px] text-[38px] font-extrabold leading-[1.08] tracking-[-0.045em] text-[#010C2D] sm:text-5xl lg:text-[56px]">
                Vos données restent entre de bonnes mains.
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#465058] sm:text-base">
                Nous vous expliquons clairement quelles informations sont utilisées, pourquoi
                elles le sont et comment vous gardez le contrôle.
              </p>

              <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-[0_8px_24px_rgba(0,38,60,0.06)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E5F2FF] text-[#007DFF]">
                    <LockKeyhole className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="text-[12px] font-bold leading-4 text-[#00263C]">
                    Données protégées
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-[0_8px_24px_rgba(0,38,60,0.06)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E5F2FF] text-[#007DFF]">
                    <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="text-[12px] font-bold leading-4 text-[#00263C]">
                    Jamais revendues
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-[0_8px_24px_rgba(0,38,60,0.06)]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E5F2FF] text-[#007DFF]">
                    <UserRoundCheck className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="text-[12px] font-bold leading-4 text-[#00263C]">
                    Vous gardez le contrôle
                  </span>
                </div>
              </div>

              <p className="mt-5 text-xs text-[#6D7F90]">
                Version en vigueur du {VERSION_LABEL}
                <span className="sr-only"> ({VERSION})</span>
              </p>
            </div>

            <div className="relative mx-auto h-[285px] w-full max-w-[390px] lg:h-[380px]" aria-hidden="true">
              <div className="absolute bottom-[4%] left-[5%] h-[78%] w-[78%] rounded-[46%_54%_58%_42%/55%_43%_57%_45%] bg-[#00263C]" />
              <div className="absolute right-[4%] top-[3%] h-[34%] w-[34%] rounded-[55%_45%_42%_58%/48%_58%_42%_52%] bg-[#168AFF] opacity-90" />
              <div className="absolute bottom-[9%] left-[2%] h-16 w-16 rounded-full bg-[#FFAF5D]/90" />
              <Image
                src="/medecin-carte-hero.png"
                alt=""
                width={552}
                height={900}
                priority
                className="absolute bottom-0 left-1/2 h-[96%] w-auto -translate-x-1/2 object-contain drop-shadow-[0_22px_30px_rgba(0,38,60,0.25)]"
              />
            </div>
          </div>
        </section>

        <section className="bg-[#F8FBFE] px-4 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto grid max-w-[1120px] items-start gap-7 lg:grid-cols-[255px_minmax(0,1fr)] lg:gap-10">
            <aside className="lg:sticky lg:top-24">
              <nav
                aria-label="Sommaire de la politique de confidentialité"
                className="rounded-[24px] border border-[#DCE6EF] bg-white p-5 shadow-[0_12px_34px_rgba(0,38,60,0.06)]"
              >
                <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#007DFF]">
                  Sur cette page
                </p>
                <ol className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
                  {SECTIONS.map((section, index) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="group flex items-center gap-3 rounded-xl px-2 py-2 text-[13px] font-medium text-[#465058] transition-colors hover:bg-[#EBF4FF] hover:text-[#00263C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
                      >
                        <span className="w-5 text-[11px] font-bold tabular-nums text-[#8BAFC8] group-hover:text-[#007DFF]">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                        {section.titre}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              <div className="mt-4 rounded-[24px] bg-[#00263C] p-5 text-white shadow-[0_14px_34px_rgba(0,38,60,0.16)]">
                <Mail className="mb-4 h-5 w-5 text-[#62B4FF]" aria-hidden="true" />
                <p className="text-sm font-bold">Une question sur vos données ?</p>
                <a
                  href="mailto:contact@doctorek.ma"
                  className="mt-2 inline-block text-[13px] text-[#B6DAF7] underline decoration-[#007DFF] underline-offset-4 hover:text-white"
                >
                  contact@doctorek.ma
                </a>
              </div>
            </aside>

            <div className="divide-y divide-[#E4EDF5] overflow-hidden rounded-[28px] border border-[#DCE6EF] bg-white shadow-[0_16px_46px_rgba(0,38,60,0.06)]">
              <Section id="responsable" numero={1} titre="Responsable du traitement">
                <p>
                  Doctorek, plateforme de prise de rendez-vous médicaux et de gestion du dossier
                  patient au Maroc. Pour toute question relative à vos données, écrivez à{' '}
                  <a className="font-semibold text-[#007DFF] underline-offset-3 hover:underline" href="mailto:contact@doctorek.ma">
                    contact@doctorek.ma
                  </a>{'.'}
                </p>
              </Section>

              <Section id="donnees" numero={2} titre="Données collectées">
                <p>
                  <strong className="font-bold text-[#010C2D]">Données d&apos;identité :</strong> nom,
                  prénom, date de naissance, adresse email, numéro de téléphone.
                </p>
                <p>
                  <strong className="font-bold text-[#010C2D]">Données de santé :</strong> groupe
                  sanguin, allergies, antécédents, traitements en cours, motifs de consultation,
                  documents médicaux que vous déposez, comptes rendus rédigés par votre praticien.
                </p>
                <p>
                  <strong className="font-bold text-[#010C2D]">Données d&apos;usage :</strong>{' '}
                  rendez-vous pris, messages échangés avec vos praticiens, avis déposés.
                </p>
                <p className="rounded-2xl bg-[#F2F8FF] px-4 py-3.5 text-[#294A63] ring-1 ring-[#DCEBFC]">
                  Les données de santé sont des données sensibles au sens de la loi 09-08. Leur
                  traitement repose sur votre consentement explicite, que vous donnez à la création
                  de votre compte et pouvez retirer à tout moment.
                </p>
              </Section>

              <Section id="finalites" numero={3} titre="Finalités">
                <p>
                  Vos données servent exclusivement à : gérer votre compte et vous authentifier,
                  organiser vos rendez-vous et vous les rappeler, permettre à vos praticiens de
                  consulter votre dossier lors d&apos;une consultation, générer votre carte de santé
                  virtuelle, et vous permettre d&apos;échanger avec vos praticiens.
                </p>
                <p className="font-bold text-[#00263C]">
                  Vos données ne sont ni vendues, ni louées, ni utilisées à des fins publicitaires.
                </p>
              </Section>

              <Section id="destinataires" numero={4} titre="Qui accède à vos données">
                <p>
                  <strong className="font-bold text-[#010C2D]">Les praticiens que vous consultez</strong>,
                  pour les seules données nécessaires à votre prise en charge.
                </p>
                <p>
                  <strong className="font-bold text-[#010C2D]">Les personnes que vous autorisez</strong>, si
                  vous rattachez un proche à votre compte famille.
                </p>
                <p>
                  <strong className="font-bold text-[#010C2D]">Les secours, en cas d&apos;urgence</strong>, via
                  le QR code de votre carte virtuelle : seules les informations vitales sont
                  accessibles sans code, le reste exige un code envoyé sur votre téléphone.
                </p>
                <p>
                  <strong className="font-bold text-[#010C2D]">Nos prestataires techniques</strong>{' '}
                  (hébergement, envoi d&apos;emails), liés par une obligation de confidentialité et
                  sans droit d&apos;usage sur vos données.
                </p>
              </Section>

              <Section id="duree" numero={5} titre="Durée de conservation">
                <p>
                  Les données de votre compte sont conservées tant que celui-ci est actif. À la
                  suppression du compte, votre identité est anonymisée. Les données médicales liées
                  à une consultation sont conservées au titre de la rétention légale applicable aux
                  dossiers médicaux, sans lien avec votre identité une fois le compte supprimé.
                </p>
              </Section>

              <Section id="securite" numero={6} titre="Sécurité">
                <p>
                  Les échanges sont chiffrés en transit. Les données sensibles de la carte virtuelle
                  sont chiffrées en base. L&apos;accès aux dossiers est contrôlé par rôle, et
                  l&apos;accès d&apos;urgence par un code à usage unique.
                </p>
              </Section>

              <Section id="droits" numero={7} titre="Vos droits">
                <p>
                  Conformément à la loi 09-08, vous disposez d&apos;un droit d&apos;accès, de
                  rectification, d&apos;opposition et de suppression sur vos données.
                </p>
                <p>
                  L&apos;accès et la rectification s&apos;exercent directement depuis votre espace,
                  rubrique Mon compte. La suppression du compte y est également accessible. Pour
                  toute autre demande, écrivez à{' '}
                  <a className="font-semibold text-[#007DFF] underline-offset-3 hover:underline" href="mailto:contact@doctorek.ma">
                    contact@doctorek.ma
                  </a>{'.'}
                </p>
                <p>
                  Retirer votre consentement est possible à tout moment : cela entraîne la
                  suppression de votre compte, la plateforme ne pouvant fonctionner sans traiter ces
                  données.
                </p>
              </Section>

              <Section id="cndp" numero={8} titre="Déclaration CNDP">
                <p>
                  Traitement déclaré auprès de la Commission Nationale de contrôle de la protection
                  des Données à caractère Personnel (CNDP) sous le numéro{' '}
                  <span className="rounded-md bg-[#FFF4E6] px-2 py-1 font-bold text-[#8A5600]">
                    à compléter
                  </span>{'.'}
                </p>
                <p className="text-[#6D7F90]">
                  Vous pouvez saisir la CNDP de toute réclamation relative au traitement de vos
                  données.
                </p>
              </Section>
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-[1120px] justify-center">
            <Link
              href="/"
              className="rounded-full border border-[#C9DBEB] bg-white px-5 py-2.5 text-sm font-bold text-[#00263C] transition-colors hover:border-[#007DFF] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
