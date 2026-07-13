'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { AppNotification } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useStompContext } from '@/lib/stomp-context'
import { useMarkRead, useNotifications } from '../hooks'
import {
  NOTIF_DEFAULT_CONFIG,
  NOTIF_TYPE_CONFIG,
  formatNotifTime,
} from '../notif-config'

const WELCOME_MAX_TOASTS = 3
const WELCOME_STAGGER_MS = 400
const TOAST_DURATION_MS = 6000
/** Burst d'accueil : seulement les non-lues des dernières 48h. */
const WELCOME_MAX_AGE_MS = 48 * 60 * 60 * 1000

interface ToastCardProps {
  notif: AppNotification
  toastId: string | number
  onOpen: (notif: AppNotification) => void
}

/** Carte façon notification WhatsApp : icône, titre, corps, heure — cliquable. */
function ToastCard({ notif, toastId, onOpen }: ToastCardProps) {
  const config = NOTIF_TYPE_CONFIG[notif.type] ?? NOTIF_DEFAULT_CONFIG

  return (
    <button
      type="button"
      onClick={() => {
        toast.dismiss(toastId)
        onOpen(notif)
      }}
      className="flex w-[min(356px,calc(100vw-32px))] items-start gap-3 rounded-2xl border border-[#E5E9F0] bg-white px-4 py-3 text-left shadow-[0_12px_32px_-8px_rgba(1,12,45,0.22)] transition-transform hover:-translate-y-px"
    >
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.chipClass}`}>
        {config.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-bold text-[#010C2D]">{notif.title}</span>
          <span className="shrink-0 text-[11px] text-[#A0AEC0]">{formatNotifTime(notif.createdAt)}</span>
        </span>
        {notif.body && (
          <span className="mt-0.5 block text-xs leading-relaxed text-[#465058] line-clamp-2">
            {notif.body}
          </span>
        )}
      </span>
    </button>
  )
}

/**
 * Notifications temporaires façon WhatsApp/Instagram :
 * - à l'entrée dans l'espace, les non-lues récentes apparaissent en cascade ;
 * - ensuite, chaque notification poussée en temps réel (STOMP) s'affiche
 *   immédiatement depuis son payload — sans attendre un refetch.
 * Monté une fois par layout dashboard, ne rend rien lui-même.
 */
export function NotificationToasts() {
  const router = useRouter()
  const { subscribe } = useStompContext()
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkRead()

  // IDs déjà affichés en toast — évite les doublons entre push STOMP,
  // burst d'accueil et refetchs (polling / focus).
  const toastedIdsRef = useRef<Set<string>>(new Set())
  const welcomeDoneRef = useRef(false)

  function openNotification(notif: AppNotification) {
    if (!notif.read) markRead.mutate(notif.id)
    const role = getSession()?.role === 'MEDECIN' ? 'MEDECIN' : 'PATIENT'
    const href = (NOTIF_TYPE_CONFIG[notif.type] ?? NOTIF_DEFAULT_CONFIG).href[role]
    if (href) router.push(href)
  }

  function showToast(notif: AppNotification) {
    if (toastedIdsRef.current.has(notif.id)) return
    toastedIdsRef.current.add(notif.id)
    toast.custom(
      (id) => <ToastCard notif={notif} toastId={id} onOpen={openNotification} />,
      { duration: TOAST_DURATION_MS },
    )
  }

  // Temps réel : le backend pousse la notification complète sur ce topic —
  // toast immédiat depuis le payload, indépendamment du cache React Query.
  useEffect(() => {
    return subscribe('/user/queue/notifications', (body) => {
      try {
        const notif = JSON.parse(body) as AppNotification
        if (notif?.id && notif?.title) showToast(notif)
      } catch {
        // payload inattendu — le refetch déclenché par useNotifications prendra le relais
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe])

  // Burst d'accueil à l'entrée dans l'espace : non-lues récentes, en cascade.
  useEffect(() => {
    if (isLoading || welcomeDoneRef.current) return
    welcomeDoneRef.current = true

    const now = Date.now()
    notifications
      .filter((n) => !n.read && now - new Date(n.createdAt).getTime() < WELCOME_MAX_AGE_MS)
      .slice(0, WELCOME_MAX_TOASTS)
      .forEach((n, i) => {
        setTimeout(() => showToast(n), 400 + i * WELCOME_STAGGER_MS)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, notifications])

  return null
}
