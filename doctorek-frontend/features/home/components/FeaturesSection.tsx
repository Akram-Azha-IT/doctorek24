import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { FEATURES } from '../constants'

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 md:px-8 pb-4">
      <div className="mb-8">
        <p className="text-[12px] font-semibold text-[#007DFF] uppercase tracking-widest mb-2">Nos engagements</p>
        <h2 className="text-[24px] font-bold text-[#00263C] mb-1">Pourquoi choisir Doctorek ?</h2>
        <p className="text-[#465058] text-[15px]">
          Un service conçu pour simplifier l&apos;accès aux soins pour tous les Marocains.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">

        <a href="/login" className="group lg:w-[34%]">
          <div className="bg-[#00263C] rounded-2xl shadow-md p-7 h-full relative overflow-hidden group-hover:shadow-xl transition-shadow flex flex-col min-h-[320px]">
            <div className="absolute top-3 right-3 z-20 w-14 h-14 pointer-events-none">
              <Image src="/free-badge.png" alt="100% Gratuit" fill className="object-contain" />
            </div>
            <h3 className="text-[20px] font-bold text-white mb-2 relative z-10 pr-16">Carte médicale digitale</h3>
            <p className="text-[#B6DAF7] text-[14px] leading-relaxed mb-5 relative z-10">
              En cas d&apos;urgence, les secours ont besoin de votre groupe sanguin, allergies et contacts. Soyez prêt en toute circonstance.
            </p>
            <div className="flex-1" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 text-[#3DA8FF] text-[14px] font-bold group-hover:gap-2.5 transition-all">
                Créer ma carte <ChevronRight className="h-4 w-4" />
              </span>
            </div>
            <div className="absolute bottom-0 right-0 w-[180px] h-[180px] pointer-events-none">
              <div className="absolute rounded-full bg-[#010C2D]" style={{ width: '130px', height: '130px', bottom: '16px', right: '16px' }} />
              <div className="absolute rounded-full bg-[#FFAF5D]" style={{ width: '52px', height: '52px', bottom: '110px', right: '108px', opacity: 0.9 }} />
              <div className="absolute rounded-full bg-[#007DFF]" style={{ width: '90px', height: '90px', bottom: '0px', right: '0px' }} />
              <div className="absolute overflow-hidden rounded-full" style={{ width: '110px', height: '110px', bottom: '24px', right: '24px' }}>
                <Image
                  src="/medical-card-preview.png"
                  alt="Carte médicale digitale"
                  width={110}
                  height={110}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </a>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 bg-[#EBF4FF] rounded-2xl shadow-sm p-6 border border-[#D0E8FF] flex items-start gap-5">
            <div className="w-14 h-14 rounded-xl bg-[#D0E8FF] flex items-center justify-center flex-shrink-0">
              <Image src={FEATURES[0].icon} alt={FEATURES[0].title} width={32} height={32} unoptimized />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#00263C] mb-2">{FEATURES[0].title}</h3>
              <p className="text-[#465058] text-[14px] leading-relaxed">{FEATURES[0].desc}</p>
            </div>
          </div>
          {FEATURES.slice(1).map((f, i) => (
            <div key={i} className="bg-[#EBF4FF] rounded-2xl shadow-sm p-6 border border-[#D0E8FF] flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-[#D0E8FF] flex items-center justify-center mb-4 flex-shrink-0">
                <Image src={f.icon} alt={f.title} width={28} height={28} unoptimized />
              </div>
              <h3 className="text-[16px] font-bold text-[#00263C] mb-2">{f.title}</h3>
              <p className="text-[#465058] text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
