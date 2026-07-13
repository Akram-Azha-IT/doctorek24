import {
  Bell,
  Cake,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  MessageSquare,
} from 'lucide-react'

export interface NotifTypeConfig {
  icon: React.ReactNode
  chipClass: string
  /** Destination par rôle — null : notification informative, pas de page cible. */
  href: { PATIENT: string | null; MEDECIN: string | null }
}

export const NOTIF_TYPE_CONFIG: Record<string, NotifTypeConfig> = {
  CARTE_CREEE: {
    icon: <CreditCard className="h-4 w-4" />,
    chipClass: 'bg-[#EBF4FF] text-[#007DFF]',
    href: { PATIENT: '/dashboard/patient/carte', MEDECIN: null },
  },
  MESSAGE_RECU: {
    icon: <MessageSquare className="h-4 w-4" />,
    chipClass: 'bg-[#E6F8F0] text-[#1B7A4E]',
    href: { PATIENT: '/dashboard/patient/messages', MEDECIN: '/dashboard/medecin/messages' },
  },
  DOCUMENTS_REQUIS: {
    icon: <ClipboardList className="h-4 w-4" />,
    chipClass: 'bg-[#FFF8E6] text-[#B7791F]',
    href: { PATIENT: '/dashboard/patient/rdvs', MEDECIN: '/dashboard/medecin/agenda' },
  },
  RDV_RAPPEL: {
    icon: <CalendarClock className="h-4 w-4" />,
    chipClass: 'bg-[#EBF4FF] text-[#007DFF]',
    href: { PATIENT: '/dashboard/patient/rdvs', MEDECIN: '/dashboard/medecin/agenda' },
  },
  DOCUMENT_FOURNI: {
    icon: <ClipboardCheck className="h-4 w-4" />,
    chipClass: 'bg-[#E6F8F0] text-[#1B7A4E]',
    href: { PATIENT: null, MEDECIN: '/dashboard/medecin' },
  },
  DOCUMENT_RECU: {
    icon: <FileText className="h-4 w-4" />,
    chipClass: 'bg-[#F0F2F5] text-[#465058]',
    href: { PATIENT: '/dashboard/patient/dossier', MEDECIN: '/dashboard/medecin/patients' },
  },
  ANNIVERSAIRE: {
    icon: <Cake className="h-4 w-4" />,
    chipClass: 'bg-[#FFDEDE] text-[#B4232A]',
    href: { PATIENT: null, MEDECIN: null },
  },
}

export const NOTIF_DEFAULT_CONFIG: NotifTypeConfig = {
  icon: <Bell className="h-4 w-4" />,
  chipClass: 'bg-[#F0F2F5] text-[#465058]',
  href: { PATIENT: null, MEDECIN: null },
}

export function formatNotifTime(iso: string): string {
  const d = new Date(iso)
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Il y a ${diffH}h`
  return d.toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })
}
