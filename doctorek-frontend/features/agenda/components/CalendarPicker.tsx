'use client'

import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

const FR_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

interface DayModifiers {
  selected: boolean
  today: boolean
  disabled: boolean
  outside: boolean
  hidden: boolean
  [key: string]: boolean
}

// Custom day button — fully Tailwind-styled, no default CSS needed
function CalDayButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    day?: unknown
    modifiers?: DayModifiers
  },
) {
  const { modifiers = {}, children, day: _day, ...buttonProps } = props
  return (
    <button
      {...buttonProps}
      className={clsx(
        'mx-auto flex items-center justify-center w-9 h-9 rounded-full text-sm transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-zinc-900',
        modifiers.selected
          ? 'bg-zinc-900 text-white hover:bg-zinc-700'
          : modifiers.disabled
          ? 'opacity-25 cursor-not-allowed pointer-events-none'
          : modifiers.outside
          ? 'text-zinc-300 hover:bg-zinc-50'
          : 'text-zinc-700 hover:bg-zinc-100',
        modifiers.today && !modifiers.selected && 'font-bold text-blue-600 hover:bg-blue-50',
      )}
    >
      {children}
    </button>
  )
}

interface CalendarPickerProps {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  disabledDays: (date: Date) => boolean
}

export function CalendarPicker({ selected, onSelect, disabledDays }: CalendarPickerProps) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      weekStartsOn={1}
      disabled={disabledDays}
      showOutsideDays
      startMonth={new Date()}
      components={{
        DayButton: CalDayButton as React.ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>,
        Chevron: ({ orientation }: { orientation?: string }) =>
          orientation === 'left'
            ? <ChevronLeft className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />,
      }}
      classNames={{
        root: 'w-full select-none',
        months: 'w-full',
        month: 'w-full',
        month_caption: 'flex items-center justify-between mb-4',
        caption_label: 'text-sm font-semibold text-zinc-900',
        nav: 'flex items-center gap-1',
        button_previous: [
          'flex items-center justify-center w-7 h-7 rounded-md text-zinc-400',
          'hover:bg-zinc-100 hover:text-zinc-900 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
        ].join(' '),
        button_next: [
          'flex items-center justify-center w-7 h-7 rounded-md text-zinc-400',
          'hover:bg-zinc-100 hover:text-zinc-900 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
        ].join(' '),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex mb-1',
        weekday: 'flex-1 text-center text-xs font-medium text-zinc-400 pb-2',
        week: 'flex',
        day: 'flex-1 py-0.5 flex items-center justify-center',
        hidden: 'invisible',
      }}
      formatters={{
        formatMonthCaption: (month: Date) =>
          `${FR_MONTHS[month.getMonth()]} ${month.getFullYear()}`,
        formatWeekdayName: (weekday: Date) => {
          const names = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa']
          return names[weekday.getDay()]
        },
      }}
    />
  )
}
