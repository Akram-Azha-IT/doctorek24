import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Doctorek',
  description:
    'Traitement des données personnelles et de santé sur Doctorek, conformément à la loi 09-08.',
}

/** Date de la version en vigueur, alignée sur doctorek.consentement.version côté backend. */
const VERSION = '2026-08-10'

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
  titre,
  children,
}: Readonly<{
  id: string
  titre: string
  children: React.ReactNode
}>) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 text-lg font-bold text-[#010C2D]">{titre}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-[#465058]">
        {children}
      </div>
    </section>
  )
}

export default function ConfidentialitePage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#F0F2F5] py-10 px-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#007DFF]">
            Loi 09-08 · CNDP Maroc
          </p>
          <h1 className="mt-1 text-3xl font-black text-[#010C2D]">
            Politique de confidentialité
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Version en vigueur du {VERSION}. Toute modification du présent texte donne lieu à
            une nouvelle demande de consentement.
          </p>
        </header>

        <nav
          aria-label="Sommaire"
          className="mb-8 rounded-2xl border border-zinc-200 bg-white px-5 py-4"
        >
          <ol className="grid grid-cols-1 gap-y-1.5 text-sm sm:grid-cols-2">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-[#1863A9] underline-offset-2 hover:underline"
                >
                  <span className="tabular-nums text-zinc-400">{i + 1}.</span> {s.titre}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-8 rounded-2xl border border-zinc-200 bg-white px-6 py-7 sm:px-8">
          <Section id="responsable" titre="1. Responsable du traitement">
            <p>
              Doctorek, plateforme de prise de rendez-vous médicaux et de gestion du dossier
              patient au Maroc. Pour toute question relative à vos données, écrivez à{' '}
              <a className="text-[#1863A9] underline" href="mailto:contact@doctorek.ma">
                contact@doctorek.ma
              </a>{'.'}
            </p>
          </Section>

          <Section id="donnees" titre="2. Données collectées">
            <p>
              <strong className="text-[#010C2D]">Données d&apos;identité :</strong> nom, prénom,
              date de naissance, adresse email, numéro de téléphone.
            </p>
            <p>
              <strong className="text-[#010C2D]">Données de santé :</strong> groupe sanguin,
              allergies, antécédents, traitements en cours, motifs de consultation, documents
              médicaux que vous déposez, comptes rendus rédigés par votre praticien.
            </p>
            <p>
              <strong className="text-[#010C2D]">Données d&apos;usage :</strong> rendez-vous
              pris, messages échangés avec vos praticiens, avis déposés.
            </p>
            <p>
              Les données de santé sont des données sensibles au sens de la loi 09-08. Leur
              traitement repose sur votre consentement explicite, que vous donnez à la création
              de votre compte et pouvez retirer à tout moment.
            </p>
          </Section>

          <Section id="finalites" titre="3. Finalités">
            <p>
              Vos données servent exclusivement à : gérer votre compte et vous authentifier,
              organiser vos rendez-vous et vous les rappeler, permettre à vos praticiens de
              consulter votre dossier lors d&apos;une consultation, générer votre carte de santé
              virtuelle, et vous permettre d&apos;échanger avec vos praticiens.
            </p>
            <p>
              Vos données ne sont ni vendues, ni louées, ni utilisées à des fins publicitaires.
            </p>
          </Section>

          <Section id="destinataires" titre="4. Qui accède à vos données">
            <p>
              <strong className="text-[#010C2D]">Les praticiens que vous consultez</strong>,
              pour les seules données nécessaires à votre prise en charge.
            </p>
            <p>
              <strong className="text-[#010C2D]">Les personnes que vous autorisez</strong>, si
              vous rattachez un proche à votre compte famille.
            </p>
            <p>
              <strong className="text-[#010C2D]">Les secours, en cas d&apos;urgence</strong>, via
              le QR code de votre carte virtuelle : seules les informations vitales sont
              accessibles sans code, le reste exige un code envoyé sur votre téléphone.
            </p>
            <p>
              <strong className="text-[#010C2D]">Nos prestataires techniques</strong>{' '}
              (hébergement, envoi d&apos;emails), liés par une obligation de confidentialité et
              sans droit d&apos;usage sur vos données.
            </p>
          </Section>

          <Section id="duree" titre="5. Durée de conservation">
            <p>
              Les données de votre compte sont conservées tant que celui-ci est actif. À la
              suppression du compte, votre identité est anonymisée. Les données médicales liées
              à une consultation sont conservées au titre de la rétention légale applicable aux
              dossiers médicaux, sans lien avec votre identité une fois le compte supprimé.
            </p>
          </Section>

          <Section id="securite" titre="6. Sécurité">
            <p>
              Les échanges sont chiffrés en transit. Les données sensibles de la carte virtuelle
              sont chiffrées en base. L&apos;accès aux dossiers est contrôlé par rôle, et
              l&apos;accès d&apos;urgence par un code à usage unique.
            </p>
          </Section>

          <Section id="droits" titre="7. Vos droits">
            <p>
              Conformément à la loi 09-08, vous disposez d&apos;un droit d&apos;accès, de
              rectification, d&apos;opposition et de suppression sur vos données.
            </p>
            <p>
              L&apos;accès et la rectification s&apos;exercent directement depuis votre espace,
              rubrique Mon compte. La suppression du compte y est également accessible. Pour
              toute autre demande, écrivez à{' '}
              <a className="text-[#1863A9] underline" href="mailto:contact@doctorek.ma">
                contact@doctorek.ma
              </a>{'.'}
            </p>
            <p>
              Retirer votre consentement est possible à tout moment : cela entraîne la
              suppression de votre compte, la plateforme ne pouvant fonctionner sans traiter ces
              données.
            </p>
          </Section>

          <Section id="cndp" titre="8. Déclaration CNDP">
            <p>
              Traitement déclaré auprès de la Commission Nationale de contrôle de la protection
              des Données à caractère Personnel (CNDP) sous le numéro{' '}
              <span className="rounded bg-[#FFF8E6] px-1.5 py-0.5 font-semibold text-[#8A6100]">
                à compléter
              </span>{'.'}
            </p>
            <p className="text-sm text-zinc-500">
              Vous pouvez saisir la CNDP de toute réclamation relative au traitement de vos
              données.
            </p>
          </Section>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/" className="text-[#1863A9] underline-offset-2 hover:underline">
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </main>
  )
}
