'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Search, UserRound, HelpCircle, Activity, ChevronRight, Loader2, Phone, Mail } from 'lucide-react'

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

export default function HomePage() {
  const [specialite, setSpecialite] = useState('')
  const [ville, setVille] = useState('')
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
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
    <main className="min-h-screen bg-[#F0F2F5] font-sans text-[#333333]">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="bg-[#007DFF] relative z-10 w-full overflow-hidden rounded-b-[70px] md:rounded-b-[100px]">

        {/* Full-bleed hero background image */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/home-page-image-doctorek.png"
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: '68% center' }}
            priority
          />
          {/* directional overlay: opaque on left (text readable), fade to translucent on right (faces show) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#007DFF] from-40% via-[#007DFF]/80 via-65% to-[#007DFF]/30" />
          {/* top overlay: ensures nav text always readable regardless of image content */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#007DFF]/90 to-transparent" />
        </div>

        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        {/* Decorative handmade "Doctorek" watermark */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
          <svg
            className="absolute right-0 bottom-0 opacity-[0.07]"
            width="640" height="180" viewBox="0 0 640 180"
            style={{ transform: 'rotate(-3deg) translateY(20px)' }}
          >
            <text
              x="10" y="148"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize="142"
              fontWeight="bold"
              fontStyle="italic"
              fill="white"
              letterSpacing="-5"
            >
              Doctorek
            </text>
          </svg>
          {/* brush-stroke accents */}
          <svg className="absolute left-0 top-1/2 -translate-y-1/2 opacity-[0.055]" width="180" height="220" viewBox="0 0 180 220" fill="none">
            <path d="M-10 80 Q40 30 90 70 Q140 110 170 50" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M-5 120 Q50 90 100 120 Q150 150 172 100" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M5 160 Q55 145 110 158 Q155 170 175 145" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Navbar */}
        <nav className="relative z-50">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 md:px-8">
            <Link href="/" className="flex flex-col items-start leading-none gap-0.5">
              <span
                className="text-[27px] font-bold tracking-tight text-white"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', textShadow: '0 2px 12px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)' }}
              >
                Doctorek
              </span>
            </Link>
            <div className="flex items-center gap-4 md:gap-6">
              <Link
                href="/inscription?role=medecin"
                className="hidden md:inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-bold text-[#00263C] transition-colors hover:bg-gray-50"
              >
                Vous êtes soignant ?
              </Link>
              <Link
                href="/help"
                className="hidden md:inline-flex items-center justify-center text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                <HelpCircle className="h-4 w-4 mr-1.5" />
                Aide
              </Link>
              <Link href="/login" className="inline-flex items-center text-white hover:text-blue-100 transition-colors gap-2">
                <UserRound className="h-5 w-5" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold leading-tight">Se connecter</span>
                  <span className="text-[11px] leading-tight font-normal opacity-80">Gérer mes RDV</span>
                </div>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="mx-auto max-w-[1400px] px-4 pt-14 pb-36 md:pt-20 md:pb-52 md:px-8 relative">
          <div className="max-w-[640px] relative z-20">

            <h1 className="text-[42px] font-bold tracking-tight text-white sm:text-5xl lg:text-[58px] mb-3 leading-[1.1]">
              Votre santé entre<br />de bonnes mains
            </h1>
            <p className="text-white/70 text-[16px] mb-8 leading-relaxed max-w-lg">
              Trouvez votre médecin, prenez rendez-vous en ligne et gérez votre dossier médical — partout au Maroc, en quelques clics.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full relative z-30">
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
      <div className="relative z-20 -mt-16 md:-mt-20 px-4 md:px-8">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Card 1 — Carte médicale */}
          <Link href="/login" className="group flex bg-white rounded-2xl overflow-hidden shadow-[0_4px_28px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.16)] transition-shadow min-h-[180px]">
            <div className="flex-1 p-7 flex flex-col justify-between">
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
            <div className="w-[38%] bg-[#EBF5FF] flex items-center justify-center">
              <Image src="/carte-de-membre.png" alt="Carte médicale" width={80} height={80} className="opacity-85" />
            </div>
          </Link>

          {/* Card 2 — Espace médecins */}
          <Link href="/inscription?role=medecin" className="group flex bg-white rounded-2xl overflow-hidden shadow-[0_4px_28px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.16)] transition-shadow min-h-[180px]">
            <div className="flex-1 p-7 flex flex-col justify-between">
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
            <div className="w-[38%] bg-[#EBF5FF] flex items-center justify-center">
              <Image src="/medecin.png" alt="Espace médecin" width={80} height={80} className="opacity-85" />
            </div>
          </Link>

        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="bg-[#F0F2F5] pb-20">

        {/* Specialties Section */}
        <section className="mx-auto max-w-[1400px] px-4 md:px-8 pt-14 mb-16">
          <div className="flex items-end justify-between mb-7">
            <div>
              <h2 className="text-[22px] font-bold text-[#00263C]">Consultez votre spécialiste</h2>
              <p className="text-[#465058] text-sm mt-1">Plus de 30 spécialités disponibles dans tout le Maroc</p>
            </div>
            <Link
              href="/recherche"
              className="hidden md:inline-flex items-center gap-1 text-[#007DFF] text-[14px] font-semibold hover:underline flex-shrink-0"
            >
              Voir toutes les spécialités <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {POPULAR_SPECIALTIES.map((spec, i) => (
              <button
                key={i}
                onClick={() => router.push(`/recherche?specialite=${encodeURIComponent(spec.name)}`)}
                className="flex items-center gap-4 rounded-xl bg-white p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-[#007DFF]/30 border border-transparent"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E6F2FF]">
                  <Image src={spec.icon} alt={spec.name} width={28} height={28} />
                </div>
                <span className="text-[14px] font-bold text-[#00263C] leading-snug">{spec.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 md:hidden text-center">
            <Link href="/recherche" className="inline-flex items-center gap-1 text-[#007DFF] text-[14px] font-semibold">
              Voir toutes les spécialités <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-[1400px] px-4 md:px-8 pb-4">
          <div className="mb-10">
            <h2 className="text-[24px] font-bold text-[#00263C] mb-2">Pourquoi choisir Doctorek ?</h2>
            <p className="text-[#465058] text-[15px]">
              Un service conçu pour simplifier l'accès aux soins pour tous les Marocains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Carte médicale — dark featured card */}
            <Link href="/login" className="group">
              <div className="bg-[#00263C] rounded-2xl shadow-md p-6 h-full relative overflow-hidden group-hover:shadow-xl transition-shadow flex flex-col">
                <span className="absolute top-4 right-4 bg-[#2EB67D] text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  Gratuit
                </span>
                <div className="w-14 h-14 rounded-xl bg-[#007DFF]/25 flex items-center justify-center mb-5 flex-shrink-0">
                  <Image src="/carte-de-membre.png" alt="Carte médicale" width={32} height={32} />
                </div>
                <h3 className="text-[17px] font-bold text-white mb-2">Carte médicale digitale</h3>
                <p className="text-[#B6DAF7] text-[13px] leading-relaxed flex-1 mb-4">
                  En cas d'urgence, les secours ont besoin de votre groupe sanguin, allergies et contacts. Soyez prêt.
                </p>
                <span className="inline-flex items-center gap-1.5 text-[#3DA8FF] text-[13px] font-bold group-hover:gap-2.5 transition-all">
                  Créer ma carte <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* 3 white feature cards */}
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col border border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-[#E6F2FF] flex items-center justify-center mb-5 flex-shrink-0">
                  <Image src={f.icon} alt={f.title} width={32} height={32} />
                </div>
                <h3 className="text-[17px] font-bold text-[#00263C] mb-2">{f.title}</h3>
                <p className="text-[#465058] text-[14px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-[#00263C] pt-14 pb-0">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12">

            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-[#007DFF]" />
                <span className="text-xl font-bold text-white italic">Doctorek</span>
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
              <h4 className="font-bold text-white text-[14px] mb-4 tracking-wide uppercase text-[12px]">Spécialités</h4>
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
