'use client'

import { useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MedecinProfileCard } from '@/features/annuaire/components/MedecinProfileCard'
import { useMedecin } from '@/features/annuaire/hooks'

export default function MedecinPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, error } = useMedecin(id)

  return (
    <>
      <Header />
      <main className="w-full">
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-zinc-500">Chargement du profil...</p>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-red-500">{(error as Error).message}</p>
          </div>
        )}

        {data && <MedecinProfileCard medecin={data} />}
      </main>
      <Footer />
    </>
  )
}
