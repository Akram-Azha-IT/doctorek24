'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'
import Logo from '@/components/Logo'

interface AuthShellProps {
  eyebrow: string
  headline: ReactNode
  description: string
  bullets?: string[]
  children: ReactNode
  rightTitle: string
  rightSubtitle?: string
}

export function AuthShell({
  eyebrow,
  description,
  children,
  rightTitle,
  rightSubtitle,
}: AuthShellProps) {
  return (
    <div className="flex-1 w-full bg-[#EBF4FF] flex items-center justify-center py-2 px-4 min-h-0">
      <div className="w-full max-w-[1120px] rounded-3xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,125,255,0.18)] flex bg-white max-h-[calc(100vh-56px)]">

        {/* Left — dark panel */}
        <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-[#00263C]">

          {/* Organic corner blobs — #007DFF */}
          <div className="absolute -top-20 -left-20 w-[260px] h-[240px] blur-3xl" style={{ background: '#007DFF', opacity: 0.50, borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }} />
          <div className="absolute -top-14 -right-14 w-[200px] h-[180px] blur-2xl" style={{ background: '#007DFF', opacity: 0.35, borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }} />
          <div className="absolute -bottom-20 -left-14 w-[220px] h-[200px] blur-2xl" style={{ background: '#007DFF', opacity: 0.35, borderRadius: '70% 30% 50% 50% / 30% 60% 40% 70%' }} />
          <div className="absolute -bottom-14 -right-20 w-[240px] h-[220px] blur-3xl" style={{ background: '#007DFF', opacity: 0.45, borderRadius: '30% 70% 40% 60% / 50% 40% 60% 50%' }} />

          {/* Logo — centered, white */}
          <div className="relative z-10 flex justify-center pt-8">
            <Logo
              width={160}
              height={54}
              className="h-11 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
              href="/"
            />
          </div>

          {/* Illustration */}
          <div className="relative z-10 flex items-center justify-center flex-1 px-6">
            <div className="relative w-full max-w-[290px] aspect-square">
              <Image
                src="/login.png"
                alt="Doctorek"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="relative z-10 pb-8 px-8 text-center">
            <p className="text-[13px] font-bold text-[#3DA8FF] tracking-wide uppercase">
              {eyebrow}
            </p>
            <p className="mt-1.5 text-[12px] text-[#B6DAF7]/80 max-w-[220px] mx-auto leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Right — form panel (no logo — left panel owns it on desktop) */}
        <div className="flex flex-col justify-center bg-white px-8 py-5 w-full lg:flex-1 overflow-y-auto">

          {/* Mobile-only logo */}
          <div className="mb-5 self-center lg:hidden">
            <Logo width={120} height={40} className="h-8 w-auto" priority />
          </div>

          {/* Heading */}
          {(rightTitle || rightSubtitle) && (
            <div className="mb-3">
              {rightTitle && (
                <h2 className="font-[family-name:var(--font-jakarta)] text-[22px] font-extrabold leading-tight text-[#010C2D]">
                  {rightTitle}
                </h2>
              )}
              {rightSubtitle && (
                <p className="mt-1 text-[12px] text-[#465058]/80">{rightSubtitle}</p>
              )}
            </div>
          )}

          {/* Form */}
          <div className="flex flex-col gap-0">
            {children}
          </div>

          {/* Footer note */}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#465058]/50">
            <ShieldIcon />
            {`Données médicales protégées · CNDP Maroc`}
          </p>
        </div>
      </div>
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
