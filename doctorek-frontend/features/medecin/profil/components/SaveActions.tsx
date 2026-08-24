import LogoLoader from '@/components/LogoLoader'

interface SaveActionsProps {
  isPending: boolean
  saveStatus: 'idle' | 'success'
  saveError: string | null
}

export function SaveActions({ isPending, saveStatus, saveError }: SaveActionsProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        {saveStatus === 'success' && (
          <span className="flex items-center gap-2 text-sm text-green-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Profil mis à jour
          </span>
        )}
        {saveError && (
          <span className="flex items-center gap-2 text-sm text-red-600">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {saveError}
          </span>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-[#0C4A83] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#064178] disabled:opacity-60 transition-colors"
      >
        {isPending ? (
          <>
            <LogoLoader variant="mark" size={16} inverse decorative />
            Enregistrement…
          </>
        ) : (
          'Enregistrer'
        )}
      </button>
    </div>
  )
}
