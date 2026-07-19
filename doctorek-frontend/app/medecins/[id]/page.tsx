'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import LogoLoader from '@/components/LogoLoader'
import { ErrorState } from '@/components/ErrorState'
import { MedecinProfileCard } from '@/features/annuaire/components/MedecinProfileCard'
import { MobileStickyBooking } from '@/features/annuaire/components/MobileStickyBooking'
import { useMedecin } from '@/features/annuaire/hooks'

export default function MedecinPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, error, isFetching, refetch } = useMedecin(id)

  return (
    <>
      <Header />
      <main className="w-full">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <LogoLoader width={120} label="Chargement du profil…" />
          </div>
        )}

        {isError && (
          <div className="mx-auto max-w-md px-4 py-16">
            <ErrorState error={error} onRetry={() => refetch()} isRetrying={isFetching} />
          </div>
        )}

        {data && <MedecinProfileCard medecin={data} />}
        {data && <MobileStickyBooking medecin={data} />}
      </main>
      <Footer />
    </>
  )
}
