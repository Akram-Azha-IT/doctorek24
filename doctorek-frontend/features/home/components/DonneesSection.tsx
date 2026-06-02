import Image from 'next/image'
import Link from 'next/link'

export function DonneesSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-10 md:py-14">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 min-h-[200px] md:min-h-[240px]">

          <div className="flex-1 md:max-w-[580px]">
            <h2 className="text-2xl md:text-[32px] font-bold text-[#00263C] leading-snug mb-3 tracking-tight">
              Votre santé. Vos données.
            </h2>
            <p className="text-[#465058] text-[14px] leading-relaxed mb-6 max-w-[460px]">
              Vos informations médicales vous appartiennent. Chez Doctorek, elles sont chiffrées, hébergées au Maroc et ne sont jamais vendues ni partagées sans votre consentement explicite.
            </p>
            <Link
              href="/inscription"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-[14px] text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#007DFF' }}
            >
              En savoir plus
            </Link>
          </div>

          <div className="relative flex-shrink-0 w-[240px] md:w-[280px] h-[240px] md:h-[280px]">
            <div className="absolute pointer-events-none" style={{
              width: '86%', height: '86%',
              background: '#00263C',
              borderRadius: '60% 40% 55% 45% / 45% 60% 40% 55%',
              bottom: 0, left: 0,
            }} />
            <div className="absolute pointer-events-none" style={{
              width: '38%', height: '38%',
              background: '#007DFF',
              borderRadius: '50% 50% 40% 60% / 55% 45% 55% 45%',
              top: 0, right: 0,
              opacity: 0.8,
            }} />
            <div className="absolute overflow-hidden" style={{
              width: '82%', height: '82%',
              borderRadius: '55% 45% 45% 55% / 55% 45% 55% 45%',
              top: '5%', right: '5%',
            }}>
              <Image
                src="/Modern Hospital Vital Signs Dashboard — Connected Health Technology.jpg"
                alt="Données médicales sécurisées"
                width={240}
                height={280}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
