'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, UserRound, HelpCircle, ChevronRight, Globe, Check } from 'lucide-react'
import Logo from '@/components/Logo'
import { CityInput } from '@/components/CityInput'

const LANGS = [
  { code: 'FR', label: 'Français' },
  { code: 'AR', label: 'العربية' },
]

export function HeroSection() {
  const [specialite, setSpecialite] = useState('')
  const [ville, setVille] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [lang, setLang] = useState('FR')
  const [langOpen, setLangOpen] = useState(false)
  const router = useRouter()

  function handleSearch(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (specialite) params.set('specialite', specialite)
    if (ville) params.set('ville', ville)
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

      {/* ===================== HERO MOBILE (structure Doctolib, couleurs thème clair) ===================== */}
      <section className="md:hidden relative overflow-hidden text-[#010C2D]">
        {/* Blobs dessinés à la main, couleurs du thème, bas à droite */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute -right-8 bottom-1 h-56 w-56 opacity-70" viewBox="0 0 100 100" style={{ transform: 'rotate(-10deg)' }}>
            <path d="M53,7 C77,3 95,23 91,47 C88,69 73,96 46,91 C23,87 5,70 11,44 C16,22 33,12 53,7 Z" fill="#B6DAF7" />
          </svg>
          <svg className="absolute -right-10 -bottom-8 h-44 w-44 opacity-55" viewBox="0 0 100 100" style={{ transform: 'rotate(8deg)' }}>
            <path d="M47,9 C71,4 93,21 90,45 C87,67 76,96 49,92 C27,89 7,73 10,47 C13,25 29,14 47,9 Z" fill="#7FC0FF" />
          </svg>
          <svg className="absolute right-7 bottom-28 h-11 w-11 opacity-90" viewBox="0 0 100 100" style={{ transform: 'rotate(-14deg)' }}>
            <path d="M50,11 C69,7 91,24 86,49 C82,68 65,91 45,86 C27,82 11,65 16,45 C20,27 35,15 50,11 Z" fill="#ECB22E" />
          </svg>
        </div>

        {/* Barre du haut : langue, logo (couleurs d'origine), connexion */}
        <div className="relative z-20 flex items-center justify-between px-4 pt-4">
          {langSwitcher}
          <Logo className="h-8 w-auto" width={132} height={44} priority />
          <a href="/login" aria-label="Se connecter" className="inline-flex items-center gap-1.5 text-[#007DFF] active:opacity-80">
            <UserRound className="h-5 w-5" aria-hidden="true" />
            <span className="text-[14px] font-bold">Se connecter</span>
          </a>
        </div>

        {/* Titre */}
        <div className="relative z-10 px-6 pt-8 pb-2 text-center">
          <h1 className="text-[34px] font-extrabold leading-[1.12] tracking-tight text-[#010C2D]">
            Votre santé entre
            <br />
            de bonnes mains
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-[#465058]">
            Trouvez votre médecin, prenez rendez-vous en ligne et gérez votre dossier médical partout au Maroc.
          </p>
        </div>

        {/* Recherche réelle (spécialité + ville) */}
        <div className="relative z-10 px-5 pb-28 pt-5">
          <form onSubmit={handleSearch} role="search" aria-label="Rechercher un médecin">
            <div className="rounded-2xl bg-white p-2 shadow-[0_12px_38px_rgba(0,45,120,0.16)]">
              <div className="flex items-center gap-2.5 border-b border-gray-100 px-3 py-3">
                <Search className="h-5 w-5 shrink-0 text-[#007DFF]" aria-hidden="true" />
                <input
                  type="text"
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                  placeholder="Spécialité ou médecin…"
                  className="w-full bg-transparent text-[14.5px] text-gray-900 placeholder:text-gray-400 outline-none"
                />
              </div>
              <div className="flex items-center gap-2.5 px-3 py-3">
                <svg className="h-5 w-5 shrink-0 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
                </svg>
                <CityInput
                  value={ville}
                  onChange={setVille}
                  onNearby={handleNearby}
                  nearbyLoading={geoLoading}
                  placeholder="Ville…"
                  inputClassName="text-[14.5px] text-gray-900 placeholder:text-gray-400 focus-visible:outline-none"
                />
              </div>
              <button
                type="submit"
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00263C] py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-[#001c2d]"
              >
                Rechercher
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Carte médicale digitale, en chevauchement (mobile) */}
      <div className="md:hidden relative z-20 -mt-16 px-4 pb-2">
        <Link
          href="/inscription?role=patient"
          className="flex items-stretch gap-3 rounded-2xl bg-white p-4 no-underline shadow-[0_14px_36px_rgba(1,12,45,0.14)] ring-1 ring-[#EAF0F6]"
        >
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center rounded-full bg-[#DFEFFE] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#007DFF]">
              Carte santé digitale
            </span>
            <p className="mt-1.5 text-[15.5px] font-extrabold leading-snug text-[#010C2D]">
              Votre santé, sécurisée dans votre poche
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#465058]">
              Ajoutez votre carte à Google&nbsp;Wallet ou Apple&nbsp;Wallet. Vos infos vitales, partout, même hors ligne.
            </p>
            <span className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-bold text-[#007DFF]">
              Découvrir
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
          <div className="relative flex-none self-center">
            <svg
              className="absolute left-1/2 top-1/2 h-[138px] w-[138px] -translate-x-1/2 -translate-y-1/2"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <path d="M51,7 C75,4 95,23 92,48 C89,71 75,96 47,92 C24,89 6,71 10,45 C14,23 31,10 51,7 Z" fill="#B6DAF7" opacity="0.85" />
            </svg>
            <Image
              src="/carte-phone.png"
              alt="Carte médicale digitale Doctorek"
              width={104}
              height={104}
              className="relative h-[94px] w-auto object-contain drop-shadow-[0_8px_16px_rgba(1,12,45,0.14)]"
            />
          </div>
        </Link>
      </div>

      {/* Bouton soignant (mobile), sous la carte */}
      <div className="md:hidden relative z-20 px-4 pt-2 pb-6">
        <Link
          href="/inscription?role=medecin"
          className="block rounded-2xl bg-[#010C2D] px-6 py-4 text-center text-[15px] font-bold text-white no-underline shadow-[0_10px_28px_rgba(1,12,45,0.22)] transition-transform active:scale-[0.99]"
        >
          Vous êtes soignant ?
        </Link>
      </div>

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
            right: '64px', bottom: '80px', width: '400px', height: '430px',
            background: 'linear-gradient(145deg, #B6DAF7 0%, #DFEFFE 100%)',
            borderRadius: '62% 38% 54% 46% / 55% 48% 52% 45%', zIndex: 2,
          }}
        />
        <div className="absolute right-20 pointer-events-none select-none" style={{ zIndex: 5, bottom: '120px' }}>
          <Image
            src="/hero-doctorek.png"
            alt="Médecin Doctorek"
            width={460}
            height={560}
            priority
            style={{ mixBlendMode: 'multiply', height: 'clamp(400px, 48vh, 390px)', width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </div>

        <div className="relative z-20">
          <div className="max-w-[640px]">
            <h1 className="text-[42px] lg:text-[58px] font-bold tracking-tight text-[#010C2D] mb-3 leading-[1.18]">
              Votre santé entre<br />de bonnes mains
            </h1>
            <p className="text-[#465058] text-[16px] mb-8 leading-relaxed max-w-lg">
              Trouvez votre médecin, prenez rendez-vous en ligne et gérez votre dossier médical partout au Maroc.
            </p>
          </div>

          <form onSubmit={handleSearch} role="search" aria-label="Rechercher un médecin" className="w-full max-w-[820px] relative z-30">
            <div className="flex flex-row items-stretch rounded-full bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)]">
              <div className="flex flex-[1.5] items-center gap-3 px-5 py-4 border-r border-gray-100">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                  placeholder="Spécialité ou médecin…"
                  className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 outline-none"
                />
              </div>
              <div className="flex flex-1 items-center gap-3 px-5 py-4 relative">
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
              <button
                type="submit"
                className="flex items-center justify-center bg-[#00263C] px-8 text-[15px] font-bold text-white transition-all hover:bg-[#001c2d] rounded-full m-2 gap-2 outline-none"
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
