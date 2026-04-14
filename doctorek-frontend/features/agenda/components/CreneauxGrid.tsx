import { Button } from '@/components/ui/button'
import type { Creneau } from '@/lib/types'

interface CreneauxGridProps {
  creneaux: Creneau[]
  onSelect: (creneau: Creneau) => void
  selected: string | null  // "HH:mm" du créneau sélectionné
}

export function CreneauxGrid({ creneaux, onSelect, selected }: CreneauxGridProps) {
  const disponibles = creneaux.filter((c) => c.disponible)

  if (disponibles.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-6 text-center">
        Aucun créneau disponible pour cette date.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {disponibles.map((c) => {
        const isSelected = selected === c.debut
        return (
          <Button
            key={c.debut}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            className="text-sm font-medium"
            onClick={() => onSelect(c)}
          >
            {c.debut}
          </Button>
        )
      })}
    </div>
  )
}
