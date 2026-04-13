import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MedecinProfile } from '@/lib/types'

interface MedecinCardProps {
  medecin: MedecinProfile
}

export function MedecinCard({ medecin }: MedecinCardProps) {
  return (
    <Link href={`/medecins/${medecin.id}`} className="block group">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold group-hover:text-blue-600 transition-colors">
              Dr. {medecin.firstName} {medecin.lastName}
            </CardTitle>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {medecin.specialite}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">
            {medecin.adresse}, {medecin.ville}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
