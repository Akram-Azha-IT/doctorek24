import { CalendarCheck2, MessageCircleMore, SlidersHorizontal } from 'lucide-react'

const STEPS = [
  {
    number: '1',
    icon: MessageCircleMore,
    title: 'Décrivez',
    description: 'Dites votre besoin en quelques mots.',
  },
  {
    number: '2',
    icon: SlidersHorizontal,
    title: 'Comparez',
    description: 'Consultez les profils et les créneaux.',
  },
  {
    number: '3',
    icon: CalendarCheck2,
    title: 'Réservez',
    description: 'Choisissez l’horaire qui vous convient.',
  },
] as const

export function StatsStrip() {
  return (
    <section className="mt-4 px-4 md:mt-6 md:px-8" aria-label="Prendre rendez-vous avec Doctorek">
      <ol className="mx-auto grid max-w-[1400px] overflow-hidden rounded-2xl border border-[#DCE9F7] bg-white shadow-sm md:grid-cols-3">
        {STEPS.map(({ number, icon: Icon, title, description }, index) => (
          <li
            key={number}
            className="relative flex min-h-[108px] items-center gap-4 border-b border-[#E7EEF7] px-5 py-4 last:border-b-0 md:border-b-0 md:px-7"
          >
            <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#EBF4FF] text-[#007DFF]">
              <Icon className="h-8 w-8" strokeWidth={1.8} aria-hidden="true" />
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#007DFF] text-[10px] font-bold text-white">
                {number}
              </span>
            </span>

            <span className="min-w-0">
              <strong className="block text-[15px] font-bold text-[#00263C]">{title}</strong>
              <span className="mt-1 block text-[13px] leading-snug text-[#607080]">{description}</span>
            </span>

            {index < STEPS.length - 1 && (
              <span className="absolute right-0 top-1/2 hidden h-px w-8 -translate-y-1/2 bg-[#D0E8FF] md:block" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
