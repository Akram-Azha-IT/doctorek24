import { Power, PowerOff } from 'lucide-react'

interface ToggleActiveButtonProps {
  active: boolean
  disabled?: boolean
  onClick: (e: React.MouseEvent) => void
}

/** Activer / Désactiver un compte. Rouge (destructif) si actif, bleu si réactivation. */
export function ToggleActiveButton({ active, disabled, onClick }: ToggleActiveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={active ? 'Désactiver le compte' : 'Activer le compte'}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        active
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
      }`}
    >
      {active ? (
        <>
          <PowerOff className="h-3.5 w-3.5" /> Désactiver
        </>
      ) : (
        <>
          <Power className="h-3.5 w-3.5" /> Activer
        </>
      )}
    </button>
  )
}
