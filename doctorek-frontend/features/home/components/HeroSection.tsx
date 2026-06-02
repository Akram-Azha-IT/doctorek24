'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Search, UserRound, HelpCircle, ChevronRight, Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'

export function HeroSection() {
  const [specialite, setSpecialite] = useState('')
  const [ville, setVille] = useState('')
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const router = useRouter()

  function handleSearch(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (specialite) params.set('specialite', specialite)
    if (ville) params.set('ville', ville)
    router.push(`/recherche?${params.toString()}`)
  }

  function handleVilleFocus() {
    if (geoStatus !== 'idle' || !navigator.geolocation) return
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
            { headers: { 'Accept-Language': 'fr' } },
          )
          const data = await res.json()
          const city =
            data.address?.city ??
            data.address?.town ??
            data.address?.village ??
            data.address?.county ??
            ''
          if (city) setVille(city)
          setGeoStatus('done')
        } catch {
          setGeoStatus('idle')
        }
      },
      () => { setGeoStatus('idle') },
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }

  return (
    <div
      className="bg-[#EBF4FF] relative z-10 w-full"
      style={{ boxShadow: '0 8px 40px rgba(0,125,255,0.10)' }}
    >
      {/* Soft top fade */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#EBF4FF]/70 to-transparent pointer-events-none" />

      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #007DFF 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Decorative watermark */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
        <svg
          className="absolute right-0 bottom-0 opacity-[0.05]"
          width="640" height="180" viewBox="0 0 640 180"
          style={{ transform: 'rotate(-3deg) translateY(20px)' }}
        >
          <text
            x="10" y="148"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="142"
            fontWeight="bold"
            fontStyle="italic"
            fill="#007DFF"
            letterSpacing="-5"
          >
            Doctorek
          </text>
        </svg>
        <svg className="absolute left-0 top-1/2 -translate-y-1/2 opacity-[0.08]" width="180" height="220" viewBox="0 0 180 220" fill="none">
          <path d="M-10 80 Q40 30 90 70 Q140 110 170 50" stroke="#007DFF" strokeWidth="3.5" strokeLinecap="round"/>
          <path d="M-5 120 Q50 90 100 120 Q150 150 172 100" stroke="#007DFF" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 160 Q55 145 110 158 Q155 170 175 145" stroke="#007DFF" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Navbar */}
      <nav className="relative z-50">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 md:px-8">
          <Logo className="h-10 w-auto" width={140} height={47} priority />
          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href="/inscription?role=medecin"
              className="hidden md:inline-flex items-center justify-center rounded-md bg-[#007DFF] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#00263C]"
            >
              Vous êtes soignant ?
            </Link>
            <Link
              href="/help"
              className="hidden md:inline-flex items-center justify-center text-[#465058] hover:text-[#007DFF] transition-colors text-sm font-medium"
            >
              <HelpCircle className="h-4 w-4 mr-1.5" />
              Aide
            </Link>
            <Link href="/login" className="inline-flex items-center text-[#007DFF] hover:text-[#00263C] transition-colors gap-2">
              <UserRound className="h-5 w-5" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold leading-tight">Se connecter</span>
                <span className="text-[11px] leading-tight font-normal opacity-70">Gérer mes RDV</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="mx-auto max-w-[1400px] px-4 pt-4 pb-36 md:pt-6 md:pb-52 md:px-8 relative">

        {/* Blob behind doctor */}
        <div
          className="absolute hidden md:block pointer-events-none select-none"
          style={{
            right: '64px',
            bottom: '80px',
            width: '400px',
            height: '430px',
            background: 'linear-gradient(145deg, #B6DAF7 0%, #DFEFFE 100%)',
            borderRadius: '62% 38% 54% 46% / 55% 48% 52% 45%',
            zIndex: 2,
          }}
        />

        {/* Doctor image */}
        <div
          className="absolute right-4 md:right-20 hidden md:block pointer-events-none select-none"
          style={{ zIndex: 5, bottom: '120px' }}
        >
          <Image
            src="/hero-doctorek.png"
            alt="Médecin Doctorek"
            width={460}
            height={560}
            priority
            style={{
              mixBlendMode: 'multiply',
              height: 'clamp(400px, 48vh, 390px)',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        <div className="relative z-20">
          <div className="max-w-[640px]">
            <h1 className="text-[42px] font-bold tracking-tight text-[#010C2D] sm:text-5xl lg:text-[58px] mb-3 leading-[1.1]">
              Votre santé entre<br />de bonnes mains
            </h1>
            <p className="text-[#465058] text-[16px] mb-8 leading-relaxed max-w-lg">
              Trouvez votre médecin, prenez rendez-vous en ligne et gérez votre dossier médical partout au Maroc, en quelques clics.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="w-full max-w-[820px] relative z-30">
            <div className="flex flex-col md:flex-row items-stretch rounded-2xl md:rounded-full bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden">
              <div className="flex flex-[1.5] items-center gap-3 px-5 py-4 md:py-4 border-b md:border-b-0 md:border-r border-gray-100">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                  placeholder="Spécialité, médecin, établissement…"
                  className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-1 items-center gap-3 px-5 py-4 md:py-4">
                {geoStatus === 'loading'
                  ? <Loader2 className="h-5 w-5 shrink-0 text-[#007DFF] animate-spin" />
                  : <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
                }
                <input
                  type="text"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  onFocus={handleVilleFocus}
                  placeholder={geoStatus === 'loading' ? 'Localisation…' : 'Où ? (ex: Casablanca)'}
                  className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center bg-[#00263C] px-8 py-4 md:py-0 text-[15px] font-bold text-white transition-all hover:bg-[#001c2d] md:rounded-full md:m-2 gap-2 focus:outline-none"
              >
                Rechercher
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
