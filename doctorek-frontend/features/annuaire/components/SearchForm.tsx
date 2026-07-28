'use client'

import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SearchFormValues } from '../schemas'

interface SearchFormProps {
  onSearch: (values: SearchFormValues) => void
  isLoading?: boolean
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const { register, control, reset } = useForm<SearchFormValues>({
    defaultValues: { specialite: '', ville: '' },
  })

  // Filtrage au fil de la frappe. useWatch plutôt que watch() : ce dernier ne peut pas
  // être mémoïsé, et il rerend tout le formulaire là où useWatch cible les champs suivis.
  const [specialite, ville] = useWatch({ control, name: ['specialite', 'ville'] })
  useEffect(() => {
    onSearch({ specialite, ville })
  }, [specialite, ville, onSearch])

  function handleReset() {
    reset({ specialite: '', ville: '' })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5 flex-1">
        <Label htmlFor="specialite">Spécialité</Label>
        <Input
          id="specialite"
          placeholder="ex: Cardiologue, Généraliste…"
          disabled={isLoading}
          {...register('specialite')}
        />
      </div>

      <div className="flex flex-col gap-1.5 flex-1">
        <Label htmlFor="ville">Ville</Label>
        <Input
          id="ville"
          placeholder="ex: Alger, Oran…"
          disabled={isLoading}
          {...register('ville')}
        />
      </div>

      <Button type="button" variant="outline" onClick={handleReset} disabled={isLoading}>
        Réinitialiser
      </Button>
    </div>
  )
}
