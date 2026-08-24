'use client'

import { useEffect, useRef, useState } from 'react'
import { DayPicker, type DayButtonProps } from 'react-day-picker'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { DisponibiliteFilter } from '@/lib/disponibilite'
import { formatDateISO } from '@/lib/disponibilite'
import { omit } from '@/lib/object'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export interface RechercheAvailabilityValue {
  filter: DisponibiliteFilter
  date: string | null
}

interface RechercheDatePickerProps extends RechercheAvailabilityValue {
  onChange: (value: RechercheAvailabilityValue) => void
  variant?: 'toolbar' | 'search'
}

function labelFor(filter: DisponibiliteFilter, date: string | null) {
  if (date) {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(`${date}T00:00:00`))
  }
  if (filter === 'today') return 'Aujourd’hui'
  if (filter === 'week') return 'Cette semaine'
  return 'Toutes les dates'
}

function DayButton(props: DayButtonProps) {
  const { modifiers, children } = props
  const buttonProps = omit(props, 'modifiers', 'children', 'day')

  return (
    <button
      {...buttonProps}
      className={clsx(
        'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-1',
        modifiers.selected
          ? 'bg-[#007DFF] text-white shadow-sm hover:bg-[#006BDD]'
          : modifiers.disabled
            ? 'pointer-events-none text-zinc-300 opacity-60'
            : modifiers.outside
              ? 'text-zinc-300 hover:bg-[#F4F8FC]'
              : 'text-[#243547] hover:bg-[#EBF4FF]',
        modifiers.today && !modifiers.selected && 'font-extrabold text-[#007DFF] ring-1 ring-[#B6DAF7]',
      )}
    >
      {children}
    </button>
  )
}

export function RechercheDatePicker({ filter, date, onChange, variant = 'toolbar' }: RechercheDatePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 90)
  const selected = date ? new Date(`${date}T00:00:00`) : undefined

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    function closeEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [])

  function chooseQuick(nextFilter: DisponibiliteFilter) {
    onChange({ filter: nextFilter, date: null })
    setOpen(false)
  }

  function chooseDate(nextDate: Date | undefined) {
    if (!nextDate) return
    onChange({ filter: 'all', date: formatDateISO(nextDate) })
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={clsx('relative min-w-0', variant === 'search' ? 'flex border-l border-[#E8EEF5] md:flex-[0.9] md:border-l md:border-[#E7EDF4]' : 'sm:shrink-0')}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Choisir la date de consultation"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={clsx(
          'flex w-full items-center gap-2.5 bg-white text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/35',
          variant === 'search'
            ? 'min-h-[50px] px-2.5 text-[#243547] hover:bg-[#F8FBFF] md:min-h-[68px] md:px-5'
            : 'min-h-11 rounded-xl border px-3.5 sm:min-w-[182px]',
          variant === 'toolbar' && (open || date || filter !== 'all'
            ? 'border-[#9CCEFF] text-[#007DFF] shadow-[0_4px_14px_rgba(0,125,255,0.08)]'
            : 'border-[#DCE5EE] text-[#243547] hover:border-[#9CCEFF]'),
        )}
      >
        <CalendarDays className={clsx('h-[17px] w-[17px] shrink-0 md:h-[18px] md:w-[18px]', variant === 'search' ? 'text-[#007DFF] md:text-[#8A98A8]' : '')} aria-hidden="true" />
        {variant === 'search' ? (
          <span className="min-w-0 flex-1 text-left">
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A98A8] md:block">Quand</span>
            <span className="block truncate text-[12.5px] text-[#465058] md:mt-0.5 md:text-[14px] md:font-semibold md:text-[#243547]">{labelFor(filter, date)}</span>
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-left">{labelFor(filter, date)}</span>
        )}
        <ChevronDown className={clsx('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fermer le calendrier"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] bg-[#010C2D]/30 backdrop-blur-[2px] md:hidden"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Calendrier des disponibilités"
            className="fixed inset-x-3 bottom-3 z-[80] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[20px] border border-[#DCE9F7] bg-white p-4 shadow-[0_22px_60px_rgba(1,38,81,0.18)] md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-full md:mt-2 md:w-[min(344px,calc(100vw-2rem))] md:overflow-visible"
          >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-[#010C2D]">Quand souhaitez-vous consulter ?</p>
              <p className="mt-0.5 text-xs text-[#607080]">Choisissez une période ou une date précise.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le calendrier"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1F6FD] text-[#607080] hover:text-[#007DFF]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-[#F1F6FD] p-1" role="group" aria-label="Choix rapides">
            {([
              ['all', 'Toutes'],
              ['today', 'Aujourd’hui'],
              ['week', '7 jours'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => chooseQuick(value)}
                aria-pressed={!date && filter === value}
                className={clsx(
                  'min-h-9 rounded-lg px-2 text-xs font-bold transition-colors',
                  !date && filter === value
                    ? 'bg-white text-[#007DFF] shadow-sm'
                    : 'text-[#607080] hover:bg-white/70 hover:text-[#00263C]',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <DayPicker
            mode="single"
            selected={selected}
            onSelect={chooseDate}
            defaultMonth={selected ?? today}
            weekStartsOn={1}
            disabled={{ before: today, after: maxDate }}
            showOutsideDays
            startMonth={today}
            endMonth={maxDate}
            components={{
              DayButton,
              Chevron: ({ orientation }: { orientation?: string }) =>
                orientation === 'left'
                  ? <ChevronLeft className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />,
            }}
            classNames={{
              root: 'w-full select-none',
              months: 'w-full',
              month: 'w-full',
              month_caption: 'mb-3 flex items-center justify-between',
              caption_label: 'text-sm font-extrabold text-[#010C2D]',
              nav: 'flex items-center gap-1',
              button_previous: 'flex h-8 w-8 items-center justify-center rounded-full text-[#607080] hover:bg-[#EBF4FF] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]',
              button_next: 'flex h-8 w-8 items-center justify-center rounded-full text-[#607080] hover:bg-[#EBF4FF] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]',
              month_grid: 'w-full border-collapse',
              weekdays: 'mb-1 flex',
              weekday: 'flex-1 pb-2 text-center text-[11px] font-bold uppercase text-[#8A98A8]',
              week: 'flex',
              day: 'flex flex-1 items-center justify-center py-0.5',
              hidden: 'invisible',
            }}
            formatters={{
              formatMonthCaption: (month) => `${MONTHS[month.getMonth()]} ${month.getFullYear()}`,
              formatWeekdayName: (weekday) => ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'][weekday.getDay()],
            }}
          />
          </div>
        </>
      )}
    </div>
  )
}
