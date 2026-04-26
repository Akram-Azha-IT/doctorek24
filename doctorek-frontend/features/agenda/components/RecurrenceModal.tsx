'use client'

import { useState } from 'react'

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
]
const MONTH_SHORT = [
  'jan.','fév.','mars','avr.','mai','juin',
  'juil.','août','sept.','oct.','nov.','déc.',
]
const DAY_HEADERS = ['D','L','M','M','J','V','S']

function formatDateFR(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function buildCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()
  const days: (Date | null)[] = []

  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) days.push(null)

  return days
}

interface MiniCalendarProps {
  selected: Date
  onSelect: (d: Date) => void
}

function MiniCalendar({ selected, onSelect }: MiniCalendarProps) {
  const [viewYear, setViewYear] = useState(selected.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected.getMonth())

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const days = buildCalendarDays(viewYear, viewMonth)

  return (
    <div className="absolute z-50 mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-72">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-800">
          {MONTHS_FR[viewMonth]} {viewYear}
        </span>
        <div className="flex gap-1">
          <button type="button" onClick={prevMonth} className="rounded-full p-1 hover:bg-gray-100 transition-colors">
            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button type="button" onClick={nextMonth} className="rounded-full p-1 hover:bg-gray-100 transition-colors">
            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((h, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{h}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => {
          if (!day) return <div key={i} />
          const isSel = isSameDay(day, selected)
          const isToday = isSameDay(day, today)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(day)}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                isSel
                  ? 'bg-blue-600 text-white'
                  : isToday
                    ? 'border border-blue-400 text-blue-600 hover:bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface RecurrenceConfig {
  type: 'une_seule_fois' | 'toutes_les_semaines' | 'personnalise'
  interval?: number
  startDate?: Date
  endType?: 'jamais' | 'date'
  endDate?: Date
}

interface RecurrenceModalProps {
  onConfirm: (config: RecurrenceConfig) => void
  onCancel: () => void
}

export function RecurrenceModal({ onConfirm, onCancel }: RecurrenceModalProps) {
  const [interval, setInterval] = useState(2)
  const [startDate, setStartDate] = useState(new Date())
  const [endType, setEndType] = useState<'jamais' | 'date'>('date')
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    return d
  })
  const [openCal, setOpenCal] = useState<'start' | 'end' | null>(null)

  function toggleCal(which: 'start' | 'end') {
    setOpenCal(prev => prev === which ? null : which)
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-96 p-6" onMouseDown={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-gray-900 mb-5">Récurrence personnalisée</h2>

        {/* Interval */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-gray-700">Répéter tou(te)s les</span>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <input
              type="number"
              min={1}
              max={52}
              value={interval}
              onChange={e => setInterval(Math.max(1, Math.min(52, Number(e.target.value))))}
              className="w-14 text-center text-sm font-semibold text-gray-900 py-1.5 border-none outline-none"
            />
            <div className="flex flex-col border-l border-gray-200">
              <button
                type="button"
                onClick={() => setInterval(i => Math.min(52, i + 1))}
                className="px-1.5 py-0.5 hover:bg-gray-100 transition-colors"
              >
                <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setInterval(i => Math.max(1, i - 1))}
                className="px-1.5 py-0.5 hover:bg-gray-100 border-t border-gray-200 transition-colors"
              >
                <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            </div>
          </div>
          <span className="text-sm text-gray-700">semaine{interval > 1 ? 's' : ''}</span>
        </div>

        {/* Start date */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Début</p>
          <div className="flex items-center gap-3 relative">
            <div className="h-5 w-5 rounded-full border-2 border-blue-500 flex items-center justify-center shrink-0">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            </div>
            <button
              type="button"
              onClick={() => { toggleCal('start'); if (openCal === 'end') setOpenCal('start') }}
              className={`flex-1 text-left rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                openCal === 'start'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-800 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {formatDateFR(startDate)}
            </button>
            {openCal === 'start' && (
              <div className="absolute top-full left-8 mt-1 z-50">
                <MiniCalendar selected={startDate} onSelect={d => { setStartDate(d); setOpenCal(null) }} />
              </div>
            )}
          </div>
        </div>

        {/* End condition */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Se termine</p>

          {/* Jamais */}
          <div className="flex items-center gap-3 py-1.5">
            <button
              type="button"
              onClick={() => setEndType('jamais')}
              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                endType === 'jamais' ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              {endType === 'jamais' && <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
            </button>
            <span
              className="text-sm text-gray-700 cursor-pointer"
              onClick={() => setEndType('jamais')}
            >
              Jamais
            </span>
          </div>

          {/* End date */}
          <div className="flex items-center gap-3 py-1.5 relative">
            <button
              type="button"
              onClick={() => setEndType('date')}
              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                endType === 'date' ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              {endType === 'date' && <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
            </button>
            <button
              type="button"
              onClick={() => { setEndType('date'); toggleCal('end') }}
              className={`flex-1 text-left rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                openCal === 'end'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : endType === 'date'
                    ? 'border-blue-300 text-gray-800 hover:border-blue-400'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {formatDateFR(endDate)}
            </button>
            {openCal === 'end' && (
              <div className="absolute top-full left-8 mt-1 z-50">
                <MiniCalendar selected={endDate} onSelect={d => { setEndDate(d); setOpenCal(null) }} />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm({
                type: 'personnalise',
                interval,
                startDate,
                endType,
                endDate: endType === 'date' ? endDate : undefined,
              })
            }
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  )
}
