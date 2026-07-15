import { CheckCircle2, XCircle } from 'lucide-react'

export function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" /> Actif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">
      <XCircle className="h-3.5 w-3.5" /> Désactivé
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  if (role === 'MEDECIN')
    return (
      <span className="inline-flex items-center rounded-full bg-[#E8F2FC] px-2.5 py-1 text-xs font-semibold text-[#007DFF]">
        Médecin
      </span>
    )
  if (role === 'PATIENT')
    return (
      <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
        Patient
      </span>
    )
  if (role === 'ADMIN')
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        Administrateur
      </span>
    )
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
      {role}
    </span>
  )
}
