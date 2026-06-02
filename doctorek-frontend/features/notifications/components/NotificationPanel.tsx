'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import type { AppNotification } from '@/lib/types'
import { useMarkAllRead, useMarkRead, useNotifications } from '../hooks'

const TYPE_ICON: Record<string, string> = {
  CARTE_CREEE:    '💳',
  MESSAGE_RECU:   '💬',
  ANNIVERSAIRE:   '🎂',
  DOCUMENT_RECU:  '📄',
  RDV_RAPPEL:     '⏰',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Il y a ${diffH}h`
  return d.toLocaleDateString('fr-MA', { day: 'numeric', month: 'short' })
}

interface NotificationItemProps {
  notif: AppNotification
  onRead: (id: string) => void
}

function NotificationItem({ notif, onRead }: NotificationItemProps) {
  return (
    <div
      onClick={() => !notif.read && onRead(notif.id)}
      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#F5F7FA] ${
        notif.read ? '' : 'bg-[#EBF4FF]/50'
      }`}
    >
      <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-[#EBF4FF] flex items-center justify-center text-base">
        {TYPE_ICON[notif.type] ?? '🔔'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug truncate ${notif.read ? 'text-[#465058]' : 'font-semibold text-[#010C2D]'}`}>
            {notif.title}
          </p>
          {!notif.read && (
            <span className="shrink-0 w-2 h-2 rounded-full bg-[#007DFF] mt-1.5" />
          )}
        </div>
        {notif.body && (
          <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-2">{notif.body}</p>
        )}
        <p className="text-[10px] text-[#B0BAC9] mt-1">{formatTime(notif.createdAt)}</p>
      </div>
    </div>
  )
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()
  const unread = notifications.filter(n => !n.read).length

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E9F0] bg-white transition-colors hover:border-[#B6DAF7]"
      >
        <Bell className="h-4 w-4" style={{ color: '#6B7A99' }} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E01E5A] text-[9px] font-bold text-white border-2 border-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl bg-white shadow-xl border border-[#E5E9F0] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E9F0]">
            <span className="text-sm font-bold text-[#010C2D]">
              Notifications {unread > 0 && <span className="text-[#007DFF]">({unread})</span>}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="text-xs font-medium text-[#007DFF] hover:text-[#00263C] transition-colors"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#F0F2F5]">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-[#007DFF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#94A3B8]">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  notif={n}
                  onRead={(id) => markRead.mutate(id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[#E5E9F0] bg-[#F8FAFC]">
              <p className="text-xs text-[#94A3B8] text-center">
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
