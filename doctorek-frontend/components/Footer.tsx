import Link from 'next/link'
import Logo from '@/components/Logo'

const YEAR = new Date().getFullYear()

const SPECIALTIES = [
  'Médecin généraliste',
  'Pédiatre',
  'Gynécologue',
  'Dentiste',
  'Cardiologue',
  'Dermatologue',
]

const PATIENTS = [
  { label: 'Trouver un praticien', href: '/recherche' },
  { label: 'Prendre rendez-vous', href: '/recherche' },
  { label: 'Se connecter', href: '/login' },
  { label: 'Créer un compte', href: '/inscription' },
  { label: "Centre d'aide", href: '/help' },
]

const PROS = [
  { label: 'Logiciel Doctorek Pro', href: '/inscription?role=medecin' },
  { label: 'Espace médecin', href: '/login' },
  { label: 'Inscription médecin', href: '/inscription?role=medecin' },
]

const LEGAL = [
  { label: 'Conditions générales', href: '#' },
  { label: 'Confidentialité', href: '#' },
  { label: 'Mentions légales', href: '#' },
  { label: 'Cookies', href: '#' },
]

function LinkItem({ href, children }: { href: string; children: React.ReactNode }) {
  const className =
    'text-[#8BAFC8] text-[13px] leading-relaxed hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#007DFF]'
  // /login is a route handler that 307s to Keycloak — plain <a> avoids a doomed RSC fetch.
  if (href.startsWith('/login')) {
    return (
      <li>
        <a href={href} className={className}>{children}</a>
      </li>
    )
  }
  return (
    <li>
      <Link href={href} className={className}>
        {children}
      </Link>
    </li>
  )
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-[#8BAFC8] transition-all duration-150 hover:bg-[#007DFF] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
    >
      {children}
    </a>
  )
}

export function Footer() {
  return (
    <footer className="bg-[#00263C]" aria-label="Pied de page">

      {/* ── Main grid ── */}
      <div className="mx-auto max-w-[1400px] px-4 md:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo
              className="h-9 w-auto mb-5"
              width={130}
              height={43}
              priority={false}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <p className="text-[#8BAFC8] text-[13px] leading-relaxed mb-6 max-w-xs">
              La première plateforme numérique de santé au Maroc. Prenez rendez-vous en ligne, gérez votre dossier médical et restez connecté à votre médecin.
            </p>

            {/* Contact */}
            <div className="flex flex-col gap-2.5 mb-6">
              <a
                href="mailto:contact@doctorek.ma"
                className="flex items-center gap-2.5 text-[#8BAFC8] text-[13px] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:rounded"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#007DFF]/20 shrink-0">
                  <svg className="h-3.5 w-3.5 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>
                  </svg>
                </span>
                contact@doctorek.ma
              </a>
              <a
                href="tel:+212500000000"
                className="flex items-center gap-2.5 text-[#8BAFC8] text-[13px] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:rounded"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#007DFF]/20 shrink-0">
                  <svg className="h-3.5 w-3.5 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>
                  </svg>
                </span>
                +212 5 00 00 00 00
              </a>
              <span className="flex items-center gap-2.5 text-[#8BAFC8] text-[13px]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#007DFF]/20 shrink-0">
                  <svg className="h-3.5 w-3.5 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </span>
                Casablanca, Maroc
              </span>
            </div>

            {/* Social links */}
            <div className="flex gap-2" role="list" aria-label="Réseaux sociaux">
              <SocialLink href="https://facebook.com" label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </SocialLink>
              <SocialLink href="https://linkedin.com" label="LinkedIn">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
                </svg>
              </SocialLink>
              <SocialLink href="https://instagram.com" label="Instagram">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </SocialLink>
              <SocialLink href="https://x.com" label="X (Twitter)">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </SocialLink>
            </div>
          </div>

          {/* Specialties */}
          <nav aria-label="Spécialités">
            <h2 className="text-white text-[11px] font-bold uppercase tracking-widest mb-5">
              Spécialités
            </h2>
            <ul className="space-y-3">
              {SPECIALTIES.map((s) => (
                <LinkItem key={s} href={`/recherche?specialite=${encodeURIComponent(s)}`}>
                  {s}
                </LinkItem>
              ))}
            </ul>
          </nav>

          {/* Patients */}
          <nav aria-label="Espace patient">
            <h2 className="text-white text-[11px] font-bold uppercase tracking-widest mb-5">
              Patients
            </h2>
            <ul className="space-y-3">
              {PATIENTS.map((p) => (
                <LinkItem key={p.label} href={p.href}>{p.label}</LinkItem>
              ))}
            </ul>
          </nav>

          {/* Professionals */}
          <nav aria-label="Espace professionnel">
            <h2 className="text-white text-[11px] font-bold uppercase tracking-widest mb-5">
              Professionnels
            </h2>
            <ul className="space-y-3">
              {PROS.map((p) => (
                <LinkItem key={p.label} href={p.href}>{p.label}</LinkItem>
              ))}
            </ul>

          </nav>

        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-white/8">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Copyright + flag */}
            <p className="text-[12px] text-[#5C7F9B]">
              © {YEAR} Doctorek. Tous droits réservés.
            </p>

            {/* Legal links */}
            <nav aria-label="Liens légaux">
              <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
                {LEGAL.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[11px] text-[#5C7F9B] hover:text-[#B6DAF7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:rounded"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

          </div>
        </div>
      </div>

    </footer>
  )
}
