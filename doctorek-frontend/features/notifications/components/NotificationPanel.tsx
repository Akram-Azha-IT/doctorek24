'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellOff, ChevronRight } from 'lucide-react'
import type { AppNotification } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useMarkAllRead, useMarkRead, useNotifications } from '../hooks'
import {
  NOTIF_DEFAULT_CONFIG,
  NOTIF_TYPE_CONFIG,
  formatNotifTime,
} from '../notif-config'

interface NotificationItemProps {
  notif: AppNotification
  role: 'PATIENT' | 'MEDECIN'
  onOpen: (notif: AppNotification, href: string | null) => void
}

function NotificationItem({ notif, role, onOpen }: NotificationItemProps) {
  const config = NOTIF_TYPE_CONFIG[notif.type] ?? NOTIF_DEFAULT_CONFIG
  const href = config.href[role]

  return (
    <button
      type="button"
      onClick={() => onOpen(notif, href)}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F5F7FA] focus-visible:bg-[#F5F7FA] focus-visible:outline-none ${
        notif.read ? '' : 'bg-[#EBF4FF]/50'
      }`}
    >
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.chipClass}`}>
        {config.icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={`text-sm leading-snug ${notif.read ? 'text-[#465058]' : 'font-semibold text-[#010C2D]'}`}>
            {notif.title}
          </span>
          {!notif.read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#007DFF]" aria-label="Non lue" />
          )}
        </span>
        {notif.body && (
          <span className="mt-0.5 block text-xs leading-relaxed text-[#6B7A99] line-clamp-2">
            {notif.body}
          </span>
        )}
        <span className="mt-1 flex items-center gap-1 text-[11px] text-[#A0AEC0]">
          {formatNotifTime(notif.createdAt)}
          {href && (
            <>
              <span aria-hidden>·</span>
              <span className="flex items-center font-semibold text-[#007DFF]">
                Voir <ChevronRight className="h-3 w-3" />
              </span>
            </>
          )}
        </span>
      </span>
    </button>
  )
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()
  const unread = notifications.filter(n => !n.read).length

  const role = getSession()?.role === 'MEDECIN' ? 'MEDECIN' : 'PATIENT'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKey)
    }
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function handleOpenNotification(notif: AppNotification, href: string | null) {
    if (!notif.read) markRead.mutate(notif.id)
    if (href) {
      setOpen(false)
      router.push(href)
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={unread > 0 ? `Notifications, ${unread} non lue${unread > 1 ? 's' : ''}` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E9F0] bg-white transition-colors hover:border-[#B6DAF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40"
      >
        <Bell className={`h-[18px] w-[18px] ${unread > 0 ? 'text-[#010C2D]' : 'text-[#6B7A99]'}`} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center">
            {/* Halo animé — attire l'œil comme WhatsApp/Instagram */}
            <span
              aria-hidden
              className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E01E5A] opacity-30"
            />
            <span className="relative flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E01E5A] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white shadow-[0_2px_6px_rgba(224,30,90,0.45)]">
              {unread > 9 ? '9+' : unread}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-[72px] z-[60] overflow-hidden rounded-2xl border border-[#E5E9F0] bg-white shadow-[0_12px_40px_-8px_rgba(1,12,45,0.18)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[min(360px,calc(100vw-24px))]"
        >
          <div className="flex items-center justify-between border-b border-[#E5E9F0] px-4 py-3">
            <span className="text-sm font-bold text-[#010C2D]">
              Notifications
              {unread > 0 && (
                <span className="ml-2 rounded-full bg-[#EBF4FF] px-2 py-0.5 text-[11px] font-semibold text-[#007DFF]">
                  {unread} nouvelle{unread > 1 ? 's' : ''}
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="text-xs font-semibold text-[#007DFF] transition-colors hover:text-[#00263C]"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-[60vh] sm:max-h-[420px] divide-y divide-[#F0F2F5] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-[#F0F2F5]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-[#F0F2F5]" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#F0F2F5]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F5]">
                  <BellOff className="h-5 w-5 text-[#A0AEC0]" />
                </span>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#010C2D]">Rien de nouveau</p>
                  <p className="mt-0.5 text-xs text-[#A0AEC0]">
                    Vos notifications apparaîtront ici.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notif={n}
                  role={role}
                  onOpen={handleOpenNotification}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
