'use client'

interface HeroBannerProps {
  firstName: string
  lastName: string
  todayCount: number
  dateLabel: string
  onAgenda: () => void
}

export function HeroBanner({ firstName, lastName, todayCount, dateLabel }: HeroBannerProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const initials = ((firstName.charAt(0) ?? '') + (lastName.charAt(0) ?? '')).toUpperCase() || 'DR'
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 py-5 md:px-8 md:py-6"
      style={{
        background: 'linear-gradient(135deg, #0055BB 0%, #007DFF 50%, #3DA8FF 100%)',
        boxShadow: '0 8px 32px rgba(0,125,255,0.28)',
      }}
    >
      {/* Subtle mesh */}
      <svg
        className="pointer-events-none absolute top-0 right-0 h-full"
        viewBox="0 0 320 140" preserveAspectRatio="xMaxYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.13 }}
      >
        <path d="M320,0 C280,-10 210,30 195,80 C180,130 230,155 280,120 C330,85 350,20 320,0Z" fill="white" />
        <path d="M320,50 C295,35 255,55 248,90 C241,125 275,140 305,122 C335,104 345,65 320,50Z" fill="white" />
        <path d="M310,100 C292,92 270,105 268,125 C266,145 288,152 305,140 C322,128 328,108 310,100Z" fill="white" />
      </svg>

      <div className="relative z-10 flex items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70 mb-1">
            {dateLabel}
          </p>
          <h1 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
            {greeting}{firstName ? `, Dr. ${firstName}` : ''} !
          </h1>
          <p className="mt-2 text-sm text-white/85 leading-relaxed max-w-md">
            {todayCount === 0
              ? "Journée libre — aucun rendez-vous planifié aujourd'hui."
              : todayCount === 1
              ? "Vous avez 1 rendez-vous prévu aujourd'hui."
              : `Vous avez ${todayCount} rendez-vous aujourd'hui.`}
          </p>

          {/* Status pills */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[12px] font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2EB67D]" />
              En ligne
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-[12px] font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ECB22E]" />
              {todayCount} RDV aujourd&apos;hui
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div className="hidden lg:flex flex-col items-center gap-2.5 shrink-0">
          <div className="relative">
            <div
              className="absolute rounded-full"
              style={{ inset: -4, border: '1.5px solid rgba(255,255,255,0.22)' }}
            />
            <div
              className="relative h-[72px] w-[72px] rounded-full flex items-center justify-center text-xl font-black select-none"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '2.5px solid rgba(255,255,255,0.5)',
                backdropFilter: 'blur(12px)',
                color: '#FFFFFF',
                letterSpacing: '0.05em',
              }}
            >
              {initials}
            </div>
            <div
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-black"
              style={{ background: '#2EB67D', border: '2px solid rgba(255,255,255,0.9)', color: '#FFFFFF' }}
            >
              MD
            </div>
          </div>
          <p className="text-[12px] font-bold text-white/90 leading-tight text-center">
            {fullName ? `Dr. ${fullName}` : 'Docteur'}
          </p>
        </div>
      </div>
    </div>
  )
}
