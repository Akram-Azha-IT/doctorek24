'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SearchFormValues } from '../schemas'

interface SearchFormProps {
  onSearch: (values: SearchFormValues) => void
  isLoading?: boolean
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const { register, watch, reset } = useForm<SearchFormValues>({
    defaultValues: { specialite: '', ville: '' },
  })

  // Live filtering — update parent on every keystroke
  const values = watch()
  useEffect(() => {
    onSearch(values)
  }, [values.specialite, values.ville]) // eslint-disable-line react-hooks/exhaustive-deps

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
