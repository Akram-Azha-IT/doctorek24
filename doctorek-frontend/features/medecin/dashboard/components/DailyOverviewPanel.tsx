'use client'

import Image from 'next/image'
import {
  ArrowRight,
  CalendarDays,
  Clock4,
  TrendingUp,
  Users,
} from 'lucide-react'

interface DailyOverviewPanelProps {
  todayCount: number
  weekCount: number
  patientCount: number
  consultationMinutes: number
  onAgenda: () => void
  onDisponibilites: () => void
}

const METRIC_ICON_CLASS = 'h-5 w-5 text-[#087CFA]'

/**
 * Action-oriented daily summary inspired by the selected Product Design mock.
 * The empty-day message becomes a concise schedule summary as soon as a booking exists.
 */
export function DailyOverviewPanel({
  todayCount,
  weekCount,
  patientCount,
  consultationMinutes,
  onAgenda,
  onDisponibilites,
}: DailyOverviewPanelProps) {
  const isFreeDay = todayCount === 0
  const metrics = [
    {
      label: "RDV aujourd'hui",
      sub: 'Journée en cours',
      value: todayCount,
      icon: <CalendarDays className={METRIC_ICON_CLASS} />,
    },
    {
      label: 'Cette semaine',
      sub: '7 prochains jours',
      value: weekCount,
      icon: <TrendingUp className={METRIC_ICON_CLASS} />,
    },
    {
      label: 'Patients suivis',
      sub: 'Total',
      value: patientCount,
      icon: <Users className={METRIC_ICON_CLASS} />,
    },
    {
      label: 'Temps de consultation',
      sub: "Minutes aujourd'hui",
      value: consultationMinutes,
      icon: <Clock4 className={METRIC_ICON_CLASS} />,
    },
  ]

  return (
    <section
      aria-labelledby="daily-overview-title"
      className="overflow-hidden rounded-2xl border border-[#DCE7F5] bg-[#F3F8FF] px-5 py-6 shadow-[0_12px_30px_rgba(28,80,143,0.04)] md:px-7 lg:px-8"
    >
      <div className="grid items-center gap-7 lg:grid-cols-[minmax(235px,0.86fr)_minmax(300px,1.2fr)_minmax(290px,0.98fr)] lg:gap-4">
        <div className="max-w-[300px]">
          <h2
            id="daily-overview-title"
            className="font-heading text-[24px] font-extrabold leading-tight tracking-[-0.035em] text-[#071A47] md:text-[26px]"
          >
            {isFreeDay ? 'Votre journée est libre' : 'Votre journée en un coup d’œil'}
          </h2>
          <p className="mt-4 text-sm leading-6 text-[#52678D]">
            {isFreeDay
              ? "Aucun rendez-vous aujourd'hui. Profitez-en pour avancer sur vos patients ou ouvrir des créneaux."
              : `${todayCount} rendez-vous ${todayCount === 1 ? 'est prévu' : 'sont prévus'} aujourd'hui. Consultez le programme pour préparer votre journée.`}
          </p>

          <div className="mt-6 flex flex-col items-start gap-4">
            <button
              type="button"
              onClick={onDisponibilites}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#087CFA] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(8,124,250,0.18)] transition-colors hover:bg-[#006DE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087CFA]/40 focus-visible:ring-offset-2"
            >
              <CalendarDays className="h-4 w-4" />
              Gérer mes disponibilités
            </button>
            <button
              type="button"
              onClick={onAgenda}
              className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-[#087CFA] transition-colors hover:text-[#005FC7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087CFA]/30"
            >
              Voir l&apos;agenda
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative mx-auto hidden h-[240px] w-full max-w-[390px] md:block lg:h-[250px]">
          <Image
            src="/illustrations/free-day-calendar.webp"
            alt=""
            fill
            quality={70}
            sizes="(min-width: 1024px) 390px, 50vw"
            className="object-contain"
          />
        </div>

        <dl className="grid grid-cols-2 gap-x-5 gap-y-5 border-t border-[#D8E5F5] pt-6 sm:gap-x-8 md:max-lg:mx-auto md:max-lg:w-full md:max-lg:max-w-[620px] lg:grid-cols-1 lg:border-l lg:border-t-0 lg:py-1 lg:pl-8 lg:pt-0">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                {metric.icon}
              </span>
              <div className="min-w-0 flex-1">
                <dt className="truncate text-sm font-medium text-[#0B1B43]">{metric.label}</dt>
                <dd className="mt-0.5 truncate text-[11px] text-[#6B7FA3]">{metric.sub}</dd>
              </div>
              <span className="shrink-0 text-[24px] font-extrabold leading-none tabular-nums text-[#071A47]">
                {metric.value}
              </span>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
