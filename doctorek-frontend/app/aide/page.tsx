import type { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { HelpCenter } from './HelpCenter'

export const metadata: Metadata = {
  title: "Centre d'aide | Doctorek",
  description:
    'Retrouvez les réponses à vos questions sur les rendez-vous, votre compte et les services Doctorek.',
}

export default function AidePage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <Header />
      <main id="main-content">
        <HelpCenter />
      </main>
      <Footer />
    </div>
  )
}
