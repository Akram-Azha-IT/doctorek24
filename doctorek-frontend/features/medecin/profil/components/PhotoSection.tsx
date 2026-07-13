'use client'

interface PhotoSectionProps {
  photoUrl: string | null
  photoStatus: 'idle' | 'success'
  firstName: string
  lastName: string
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
  photoInputRef,
  onUploadClick,
  onRemove,
  onPhotoChange,
}: PhotoSectionProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-base font-semibold text-zinc-800">Photo de profil</h2>
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Photo de profil"
              className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-zinc-200"
            />
          ) : (
            <div className="h-24 w-24 rounded-full border-4 border-white shadow-md ring-2 ring-zinc-200 bg-[#1863A9] flex items-center justify-center text-white text-2xl font-bold select-none">
              {(firstName[0] ?? 'D').toUpperCase()}
              {(lastName[0] ?? 'r').toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={onUploadClick}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#1863A9] text-white shadow-md hover:bg-[#0C4A83] transition-colors border-2 border-white"
            title="Changer la photo"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-zinc-700">Changer la photo</p>
            <p className="mt-0.5 text-xs text-zinc-400">JPG, PNG ou WEBP · max 2 Mo</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onUploadClick}
              className="inline-flex items-center gap-2 rounded-lg border border-[#1863A9] bg-white px-4 py-2 text-sm font-medium text-[#1863A9] hover:bg-[#DFEFFE] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Télécharger
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={onRemove}
                className="text-sm text-zinc-400 hover:text-red-500 transition-colors"
              >
                Supprimer
              </button>
            )}
            {photoStatus === 'success' && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
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
