import Image from 'next/image'
import Link from 'next/link'

const BULLET_ITEMS = [
  'Agenda en ligne avec gestion des disponibilités',
  'Dossiers patients centralisés et sécurisés',
  'Rappels automatiques pour réduire les absences',
  'Tableau de bord et statistiques de votre activité',
]

export function ProfessionnelSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#00263C' }}>
      <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-10 md:py-14">
        <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 min-h-[200px] md:min-h-[240px]">

          <div className="relative flex-shrink-0 w-[240px] md:w-[280px] h-[240px] md:h-[280px]">
            <div className="absolute pointer-events-none" style={{
              width: '86%', height: '86%',
              background: '#007DFF',
              borderRadius: '45% 55% 60% 40% / 60% 40% 55% 45%',
              bottom: 0, right: 0,
            }} />
            <div className="absolute pointer-events-none" style={{
              width: '38%', height: '38%',
              background: '#FFAF5D',
              borderRadius: '50% 50% 55% 45% / 45% 55% 45% 55%',
              top: 0, left: 0,
              opacity: 0.85,
            }} />
            <div className="absolute overflow-hidden" style={{
              width: '82%', height: '82%',
              borderRadius: '45% 55% 55% 45% / 45% 55% 45% 55%',
              top: '5%', left: '5%',
            }}>
              <Image
                src="/Entice Beauty By Shah Emran The Artist.jpg"
                alt="Tableau de bord médecin"
                width={240}
                height={240}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 md:max-w-[580px] md:pl-10">
            <h2 className="text-2xl md:text-[32px] font-bold text-white leading-snug mb-3 tracking-tight">
              Vous êtes professionnel de santé ?
            </h2>
            <p className="text-[#B6DAF7] text-[14px] font-semibold mb-4">
              Rejoignez Doctorek et gérez votre cabinet simplement.
            </p>
            <ul className="space-y-2 mb-6">
              {BULLET_ITEMS.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="#FFAF5D" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l4 4 6-7" />
                  </svg>
                  <span className="text-[#D4E8F8] text-[13px]">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/inscription?role=medecin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-[14px] text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#007DFF' }}
            >
              En savoir plus
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
