'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker, type DayButtonProps } from 'react-day-picker'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { clsx } from 'clsx'
import { formatDateISO } from '@/lib/disponibilite'
import type { DisponibiliteFilter } from '@/lib/disponibilite'
import { omit } from '@/lib/object'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const DESKTOP_PANEL_WIDTH = 344
const VIEWPORT_MARGIN = 16

function desktopPanelPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return {
    top: rect.bottom + 8,
    left: Math.min(
      Math.max(VIEWPORT_MARGIN, rect.left),
      window.innerWidth - DESKTOP_PANEL_WIDTH - VIEWPORT_MARGIN,
    ),
  }
}

interface AvailabilityValue {
  filter: DisponibiliteFilter
  date: string | null
}

interface AvailabilityDatePickerProps extends AvailabilityValue {
  variant: 'mobile' | 'mobile-inline' | 'desktop'
  onChange: (value: AvailabilityValue) => void
}

function CalendarPortal({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  if (!enabled || typeof document === 'undefined') return children
  return createPortal(children, document.body)
}

function DayButton(props: DayButtonProps) {
  const { modifiers, children } = props
  const buttonProps = omit(props, 'modifiers', 'children', 'day')

  return (
    <button
      {...buttonProps}
      className={clsx(
        'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-1',
        modifiers.selected
          ? 'bg-[#007DFF] text-white shadow-sm hover:bg-[#0069D9]'
          : modifiers.disabled
            ? 'pointer-events-none cursor-not-allowed text-[#C4CED8] opacity-45'
            : modifiers.outside
              ? 'text-[#B7C2CE] hover:bg-[#F4F8FC]'
              : 'text-[#243547] hover:bg-[#EBF4FF]',
        modifiers.today && !modifiers.selected && 'font-extrabold text-[#007DFF] ring-1 ring-[#B6DAF7]',
      )}
    >
      {children}
    </button>
  )
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
  return 'Toutes dates'
}

export function AvailabilityDatePicker({
  filter,
  date,
  variant,
  onChange,
}: AvailabilityDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [desktopPosition, setDesktopPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 90)
  const selected = date ? new Date(`${date}T00:00:00`) : undefined
  const isMobile = variant !== 'desktop'

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        containerRef.current
        && !containerRef.current.contains(target)
        && !panelRef.current?.contains(target)
      ) setOpen(false)
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (!open || variant !== 'desktop') return

    function updatePosition() {
      if (containerRef.current) {
        setDesktopPosition(desktopPanelPosition(containerRef.current))
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, variant])

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
    <div
      ref={containerRef}
      className={variant === 'mobile'
        ? 'relative border-t border-gray-100'
        : variant === 'mobile-inline'
          ? 'relative flex min-w-0 flex-[1.1] border-l border-[#E8EEF5]'
          : 'relative flex flex-[0.9] border-r border-gray-100'}
    >
      <button
        type="button"
        onClick={() => {
          if (!open && variant === 'desktop' && containerRef.current) {
            setDesktopPosition(desktopPanelPosition(containerRef.current))
          }
          setOpen((value) => !value)
        }}
        aria-label="Choisir une disponibilité"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={clsx(
          'flex w-full items-center gap-2.5 bg-transparent text-left outline-none transition-colors hover:bg-[#F8FBFF]',
          variant === 'mobile'
            ? 'min-h-[52px] px-3 py-3'
            : variant === 'mobile-inline'
              ? 'h-full min-h-[64px] px-3 py-3'
              : 'h-full min-h-[60px] px-4 py-3',
        )}
      >
        <CalendarDays
          className={clsx('h-5 w-5 shrink-0', isMobile ? 'text-[#007DFF]' : 'text-gray-400')}
          aria-hidden="true"
        />
        <span className={clsx('min-w-0 flex-1 truncate', variant === 'mobile' ? 'text-[14.5px]' : 'text-[14px]', date || filter !== 'all' ? 'font-semibold text-[#00263C]' : 'text-gray-600')}>
          {labelFor(filter, date)}
        </span>
        <ChevronDown className={clsx('h-4 w-4 shrink-0 text-[#607080] transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <CalendarPortal enabled>
          {isMobile && (
            <button
              type="button"
              aria-label="Fermer le calendrier"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[200] cursor-default bg-[#010C2D]/30 backdrop-blur-[2px]"
            />
          )}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal={isMobile ? true : undefined}
            aria-label="Calendrier des disponibilités"
            className={clsx(
              'rounded-[1.5rem] border border-[#DCE9F7] bg-white p-4 shadow-[0_20px_55px_rgba(1,12,45,0.20)]',
              isMobile
                ? 'fixed inset-x-3 bottom-3 z-[210] max-h-[calc(100dvh-1.5rem)] w-auto overflow-y-auto overscroll-contain'
                : 'fixed z-[210] w-[min(21.5rem,calc(100vw-2.5rem))]',
            )}
            style={variant === 'desktop' ? desktopPosition : undefined}
          >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-bold text-[#00263C]">Choisir une disponibilité</p>
              <p className="mt-0.5 text-xs text-[#607080]">Sélectionnez une période ou un jour précis.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le calendrier"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1F6FB] text-[#607080] transition-colors hover:bg-[#EBF4FF] hover:text-[#007DFF]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-[#F1F6FB] p-1" role="group" aria-label="Choix rapides">
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
              caption_label: 'text-sm font-bold text-[#00263C]',
              nav: 'flex items-center gap-1',
              button_previous: 'flex h-8 w-8 items-center justify-center rounded-full text-[#607080] transition-colors hover:bg-[#EBF4FF] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]',
              button_next: 'flex h-8 w-8 items-center justify-center rounded-full text-[#607080] transition-colors hover:bg-[#EBF4FF] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]',
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
        </CalendarPortal>
      )}
    </div>
  )
}
