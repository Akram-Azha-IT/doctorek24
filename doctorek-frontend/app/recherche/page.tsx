'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { SearchForm } from '@/features/annuaire/components/SearchForm'
import { MedecinCard } from '@/features/annuaire/components/MedecinCard'
import { useSearchMedecins } from '@/features/annuaire/hooks'
import type { SearchFormValues } from '@/features/annuaire/schemas'

export default function RecherchePage() {
  const [query, setQuery] = useState<SearchFormValues>({ specialite: '', ville: '' })

  const { data, isLoading, isError, error } = useSearchMedecins(
    query.specialite,
    query.ville
  )

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Trouver un médecin</h1>
          <p className="text-zinc-500 text-sm">
            {data ? `${data.length} médecin${data.length !== 1 ? 's' : ''} trouvé${data.length !== 1 ? 's' : ''}` : 'Chargement...'}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm mb-8">
          <SearchForm onSearch={setQuery} isLoading={isLoading} />
        </div>

        {isError && (
          <p className="text-center text-sm text-red-500 py-8">
            {(error as Error).message}
          </p>
        )}

        {isLoading && (
          <p className="text-center text-sm text-zinc-400 py-8">Chargement...</p>
        )}

        {!isLoading && data && data.length === 0 && (
          <p className="text-center text-sm text-zinc-500 py-8">
            Aucun médecin trouvé pour cette recherche.
          </p>
        )}

        {data && data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((medecin) => (
              <MedecinCard key={medecin.id} medecin={medecin} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
