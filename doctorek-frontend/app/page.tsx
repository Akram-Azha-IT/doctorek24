'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Search, UserRound, HelpCircle, ChevronRight, Loader2, Phone, Mail } from 'lucide-react'
import Logo from '@/components/Logo'

const POPULAR_SPECIALTIES = [
  { name: 'Médecin généraliste', icon: '/medecin.png' },
  { name: 'Chirurgien-dentiste', icon: '/dentiste.png' },
  { name: 'Pédiatre', icon: '/therapie.png' },
  { name: 'Gynécologue médical', icon: '/gynecologue.png' },
  { name: 'Ophtalmologue', icon: '/cardiologue.png' },
  { name: 'Dermatologue', icon: '/dermatologue.png' },
  { name: 'Ostéopathe', icon: '/massotherapie.png' },
  { name: 'Masseur-kinésithérapeute', icon: '/massotherapie.png' },
]

const FEATURES = [
  {
    icon: '/liste-de-controle.png',
    title: 'Accès rapide aux soins',
    desc: 'Trouvez un praticien disponible et prenez rendez-vous en ligne en quelques clics, 24h/24.',
  },
  {
    icon: '/securite-du-cloud.png',
    title: 'Données sécurisées',
    desc: 'Vos informations médicales sont protégées selon les standards de sécurité les plus stricts.',
  },
  {
    icon: '/chronologie.png',
    title: 'Gagnez du temps',
    desc: 'Rappels SMS automatiques, annulation en ligne et gestion de vos RDV en totale autonomie.',
  },
]

const STATS = [
  { value: '50 000+', label: 'Patients actifs' },
  { value: '2 000+', label: 'Praticiens' },
  { value: '30+', label: 'Spécialités' },
  { value: '24/7', label: 'Disponible' },
]

export default function HomePage() {
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
      () => {
        setGeoStatus('idle')
      },
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }

  return (
    <main className="min-h-screen bg-white font-sans text-[#333333]">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div
        className="bg-[#EBF4FF] relative z-10 w-full"
        style={{ boxShadow: '0 8px 40px rgba(0,125,255,0.10)' }}
      >
        {/* Soft top fade for navbar contrast */}
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

          {/* Blob behind doctor — sibling of image so multiply blend works against hero bg */}
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
                Trouvez votre médecin, prenez rendez-vous en ligne et gérez votre dossier médical — partout au Maroc, en quelques clics.
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

      {/* ── Promo Cards — float over hero curve ─────────────────── */}
      <div className="relative z-20 -mt-22 md:-mt-30 px-4 md:px-8">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-2 gap-4">

          <Link href="/login" className="group relative flex flex-col sm:flex-row rounded-2xl shadow-[0_4px_28px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.12)] transition-shadow">
            {/* Card bg + clipped circle blob */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none bg-white">
              <div className="absolute rounded-full bg-[#D0E8FF] w-[180px] h-[180px] sm:w-[210px] sm:h-[210px] right-4 bottom-4 sm:bottom-auto sm:right-5 sm:top-1/2 sm:-translate-y-1/2" />
              <div className="absolute rounded-full bg-[#B6DAF7] w-[130px] h-[130px] sm:w-[155px] sm:h-[155px] right-10 bottom-8 sm:bottom-auto sm:right-12 sm:top-1/2 sm:-translate-y-1/2" />
            </div>
            {/* Text */}
            <div className="relative z-10 flex-1 p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#465058] uppercase tracking-widest mb-3">Patients</p>
                <h3 className="text-[18px] font-bold text-[#00263C] leading-snug mb-2">
                  Votre carte médicale digitale,<br />toujours sur vous
                </h3>
                <p className="text-[#465058] text-[13px] leading-relaxed">
                  Groupe sanguin, allergies, contacts d'urgence — accessibles même sans connexion.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[#007DFF] font-semibold text-[14px] mt-5 group-hover:gap-2 transition-all">
                Découvrir <ChevronRight className="h-4 w-4" />
              </span>
            </div>
            {/* Phone — stacks below text on mobile, side panel on sm+ */}
            <div className="relative z-20 h-44 sm:h-auto sm:w-[43%] shrink-0">
              <div
                className="absolute bottom-0 top-[-16px] inset-x-[10%] sm:inset-x-0 sm:top-[-48px]"
                style={{ transform: 'rotate(-8deg)' }}
              >
                <Image
                  src="/card-hero.png"
                  alt="Carte médicale Doctorek"
                  fill
                  className="object-contain object-bottom drop-shadow-2xl"
                  sizes="(max-width: 640px) 70vw, 260px"
                />
              </div>
            </div>
          </Link>

          <Link href="/inscription?role=medecin" className="group relative flex flex-col sm:flex-row rounded-2xl shadow-[0_4px_28px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.12)] transition-shadow">
            {/* Card bg + clipped circle blob */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none bg-white">
              <div className="absolute rounded-full bg-[#D0E8FF] w-[200px] h-[200px] sm:w-[210px] sm:h-[210px] left-1/2 -translate-x-1/2 bottom-2 sm:left-auto sm:translate-x-0 sm:bottom-auto sm:right-5 sm:top-1/2 sm:-translate-y-1/2" />
              <div className="absolute rounded-full bg-[#B6DAF7] w-[148px] h-[148px] sm:w-[155px] sm:h-[155px] left-1/2 -translate-x-1/2 bottom-6 sm:left-auto sm:translate-x-0 sm:bottom-auto sm:right-12 sm:top-1/2 sm:-translate-y-1/2" />
            </div>
            {/* Text */}
            <div className="relative z-10 flex-1 p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-semibold text-[#465058] uppercase tracking-widest mb-3">Médecins</p>
                <h3 className="text-[18px] font-bold text-[#00263C] leading-snug mb-2">
                  Rejoignez Doctorek Pro<br />et gérez votre cabinet
                </h3>
                <p className="text-[#465058] text-[13px] leading-relaxed">
                  Agenda en ligne, rendez-vous patients et dossiers médicaux — tout en un.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[#007DFF] font-semibold text-[14px] mt-5 group-hover:gap-2 transition-all">
                Découvrir <ChevronRight className="h-4 w-4" />
              </span>
            </div>
            {/* Phone — stacks below text on mobile, side panel on sm+ */}
            <div className="relative z-20 h-52 sm:h-auto sm:w-[43%] shrink-0">
              <div
                className="absolute bottom-0 top-[-28px] inset-x-[5%] sm:inset-x-0 sm:top-[-48px]"
                style={{ transform: 'rotate(8deg)' }}
              >
                <Image
                  src="/medecin-carte-hero.png"
                  alt="Dashboard médecin Doctorek"
                  fill
                  className="object-contain object-bottom drop-shadow-2xl"
                  sizes="(max-width: 640px) 80vw, 260px"
                />
              </div>
            </div>
          </Link>

        </div>
      </div>

      {/* ── Stats Strip ─────────────────────────────────────────── */}
      <div className="px-4 md:px-8 mt-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="bg-[#EBF4FF] rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#D0E8FF]">
              {STATS.map((s, i) => (
                <div key={i} className="px-6 py-5 text-center">
                  <div className="text-[26px] font-bold text-[#007DFF] leading-none mb-1">{s.value}</div>
                  <div className="text-[12px] text-[#465058] uppercase tracking-wider font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="bg-white pb-20">

        {/* Specialties Section */}
        <section className="mx-auto max-w-[1400px] px-4 md:px-8 pt-14 mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[12px] font-semibold text-[#007DFF] uppercase tracking-widest mb-2">Annuaire</p>
              <h2 className="text-[24px] font-bold text-[#00263C]">Consultez votre spécialiste</h2>
              <p className="text-[#465058] text-sm mt-1">Plus de 30 spécialités disponibles dans tout le Maroc</p>
            </div>
            <Link
              href="/recherche"
              className="hidden md:inline-flex items-center gap-1 text-[#007DFF] text-[14px] font-semibold hover:underline flex-shrink-0"
            >
              Voir toutes <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {POPULAR_SPECIALTIES.map((spec, i) => (
              <button
                key={i}
                onClick={() => router.push(`/recherche?specialite=${encodeURIComponent(spec.name)}`)}
                className="group flex items-center gap-3 rounded-xl bg-[#EBF4FF] p-4 text-left shadow-sm transition-all hover:shadow-md border border-transparent hover:border-[#007DFF]/20 hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D0E8FF] to-[#B6DAF7]">
                  <Image src={spec.icon} alt={spec.name} width={26} height={26} />
                </div>
                <span className="flex-1 text-[13px] font-bold text-[#00263C] leading-snug">{spec.name}</span>
                <ChevronRight className="h-4 w-4 text-[#007DFF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
          <div className="mt-5 md:hidden text-center">
            <Link href="/recherche" className="inline-flex items-center gap-1 text-[#007DFF] text-[14px] font-semibold">
              Voir toutes les spécialités <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Features / Why Doctorek — Bento Layout */}
        <section className="mx-auto max-w-[1400px] px-4 md:px-8 pb-4">
          <div className="mb-8">
            <p className="text-[12px] font-semibold text-[#007DFF] uppercase tracking-widest mb-2">Nos engagements</p>
            <h2 className="text-[24px] font-bold text-[#00263C] mb-1">Pourquoi choisir Doctorek ?</h2>
            <p className="text-[#465058] text-[15px]">
              Un service conçu pour simplifier l'accès aux soins pour tous les Marocains.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-5">

            {/* Left: dark featured card */}
            <Link href="/login" className="group lg:w-[34%]">
              <div className="bg-[#00263C] rounded-2xl shadow-md p-7 h-full relative overflow-hidden group-hover:shadow-xl transition-shadow flex flex-col min-h-[300px]">
                <span className="absolute top-5 right-5 bg-[#2EB67D] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  Gratuit
                </span>
                {/* decorative depth circles */}
                <div className="absolute -bottom-14 -right-14 w-52 h-52 rounded-full bg-[#007DFF]/10 pointer-events-none" />
                <div className="absolute -bottom-7 -right-7 w-32 h-32 rounded-full bg-[#007DFF]/15 pointer-events-none" />

                <div className="w-14 h-14 rounded-xl bg-[#007DFF]/25 flex items-center justify-center mb-6 flex-shrink-0 relative z-10">
                  <Image src="/carte-de-membre.png" alt="Carte médicale" width={32} height={32} />
                </div>
                <h3 className="text-[20px] font-bold text-white mb-3 relative z-10">Carte médicale digitale</h3>
                <p className="text-[#B6DAF7] text-[14px] leading-relaxed flex-1 mb-5 relative z-10">
                  En cas d'urgence, les secours ont besoin de votre groupe sanguin, allergies et contacts. Soyez prêt en toute circonstance.
                </p>
                <span className="inline-flex items-center gap-1.5 text-[#3DA8FF] text-[14px] font-bold group-hover:gap-2.5 transition-all relative z-10">
                  Créer ma carte <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* Right: 3 cards in bento grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Wide top card */}
              <div className="md:col-span-2 bg-[#EBF4FF] rounded-2xl shadow-sm p-6 border border-[#D0E8FF] flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-[#D0E8FF] flex items-center justify-center flex-shrink-0">
                  <Image src={FEATURES[0].icon} alt={FEATURES[0].title} width={32} height={32} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#00263C] mb-2">{FEATURES[0].title}</h3>
                  <p className="text-[#465058] text-[14px] leading-relaxed">{FEATURES[0].desc}</p>
                </div>
              </div>

              {/* 2 smaller cards */}
              {FEATURES.slice(1).map((f, i) => (
                <div key={i} className="bg-[#EBF4FF] rounded-2xl shadow-sm p-6 border border-[#D0E8FF] flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-[#D0E8FF] flex items-center justify-center mb-4 flex-shrink-0">
                    <Image src={f.icon} alt={f.title} width={28} height={28} />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#00263C] mb-2">{f.title}</h3>
                  <p className="text-[#465058] text-[13px] leading-relaxed">{f.desc}</p>
                </div>
              ))}

            </div>
          </div>
        </section>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-[#00263C] pt-14 pb-0">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12">

            {/* Brand */}
            <div className="col-span-1">
              <div className="mb-4">
                <Logo className="h-10 w-auto" width={140} height={47} style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <p className="text-[#B6DAF7] text-[13px] leading-relaxed mb-6">
                La première plateforme numérique de santé au Maroc. Votre santé, notre engagement national.
              </p>
              <div className="flex flex-col gap-2">
                <a href="mailto:contact@doctorek.ma" className="flex items-center gap-2 text-[#B6DAF7] text-[13px] hover:text-white transition-colors">
                  <Mail className="h-4 w-4 text-[#007DFF]" />
                  contact@doctorek.ma
                </a>
                <a href="tel:+212500000000" className="flex items-center gap-2 text-[#B6DAF7] text-[13px] hover:text-white transition-colors">
                  <Phone className="h-4 w-4 text-[#007DFF]" />
                  +212 5 00 00 00 00
                </a>
              </div>
            </div>

            {/* Specialties */}
            <div>
              <h4 className="font-bold text-white text-[12px] mb-4 tracking-wide uppercase">Spécialités</h4>
              <ul className="space-y-3 text-[13px] text-[#B6DAF7]">
                {[
                  { label: 'Médecin généraliste', icon: '/medecin.png' },
                  { label: 'Pédiatre', icon: '/therapie.png' },
                  { label: 'Gynécologue', icon: '/gynecologue.png' },
                  { label: 'Dentiste', icon: '/dentiste.png' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href="/recherche" className="flex items-center gap-2 hover:text-white transition-colors">
                      <Image src={item.icon} alt={item.label} width={16} height={16} className="opacity-70" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Patients */}
            <div>
              <h4 className="font-bold text-white tracking-wide uppercase text-[12px] mb-4">Patients</h4>
              <ul className="space-y-3 text-[13px] text-[#B6DAF7]">
                <li><Link href="/recherche" className="hover:text-white transition-colors">Trouver un praticien</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
                <li><Link href="/inscription" className="hover:text-white transition-colors">Créer un compte</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Centre d'aide</Link></li>
              </ul>
            </div>

            {/* Professionals */}
            <div>
              <h4 className="font-bold text-white tracking-wide uppercase text-[12px] mb-4">Professionnels</h4>
              <ul className="space-y-3 text-[13px] text-[#B6DAF7]">
                <li><Link href="/inscription?role=medecin" className="hover:text-white transition-colors">Logiciel Doctorek Pro</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Espace médecin</Link></li>
              </ul>
            </div>

          </div>

          {/* Bottom strip */}
          <div className="border-t border-white/10 py-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-[12px] text-[#B6DAF7]">
              © {new Date().getFullYear()} Doctorek. Tous droits réservés.
            </p>
            <div className="flex gap-5 text-[12px] text-[#B6DAF7]">
              <Link href="#" className="hover:text-white transition-colors">Conditions générales</Link>
              <Link href="#" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="#" className="hover:text-white transition-colors">Mentions légales</Link>
            </div>
          </div>

        </div>
      </footer>
    </main>
  )
}
