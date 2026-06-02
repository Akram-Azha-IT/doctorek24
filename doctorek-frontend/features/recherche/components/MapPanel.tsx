import type { DoctorMapEntry } from '@/features/annuaire/components/DoctorMap'

interface MapPanelProps {
  DoctorMap: React.ComponentType<{
    doctors: DoctorMapEntry[]
    hoveredId: string | null
    center?: { lat: number; lng: number }
  }>
  doctors: DoctorMapEntry[]
  hoveredId: string | null
  center?: { lat: number; lng: number }
  isLoading: boolean
  mobileView: 'list' | 'map'
}

export function DesktopMapPanel({ DoctorMap, doctors, hoveredId, center, isLoading }: Omit<MapPanelProps, 'mobileView'>) {
  return (
    <div className="hidden lg:block w-[380px] shrink-0">
      <div className="sticky top-[97px] h-[calc(100vh-97px)] overflow-hidden rounded-tl-xl border-l border-zinc-200">
        <DoctorMap doctors={doctors} hoveredId={hoveredId} center={center} />
        {doctors.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#E8EFF6]/80 pointer-events-none">
            <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-500 shadow-md backdrop-blur-sm ring-1 ring-zinc-200">
              Aucun médecin localisé
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function MobileMapOverlay({ DoctorMap, doctors, hoveredId, center, isLoading, mobileView }: MapPanelProps) {
  if (mobileView !== 'map') return null

  return (
    <div className="fixed inset-0 z-30 lg:hidden">
      <div className="relative h-full w-full overflow-hidden">
        <DoctorMap doctors={doctors} hoveredId={hoveredId} center={center} />
        {doctors.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#E8EFF6]/80 pointer-events-none">
            <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-500 shadow-md backdrop-blur-sm ring-1 ring-zinc-200">
              Aucun médecin localisé
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
