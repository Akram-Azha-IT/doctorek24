'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { MedecinProfileCard } from '@/features/annuaire/components/MedecinProfileCard'
import { useMedecin } from '@/features/annuaire/hooks'

export default function MedecinPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, error } = useMedecin(id)

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Link
          href="/recherche"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-8 transition-colors"
        >
          ← Retour à la recherche
        </Link>

        {isLoading && (
          <p className="text-center text-sm text-zinc-500 py-16">Chargement du profil...</p>
        )}

        {isError && (
          <p className="text-center text-sm text-red-500 py-16">
            {(error as Error).message}
          </p>
        )}

        {data && <MedecinProfileCard medecin={data} />}
      </main>
    </>
  )
}
