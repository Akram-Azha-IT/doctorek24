import { Footer } from '@/components/Footer'
import { HeroSection } from '@/features/home/components/HeroSection'
import { PromoCards } from '@/features/home/components/PromoCards'
import { StatsStrip } from '@/features/home/components/StatsStrip'
import { SpecialtiesSection } from '@/features/home/components/SpecialtiesSection'
import { FeaturesSection } from '@/features/home/components/FeaturesSection'
import { PatientSection } from '@/features/home/components/PatientSection'
import { ProfessionnelSection } from '@/features/home/components/ProfessionnelSection'
import { DonneesSection } from '@/features/home/components/DonneesSection'

export default function HomePage() {
  return (
    <main id="main-content" className="overflow-x-clip">
      <HeroSection />
      <PromoCards />
      <StatsStrip />
      <div className="bg-white">
        <SpecialtiesSection />
        <FeaturesSection />
      </div>
      <PatientSection />
      <ProfessionnelSection />
      <DonneesSection />
      <Footer />
    </main>
  )
}
