'use client'

import { ChevronRight } from 'lucide-react'

interface HeroBannerProps {
  firstName: string
  lastName: string
  todayCount: number
  dateLabel: string
  onAgenda: () => void
}

export function HeroBanner({ firstName, lastName, todayCount, dateLabel, onAgenda }: HeroBannerProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const initials = ((firstName.charAt(0) ?? '') + (lastName.charAt(0) ?? '')).toUpperCase() || 'DR'
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-7 py-6"
      style={{
        background: 'linear-gradient(135deg, #0066DD 0%, #007DFF 45%, #3DA8FF 100%)',
        boxShadow: '0 8px 32px rgba(0,125,255,0.28)',
      }}
    >
      <svg
        className="pointer-events-none absolute top-0 right-0 h-full"
        viewBox="0 0 320 140" preserveAspectRatio="xMaxYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.18 }}
      >
        <path d="M320,0 C280,-10 210,30 195,80 C180,130 230,155 280,120 C330,85 350,20 320,0Z" fill="white" />
        <path d="M320,50 C295,35 255,55 248,90 C241,125 275,140 305,122 C335,104 345,65 320,50Z" fill="white" />
        <path d="M310,100 C292,92 270,105 268,125 C266,145 288,152 305,140 C322,128 328,108 310,100Z" fill="white" />
        <path d="M260,80 C275,60 295,45 320,40" fill="none" stroke="white" strokeWidth="1.2" opacity="0.5" />
        <path d="M268,125 C280,112 295,105 315,100" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      </svg>

      <div className="relative z-10 flex items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {dateLabel}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-white leading-tight">
            {greeting}{firstName ? `, Dr. ${firstName}` : ''} !
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
            {todayCount === 0
              ? "Aucun rendez-vous prévu aujourd'hui — profitez-en pour vous avancer."
              : `Vous avez ${todayCount} rendez-vous aujourd'hui. Bonne journée !`}
          </p>
          <button
            onClick={onAgenda}
            className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', backdropFilter: 'blur(4px)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.28)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.18)' }}
          >
            Ouvrir l'agenda <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden lg:flex flex-col items-center gap-3 shrink-0">
          <div className="relative">
            <div
              className="absolute rounded-full animate-ping"
              style={{ inset: -6, background: 'rgba(255,255,255,0.12)', animationDuration: '2.8s' }}
            />
            <div
              className="absolute rounded-full"
              style={{ inset: -3, border: '2px solid rgba(255,255,255,0.25)' }}
            />
            <div
              className="relative h-20 w-20 rounded-full flex items-center justify-center text-2xl font-black select-none"
              style={{
                background: 'rgba(255,255,255,0.20)',
                border: '3px solid rgba(255,255,255,0.55)',
                backdropFilter: 'blur(10px)',
                color: '#FFFFFF',
                letterSpacing: '0.05em',
              }}
            >
              {initials}
            </div>
            <div
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-black"
              style={{ background: '#2EB67D', border: '2.5px solid rgba(255,255,255,0.9)', color: '#FFFFFF', letterSpacing: '0.04em' }}
            >
              MD
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white leading-tight">
              {fullName ? `Dr. ${fullName}` : 'Docteur'}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>Médecin</p>
          </div>
        </div>
      </div>
    </div>
  )
}
