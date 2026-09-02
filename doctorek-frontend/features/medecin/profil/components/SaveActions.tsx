import LogoLoader from '@/components/LogoLoader'
import { CheckCircle2, Info, RotateCcw, Save, TriangleAlert } from 'lucide-react'

interface SaveActionsProps {
  isPending: boolean
  saveStatus: 'idle' | 'success'
  saveError: string | null
  isDirty: boolean
  onReset: () => void
}

export function SaveActions({ isPending, saveStatus, saveError, isDirty, onReset }: SaveActionsProps) {
  return (
    <div className="sticky bottom-4 z-20 rounded-2xl border border-[#DCE3ED] bg-white/95 p-4 shadow-[0_8px_28px_rgba(15,39,73,0.12)] backdrop-blur">
      {saveError && (
        <p className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {saveError}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isDirty ? 'bg-[#EAF4FF] text-[#007DFF]' : 'bg-emerald-50 text-emerald-600'}`}>
            {isDirty ? <Info className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          </span>
          <div aria-live="polite">
            <p className="text-sm font-semibold text-[#25314D]">
              {isDirty ? 'Vous avez des modifications non enregistrées' : saveStatus === 'success' ? 'Profil mis à jour' : 'Votre profil est à jour'}
            </p>
            <p className="mt-0.5 text-xs text-[#8290A8]">
              {isDirty ? "N’oubliez pas d’enregistrer vos modifications." : 'Toutes vos informations sont enregistrées.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onReset}
            disabled={!isDirty || isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CFD8E6] bg-white px-5 text-sm font-semibold text-[#25314D] transition-colors hover:bg-[#F6F8FB] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007DFF]/10"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Annuler les modifications
          </button>
          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0C6DC3] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#075A9F] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007DFF]/20"
          >
            {isPending ? (
              <>
                <LogoLoader variant="mark" size={16} inverse decorative />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
