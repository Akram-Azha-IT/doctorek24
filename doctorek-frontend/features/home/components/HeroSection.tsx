'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, UserRound, HelpCircle, ChevronRight, Globe, Check, MapPin } from 'lucide-react'
import Logo from '@/components/Logo'
import { CityInput } from '@/components/CityInput'
import { openAgent } from '@/features/agent/events'
import type { DisponibiliteFilter } from '@/lib/disponibilite'
import { AvailabilityDatePicker } from './AvailabilityDatePicker'

const LANGS = [
  { code: 'FR', label: 'Français' },
  { code: 'AR', label: 'العربية' },
]

export function HeroSection() {
  const [specialite, setSpecialite] = useState('')
  const [ville, setVille] = useState('')
  const [disponibilite, setDisponibilite] = useState<DisponibiliteFilter>('all')
  const [dateRecherche, setDateRecherche] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [lang, setLang] = useState('FR')
  const [langOpen, setLangOpen] = useState(false)
  const router = useRouter()

  function handleSearch(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (specialite) params.set('specialite', specialite)
    if (ville) params.set('ville', ville)
    if (disponibilite !== 'all') params.set('disponibilite', disponibilite)
    if (dateRecherche) params.set('date', dateRecherche)
    router.push(`/recherche?${params.toString()}`)
  }

  function handleNearby() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
            { headers: { 'Accept-Language': 'fr' } },
          )
          const data = await res.json()
          const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.county ?? ''
          if (city) setVille(city)
        } catch { /* ignore */ }
        setGeoLoading(false)
      },
      () => setGeoLoading(false),
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }

  function chooseLang(code: string) {
    setLang(code)
    setLangOpen(false)
    try { localStorage.setItem('doctorek_lang', code) } catch { /* ignore */ }
  }

  // Sélecteur de langue (préparation de la version arabe), style thème clair.
  const langSwitcher = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setLangOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={langOpen}
        aria-label="Changer de langue"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#007DFF]/30 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-[#007DFF] backdrop-blur-sm hover:bg-white transition-colors"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        {lang}
      </button>
      {langOpen && (
        <ul role="menu" className="absolute left-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl bg-white p-1 shadow-[0_12px_30px_rgba(1,12,45,0.18)] ring-1 ring-black/5">
          {LANGS.map((o) => (
            <li key={o.code}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={lang === o.code}
                onClick={() => chooseLang(o.code)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13.5px] text-[#243547] hover:bg-[#F0F4F8]"
              >
                {o.label}
                {lang === o.code && <Check className="h-4 w-4 text-[#007DFF]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div
      className="bg-[#EBF4FF] relative z-30 md:z-10 w-full"
      style={{ boxShadow: '0 8px 40px rgba(0,125,255,0.10)' }}
    >
      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #007DFF 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      {/* Decorative watermark, desktop only */}
      <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
        <svg
          className="absolute right-0 bottom-0 opacity-[0.05]"
          width="640" height="180" viewBox="0 0 640 180"
          style={{ transform: 'rotate(-3deg) translateY(20px)' }}
        >
          <text x="10" y="148" fontFamily="Georgia, 'Times New Roman', serif" fontSize="142" fontWeight="bold" fontStyle="italic" fill="#007DFF" letterSpacing="-5">Doctorek</text>
        </svg>
      </div>

      {/* ===================== HERO MOBILE ===================== */}
      <section className="relative overflow-hidden text-[#010C2D] md:hidden">
        <div className="relative z-30 flex h-16 items-center px-4">
          <div className="absolute left-4">{langSwitcher}</div>
          <Logo
            className="absolute left-1/2 top-1/2 h-8 w-auto -translate-x-1/2 -translate-y-1/2"
            width={132}
            height={44}
            priority
          />
          <a
            href="/login"
            aria-label="Se connecter"
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-[#007DFF] transition-opacity active:opacity-70"
          >
            <UserRound className="h-5 w-5" aria-hidden="true" />
            <span className="text-[13px] font-bold min-[370px]:text-[14px]">Se connecter</span>
          </a>
        </div>

        <div className="relative h-[265px] overflow-hidden px-5 pt-8">
          <div
            aria-hidden="true"
            className="absolute -right-1 top-5 h-[250px] w-[220px] overflow-hidden rounded-[52%_48%_44%_56%/45%_42%_58%_55%] bg-[#B6DAF7]"
          >
            <Image
              src="/hero-doctorek.png"
              alt=""
              fill
              priority
              className="object-cover object-[78%_42%] mix-blend-multiply"
              sizes="220px"
            />
          </div>
          <h1 className="relative z-10 font-[family-name:var(--font-jakarta)] text-[40px] font-extrabold leading-[0.98] tracking-[-0.05em] text-[#010C2D] min-[420px]:text-[44px]">
            <span className="block">Vivez</span>
            <span className="block">pleinement,</span>
            <span className="block whitespace-nowrap">en toute santé.</span>
          </h1>
        </div>

        <div className="relative z-20 -mt-9 px-4 pb-8">
          <form onSubmit={handleSearch} role="search" aria-label="Rechercher un médecin">
            <div className="overflow-hidden rounded-[24px] bg-white p-2 shadow-[0_16px_42px_rgba(0,45,120,0.16)] ring-1 ring-[#DDEAF6]">
              <div className="flex min-h-[62px] items-center gap-3 px-3.5">
                <Search className="h-[22px] w-[22px] shrink-0 text-[#007DFF]" aria-hidden="true" />
                <input
                  type="text"
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                  placeholder="Spécialité ou médecin"
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-[#8996A6] outline-none"
                />
              </div>

              <div className="flex min-h-[64px] items-stretch border-t border-[#E8EEF5]">
                <div className="flex min-w-0 flex-[0.9] items-center gap-2.5 px-3.5">
                  <MapPin className="h-[21px] w-[21px] shrink-0 text-[#007DFF]" aria-hidden="true" />
                  <CityInput
                    value={ville}
                    onChange={setVille}
                    onNearby={handleNearby}
                    nearbyLoading={geoLoading}
                    placeholder="Ville"
                    inputClassName="text-[14px] text-gray-900 placeholder:text-[#8996A6] focus-visible:outline-none"
                  />
                </div>
                <AvailabilityDatePicker
                  variant="mobile-inline"
                  filter={disponibilite}
                  date={dateRecherche}
                  onChange={(value) => {
                    setDisponibilite(value.filter)
                    setDateRecherche(value.date)
                  }}
                />
              </div>

              <button
                type="submit"
                className="mt-1 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[17px] bg-[#00263C] px-5 text-[15px] font-bold text-white transition-colors hover:bg-[#001C2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2 active:bg-[#001522]"
              >
                Rechercher
                <ChevronRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={openAgent}
            className="mt-4 flex min-h-[62px] w-full items-center gap-3 rounded-full border border-[#B9DAFA] bg-white/95 px-3 py-2 text-left shadow-[0_10px_28px_rgba(0,45,120,0.08)] transition-all hover:border-[#83C2FF] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EBF4FF] ring-1 ring-[#D0E8FF]">
              <Image src="/icone-doctorek.png" alt="" width={29} height={29} className="h-7 w-7" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#00263C] min-[370px]:text-[14px]">
              Demander à l’assistant Doctorek
            </span>
            <ChevronRight className="mr-1 h-5 w-5 shrink-0 text-[#007DFF]" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* ===================== DESKTOP (inchangé) ===================== */}
      <div className="hidden md:block absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#EBF4FF]/70 to-transparent pointer-events-none" />

      <nav className="hidden md:block relative z-50" aria-label="Navigation principale">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 md:px-8">
          <Logo className="h-10 w-auto" width={140} height={47} priority />
          <div className="flex items-center gap-5">
            {langSwitcher}
            <Link
              href="/inscription?role=medecin"
              className="inline-flex items-center justify-center rounded-md bg-[#007DFF] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#00263C]"
            >
              Vous êtes soignant ?
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center justify-center text-[#465058] hover:text-[#007DFF] transition-colors text-sm font-medium"
            >
              <HelpCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Aide
            </Link>
            <a href="/login" className="inline-flex items-center text-[#007DFF] hover:text-[#00263C] transition-colors gap-1.5">
              <UserRound className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-bold leading-tight">Se connecter</span>
            </a>
          </div>
        </div>
      </nav>

      <div className="hidden md:block mx-auto max-w-[1400px] px-4 pt-6 pb-52 md:px-8 relative">
        <div
          className="absolute pointer-events-none select-none"
          style={{
            right: '0px', bottom: '80px', width: '400px', height: '430px',
            background: 'linear-gradient(145deg, #B6DAF7 0%, #DFEFFE 100%)',
            borderRadius: '62% 38% 54% 46% / 55% 48% 52% 45%', zIndex: 2,
          }}
        />
        <div className="absolute right-4 pointer-events-none select-none" style={{ zIndex: 5, bottom: '120px' }}>
          <Image
            src="/hero-doctorek.png"
            alt="Médecin Doctorek"
            width={460}
            height={560}
            priority
            style={{ mixBlendMode: 'multiply', height: 'clamp(400px, 48vh, 390px)', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </div>

        <div className="relative z-20 translate-y-8">
          <div className="max-w-[920px]">
            <h1 className="mb-10 max-w-[900px] font-[family-name:var(--font-jakarta)] text-[clamp(3.25rem,4.5vw,4.25rem)] font-bold leading-[1.1] tracking-[-0.03em] text-[#010C2D]">
              Vivez pleinement, en toute santé.
            </h1>
          </div>

          <form onSubmit={handleSearch} role="search" aria-label="Rechercher un médecin" className="w-full max-w-[940px] relative z-30">
            <div className="flex flex-row items-stretch rounded-full bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)]">
              <div className="flex flex-[1.35] items-center gap-3 border-r border-gray-100 px-5 py-4">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                  placeholder="Spécialité ou médecin…"
                  className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 outline-none"
                />
              </div>
              <div className="relative flex flex-1 items-center gap-3 border-r border-gray-100 px-4 py-4">
                <svg className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                </svg>
                <CityInput
                  value={ville}
                  onChange={setVille}
                  onNearby={handleNearby}
                  nearbyLoading={geoLoading}
                  placeholder="Ville…"
                  inputClassName="text-[15px] text-gray-900 placeholder:text-gray-400 focus-visible:outline-none"
                />
              </div>
              <AvailabilityDatePicker
                variant="desktop"
                filter={disponibilite}
                date={dateRecherche}
                onChange={(value) => {
                  setDisponibilite(value.filter)
                  setDateRecherche(value.date)
                }}
              />
              <button
                type="submit"
                className="m-2 flex items-center justify-center gap-2 rounded-full bg-[#00263C] px-6 text-[15px] font-bold text-white outline-none transition-all hover:bg-[#001c2d]"
              >
                Rechercher
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={openAgent}
            className="group mt-3 flex w-full max-w-[590px] items-center gap-3 rounded-full border border-[#D0E8FF] bg-white/85 p-2 pr-4 text-left shadow-[0_8px_24px_rgba(0,45,120,0.09)] transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_30px_rgba(0,45,120,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EBF4FF]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EBF4FF] ring-1 ring-[#D0E8FF]">
              <Image src="/icone-doctorek.png" alt="" width={27} height={27} className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1 text-[14px] text-[#465058]">
              <strong className="font-bold text-[#00263C]">Vous ne savez pas quoi rechercher ?</strong>{' '}
              Demandez à l’assistant Doctorek.
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#007DFF] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
