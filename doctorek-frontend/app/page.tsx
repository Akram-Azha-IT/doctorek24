'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Search, Calendar, ShieldCheck, Clock, UserRound, HelpCircle, Activity, ChevronRight, Loader2 } from 'lucide-react'

const POPULAR_SPECIALTIES = [
  { name: 'Médecin généraliste', icon: <Activity className="h-6 w-6 text-[#007DFF]" /> },
  { name: 'Chirurgien-dentiste', icon: <Activity className="h-6 w-6 text-[#007DFF]" /> },
  { name: 'Pédiatre', icon: <Activity className="h-6 w-6 text-[#007DFF]" /> },
  { name: 'Gynécologue médical', icon: <Activity className="h-6 w-6 text-[#007DFF]" /> },
  { name: 'Ophtalmologue', icon: <Activity className="h-6 w-6 text-[#007DFF]" /> },
  { name: 'Dermatologue', icon: <Activity className="h-6 w-6 text-[#007DFF]" /> },
  { name: 'Ostéopathe', icon: <Activity className="h-6 w-6 text-[#007DFF]" /> },
  { name: 'Masseur-kinésithérapeute', icon: <Activity className="h-6 w-6 text-[#007DFF]" /> },
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
    <main className="min-h-screen bg-[#F0F2F5] font-sans text-gray-900">
      
      {/* ── Hero Section Wrapper (Includes Navbar) ─────────────────── */}
      <div className="bg-[#007DFF] rounded-b-[40px] md:rounded-b-[80px] relative z-10 w-full overflow-hidden">
        
        {/* Navbar merged with hero */}
        <nav className="relative z-50">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 md:px-8">
            <div className="flex items-center">
              <Link href="/" className="text-[28px] font-bold tracking-tight text-white flex items-center gap-2" style={{ fontFamily: 'sans-serif' }}>
                <span className="italic">Doctorek</span>
              </Link>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <Link
                href="/inscription?role=medecin"
                className="hidden md:inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-bold text-[#00263C] transition-colors hover:bg-gray-50"
              >
                Vous êtes soignant ?
              </Link>
              <Link
                href="/help"
                className="hidden md:inline-flex items-center justify-center text-white hover:text-blue-100 transition-colors text-sm font-semibold"
              >
                <HelpCircle className="h-4 w-4 mr-1.5" />
                Centre d'aide
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center text-white hover:text-blue-100 transition-colors"
              >
                <UserRound className="mr-2 h-5 w-5" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold leading-tight">Se connecter</span>
                  <span className="text-[11px] leading-tight font-normal opacity-90">Gérer mes RDV</span>
                </div>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="mx-auto max-w-[1400px] px-4 pt-10 pb-32 md:pt-16 md:pb-48 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
          
          <div className="max-w-2xl relative z-20">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[44px] mb-8 leading-tight">
              Vivez en meilleure santé
            </h1>

            {/* Search Bar Container */}
            <form onSubmit={handleSearch} className="w-full relative z-30">
              <div className="flex flex-col md:flex-row items-stretch rounded-xl md:rounded-full bg-white shadow-2xl overflow-hidden pl-2">
                
                {/* Speciality Input */}
                <div className="flex flex-[1.5] items-center gap-3 px-4 py-4 md:py-3 border-b md:border-b-0 md:border-r border-gray-200">
                  <Search className="h-5 w-5 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    value={specialite}
                    onChange={(e) => setSpecialite(e.target.value)}
                    placeholder="Nom, spécialité, établissement,..."
                    className="w-full bg-transparent text-base text-gray-900 placeholder:text-gray-500 focus:outline-none"
                  />
                </div>

                {/* Location Input */}
                <div className="flex flex-1 items-center gap-3 px-4 py-4 md:py-3">
                  {geoStatus === 'loading'
                    ? <Loader2 className="h-5 w-5 shrink-0 text-[#007DFF] animate-spin" />
                    : <MapPin className="h-5 w-5 text-gray-500 shrink-0" />
                  }
                  <input
                    type="text"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    onFocus={handleVilleFocus}
                    placeholder={geoStatus === 'loading' ? 'Localisation…' : 'Où ? (ex: Casablanca)'}
                    className="w-full bg-transparent text-base text-gray-900 placeholder:text-gray-500 focus:outline-none"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="mt-2 md:mt-0 flex items-center justify-center bg-[#00263C] px-8 py-4 md:py-3 text-[15px] font-bold text-white transition-all hover:bg-[#001c2d] md:rounded-full md:m-1.5 focus:outline-none"
                >
                  <span className="mr-2">Rechercher</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
          
          {/* Hero Image - Doctolib style overlapping image */}
          <div className="hidden lg:block absolute right-0 bottom-0 h-[110%] w-[55%] pointer-events-none">
             {/* Decorative blob behind the image to match screenshot */}
             <div className="absolute top-1/4 right-20 w-[600px] h-[600px] bg-[#2190FF] rounded-full blur-2xl opacity-50"></div>
             <div className="relative w-full h-full">
                <Image
                  src="/home-page-image-doctorek.png"
                  alt="Patient et professionnel de santé au Maroc"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  style={{ objectFit: 'contain', objectPosition: 'bottom right' }}
                  className="z-10"
                  priority
                />
             </div>
          </div>
        </div>
      </div>

      {/* ── Overlapping Cards Section ───────────────────────────── */}
      <div className="mx-auto max-w-[1400px] px-4 md:px-8 relative z-20 -mt-20 md:-mt-24 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-row items-center justify-between hover:shadow-xl transition-shadow cursor-pointer h-40">
            <div className="flex flex-col justify-between h-full w-2/3 pr-4">
              <p className="text-[#00263C] text-[15px] font-medium leading-snug">
                Découvrez notre innovation :<br/>l'Assistant de consultation Doctorek
              </p>
              <span className="text-[#007DFF] font-bold text-sm hover:underline mt-4">
                Je découvre
              </span>
            </div>
            <div className="w-1/3 h-full relative rounded-xl overflow-hidden bg-gray-100">
               {/* Fallback pattern/color if image isn't available */}
               <div className="absolute inset-0 bg-blue-50 flex items-center justify-center">
                 <Activity className="h-8 w-8 text-blue-200" />
               </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-row items-center justify-between hover:shadow-xl transition-shadow cursor-pointer h-40">
            <div className="flex flex-col justify-between h-full w-2/3 pr-4">
              <p className="text-[#00263C] text-[15px] font-medium leading-snug">
                Accédez aux meilleurs soins : téléconsultation et spécialistes au Maroc.
              </p>
              <span className="text-[#007DFF] font-bold text-sm hover:underline mt-4">
                Découvrir
              </span>
            </div>
            <div className="w-1/3 h-full relative rounded-xl overflow-hidden bg-gray-100">
               <div className="absolute inset-0 bg-blue-50 flex items-center justify-center">
                 <Calendar className="h-8 w-8 text-blue-200" />
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="bg-[#F0F2F5] pb-16">
        
        {/* Popular Specialties Section */}
        <section className="mx-auto max-w-[1400px] px-4 md:px-8 mb-16">
          <h2 className="text-[22px] font-bold text-[#00263C] mb-6">Recherches fréquentes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {POPULAR_SPECIALTIES.map((spec, i) => (
              <button
                key={i}
                onClick={() => {
                  setSpecialite(spec.name)
                  router.push(`/recherche?specialite=${encodeURIComponent(spec.name)}`)
                }}
                className="flex items-center gap-4 rounded-xl bg-white p-4 text-left shadow-sm transition-all hover:shadow-md border border-transparent hover:border-gray-200"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E6F2FF]">
                  {spec.icon}
                </div>
                <span className="text-[15px] font-bold text-[#00263C]">{spec.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Why choose Doctorek Section */}
        <section className="mx-auto max-w-[1400px] px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm text-[#007DFF]">
                <Calendar className="h-10 w-10" />
              </div>
              <h3 className="text-[19px] font-bold text-[#00263C] mb-3">Accès rapide aux soins</h3>
              <p className="text-[#00263C] text-[15px] leading-relaxed max-w-sm">
                Trouvez un praticien disponible et prenez rendez-vous en ligne en quelques clics, à tout moment.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm text-[#007DFF]">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h3 className="text-[19px] font-bold text-[#00263C] mb-3">Données sécurisées</h3>
              <p className="text-[#00263C] text-[15px] leading-relaxed max-w-sm">
                Vos informations personnelles et médicales sont protégées selon les normes de sécurité les plus strictes.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm text-[#007DFF]">
                <Clock className="h-10 w-10" />
              </div>
              <h3 className="text-[19px] font-bold text-[#00263C] mb-3">Gagnez du temps</h3>
              <p className="text-[#00263C] text-[15px] leading-relaxed max-w-sm">
                Recevez des rappels par SMS et gérez vos rendez-vous (annulation, déplacement) en toute autonomie.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="text-2xl font-bold tracking-tight text-[#00263C] flex items-center gap-2 mb-4">
                <Activity className="h-6 w-6 text-[#007DFF]" />
                Doctorek
              </Link>
              <p className="text-sm text-gray-500 mb-6 font-medium">
                Votre santé au Maroc, notre priorité. Trouvez et prenez rendez-vous facilement avec les meilleurs professionnels de santé.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-[#00263C] mb-4">Recherches fréquentes</h4>
              <ul className="space-y-3 text-sm text-[#00263C] font-medium">
                <li><Link href="#" className="hover:text-[#007DFF] transition-colors">Médecin généraliste</Link></li>
                <li><Link href="#" className="hover:text-[#007DFF] transition-colors">Pédiatre</Link></li>
                <li><Link href="#" className="hover:text-[#007DFF] transition-colors">Gynécologue</Link></li>
                <li><Link href="#" className="hover:text-[#007DFF] transition-colors">Dentiste</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-[#00263C] mb-4">Pour les patients</h4>
              <ul className="space-y-3 text-sm text-[#00263C] font-medium">
                <li><Link href="/recherche" className="hover:text-[#007DFF] transition-colors">Trouver un praticien</Link></li>
                <li><Link href="/login" className="hover:text-[#007DFF] transition-colors">Se connecter</Link></li>
                <li><Link href="/inscription" className="hover:text-[#007DFF] transition-colors">S'inscrire</Link></li>
                <li><Link href="/help" className="hover:text-[#007DFF] transition-colors">Centre d'aide</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-[#00263C] mb-4">Pour les professionnels</h4>
              <ul className="space-y-3 text-sm text-[#00263C] font-medium">
                <li><Link href="/inscription?role=medecin" className="hover:text-[#007DFF] transition-colors">Logiciel Doctorek Pro</Link></li>
                <li><Link href="/login" className="hover:text-[#007DFF] transition-colors">Se connecter</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 font-medium">
              © {new Date().getFullYear()} Doctorek. Tous droits réservés.
            </p>
            <div className="flex gap-4 text-xs text-gray-500 font-medium">
              <Link href="#" className="hover:text-[#00263C]">Conditions générales</Link>
              <Link href="#" className="hover:text-[#00263C]">Politique de confidentialité</Link>
              <Link href="#" className="hover:text-[#00263C]">Mentions légales</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

