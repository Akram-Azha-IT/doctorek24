'use client'

import { Avatar } from '@/components/Avatar'
import { MissingValue } from '@/components/MissingValue'
import { Camera, CheckCircle2, MapPin, Trash2, Upload } from 'lucide-react'

interface PhotoSectionProps {
  photoUrl: string | null
  photoStatus: 'idle' | 'success'
  firstName: string
  lastName: string
  specialite: string
  ville: string
  photoInputRef: React.RefObject<HTMLInputElement | null>
  onUploadClick: () => void
  onRemove: () => void
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function PhotoSection({
  photoUrl,
  photoStatus,
  firstName,
  lastName,
  specialite,
  ville,
  photoInputRef,
  onUploadClick,
  onRemove,
  onPhotoChange,
}: PhotoSectionProps) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Médecin'
  const displayedSpecialite = specialite === 'Médecine générale'
    ? 'Médecin généraliste'
    : specialite || 'Médecin généraliste'

  return (
    <section className="rounded-2xl border border-[#DCE3ED] bg-white p-5 shadow-[0_2px_10px_rgba(15,39,73,0.05)] xl:sticky xl:top-5">
      <h2 className="text-lg font-bold tracking-[-0.02em] text-[#101A38]">Mon profil</h2>

      <div className="mt-5 sm:flex sm:items-center sm:gap-6 xl:block">
        <div className="flex flex-col items-center">
          <div className="relative shrink-0">
          <Avatar
            name={fullName}
            photoUrl={photoUrl}
            size={144}
            className="border-4 border-white shadow-sm ring-2 ring-[#D9E1EC]"
          />
          <button
            type="button"
            onClick={onUploadClick}
            className="absolute bottom-2 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#0C6DC3] text-white shadow-md transition-colors hover:bg-[#075A9F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007DFF]/20"
            title="Changer la photo"
            aria-label="Changer la photo"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

          <div className="mt-4 text-center">
            <p className="text-lg font-bold text-[#101A38]">Dr. {fullName}</p>
            <p className="mt-0.5 text-sm font-medium text-[#007DFF]">
              {displayedSpecialite}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#66738F]">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <MissingValue value={ville} fallback="Ville non renseignée" />
            </p>
          </div>
        </div>

        <div className="mt-6 flex-1 border-t border-[#E3E8F0] pt-5 sm:mt-0 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 xl:mt-6 xl:border-l-0 xl:border-t xl:pl-0 xl:pt-5">
          <div>
            <p className="text-sm font-medium text-[#35415D]">Photo de profil</p>
            <p className="mt-1 text-sm leading-6 text-[#8290A8]">JPG, PNG ou WebP<br />Taille max. 2 Mo</p>
          </div>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={onUploadClick}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#007DFF] bg-white px-4 text-sm font-semibold text-[#007DFF] transition-colors hover:bg-[#F0F7FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007DFF]/15"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Changer la photo
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-[#8290A8] transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Supprimer
              </button>
            )}
            {photoStatus === 'success' && (
              <span className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Photo enregistrée
              </span>
            )}
          </div>
        </div>
      </div>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onPhotoChange}
      />
    </section>
  )
}
