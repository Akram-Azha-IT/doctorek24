import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function PromoCards() {
  return (
    <div className="relative z-20 mt-4 md:-mt-30 px-4 md:px-8">
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-2 gap-4">

        <a href="/login" className="group relative flex flex-col sm:flex-row rounded-2xl shadow-[0_4px_28px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.12)] transition-shadow">
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none bg-white">
            <div className="absolute rounded-full bg-[#D0E8FF] w-[180px] h-[180px] sm:w-[210px] sm:h-[210px] right-4 bottom-4 sm:bottom-auto sm:right-5 sm:top-1/2 sm:-translate-y-1/2" />
            <div className="absolute rounded-full bg-[#B6DAF7] w-[130px] h-[130px] sm:w-[155px] sm:h-[155px] right-10 bottom-8 sm:bottom-auto sm:right-12 sm:top-1/2 sm:-translate-y-1/2" />
          </div>
          <div className="relative z-10 flex-1 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#465058] uppercase tracking-widest mb-3">Patients</p>
              <h3 className="text-[18px] font-bold text-[#00263C] leading-snug mb-2">
                Votre carte médicale digitale,<br />toujours sur vous
              </h3>
              <p className="text-[#465058] text-[13px] leading-relaxed">
                Groupe sanguin, allergies, contacts d&apos;urgence : accessibles même sans connexion.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[#007DFF] font-semibold text-[14px] mt-5 group-hover:gap-2 transition-all">
              Découvrir <ChevronRight className="h-4 w-4" />
            </span>
          </div>
          <div className="relative z-20 h-52 sm:h-auto sm:w-[43%] shrink-0">
            <div className="absolute bottom-2 top-2 inset-x-[5%] sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-1/2 sm:-translate-y-1/2 sm:h-[150px] sm:w-[250px]">
              <div className="relative h-full w-full" style={{ transform: 'rotate(-8deg)' }}>
                <Image
                  src="/carte-phone.png"
                  alt="Carte médicale Doctorek affichée sur un smartphone"
                  fill
                  className="object-contain object-center drop-shadow-2xl"
                  sizes="(max-width: 640px) 80vw, 250px"
                />
              </div>
            </div>
          </div>
        </a>

        <Link href="/inscription?role=medecin" className="group relative flex flex-col sm:flex-row rounded-2xl shadow-[0_4px_28px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.12)] transition-shadow">
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none bg-white">
            <div className="absolute rounded-full bg-[#D0E8FF] w-[200px] h-[200px] sm:w-[210px] sm:h-[210px] left-1/2 -translate-x-1/2 bottom-2 sm:left-auto sm:translate-x-0 sm:bottom-auto sm:right-5 sm:top-1/2 sm:-translate-y-1/2" />
            <div className="absolute rounded-full bg-[#B6DAF7] w-[148px] h-[148px] sm:w-[155px] sm:h-[155px] left-1/2 -translate-x-1/2 bottom-6 sm:left-auto sm:translate-x-0 sm:bottom-auto sm:right-12 sm:top-1/2 sm:-translate-y-1/2" />
          </div>
          <div className="relative z-10 flex-1 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#465058] uppercase tracking-widest mb-3">Médecins</p>
              <h3 className="text-[18px] font-bold text-[#00263C] leading-snug mb-2">
                Rejoignez Doctorek Pro<br />et gérez votre cabinet
              </h3>
              <p className="text-[#465058] text-[13px] leading-relaxed">
                Agenda en ligne, rendez-vous patients et dossiers médicaux : tout en un.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[#007DFF] font-semibold text-[14px] mt-5 group-hover:gap-2 transition-all">
              Découvrir <ChevronRight className="h-4 w-4" />
            </span>
          </div>
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
  )
}
