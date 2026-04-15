import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MedecinProfile } from '@/lib/types'

interface MedecinProfileCardProps {
  medecin: MedecinProfile
}

export function MedecinProfileCard({ medecin }: MedecinProfileCardProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Médecin</p>
            <CardTitle className="text-2xl">
              Dr. {medecin.firstName} {medecin.lastName}
            </CardTitle>
          </div>
          <Badge className="text-sm px-3 py-1">{medecin.specialite}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 grid gap-4">
        <InfoRow label="Ville" value={medecin.ville} />
        <InfoRow label="Adresse" value={medecin.adresse} />
        <InfoRow label="INPE" value={medecin.inpe} />
        <div className="pt-2">
          <Link
            href={`/medecins/${medecin.id}/rdv`}
            className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
          >
            Prendre rendez-vous
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</span>
      <span className="text-zinc-800">{value}</span>
    </div>
  )
}
