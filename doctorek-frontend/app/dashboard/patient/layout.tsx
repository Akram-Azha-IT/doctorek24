'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Search, CreditCard,
  LogOut, Settings, Heart, ChevronRight, FileText, MessageCircle,
} from 'lucide-react'
import { NotificationPanel } from '@/features/notifications/components/NotificationPanel'
import { getSession, saveSession, clearSession } from '@/lib/session'
import Logo from '@/components/Logo'
import { useCarteByPatient } from '@/features/carte/hooks'
import { usePatientProfile } from '@/features/patient/hooks'
import { useUnreadCount } from '@/features/messaging/useUnreadCount'

const NAV_ITEMS = [
  { href: '/dashboard/patient', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/patient/rdvs', label: 'Mes Rendez-vous', icon: Calendar },
  { href: '/dashboard/patient/messages', label: 'Messages', icon: MessageCircle },
  { href: '/recherche', label: 'Trouver un médecin', icon: Search },
  { href: '/dashboard/patient/carte', label: 'Carte Médicale', icon: CreditCard },
]

const HEALTH_ITEMS = [
  { href: '/dashboard/patient/carte', label: 'Carte Médicale', icon: Heart },
  { href: '/dashboard/patient/dossier', label: 'Mes Documents', icon: FileText },
]

const COLLAPSED_WIDTH = 64

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(248)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(248)

  useEffect(() => {
    const session = getSession()
    if (session) {
      setFirstName(session.firstName ?? '')
      setLastName(session.lastName ?? '')
      setPatientId(session.id ?? '')
      setPhotoUrl(session.photoUrl ?? null)
    }
  }, [])

  const { data: carte } = useCarteByPatient(patientId || null)
  const { data: profile } = usePatientProfile(patientId || null)
  const resolvedPhoto = profile?.photoUrl ?? photoUrl
  const unreadMessages = useUnreadCount()

  useEffect(() => {
    if (!carte) return
    const session = getSession()
    if (!session) return
    const carteFirst = carte.firstName ?? ''
    const carteLast = carte.lastName ?? ''
    if (!session.firstName && carteFirst) {
      setFirstName(carteFirst)
      saveSession({ ...session, firstName: carteFirst })
    }
    if (!session.lastName && carteLast) {
      setLastName(carteLast)
      saveSession({ ...session, firstName: session.firstName ?? carteFirst, lastName: carteLast })
    }
  }, [carte])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return
    const delta = e.clientX - startXRef.current
    const next = Math.min(380, Math.max(180, startWidthRef.current + delta))
    setSidebarWidth(next)
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = false
    setIsDragging(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  function handleDividerMouseDown(e: React.MouseEvent) {
    if (!sidebarOpen) return
    e.preventDefault()
    dragRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = sidebarWidth
    setIsDragging(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  function handleLogout() {
    clearSession()
    router.push('/login')
  }

  function isActive(item: (typeof NAV_ITEMS)[number]): boolean {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const initials = firstName || lastName ? getInitials(firstName, lastName) : 'P'
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Patient'
  const currentWidth = sidebarOpen ? sidebarWidth : COLLAPSED_WIDTH

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* ── Sidebar ── */}
      <aside
        className="flex shrink-0 flex-col bg-white border-r border-zinc-100 overflow-hidden"
        style={{ width: currentWidth, transition: 'width 300ms ease' }}
      >
        {/* Logo */}
        <div className={`flex h-20 shrink-0 items-center border-b border-zinc-100 ${sidebarOpen ? 'px-6' : 'justify-center px-2'}`}>
          <Logo collapsed={!sidebarOpen} className="h-8 w-auto" width={120} height={40} priority />
        </div>

        {/* Patient identity mini-card */}
        {sidebarOpen ? (
          <div className="mx-4 mt-5 mb-2 flex items-center gap-3 rounded-2xl bg-[#F1F4F7] px-4 py-3">
            <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-[#007DFF]/10 border-2 border-[#007DFF]/20 flex items-center justify-center">
              {resolvedPhoto ? (
                <img src={resolvedPhoto} alt="profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-[#007DFF]">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#333333]">{fullName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <p className="text-[11px] text-[#465058] font-medium">Patient · En ligne</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mt-5 mb-2">
            <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-[#007DFF]/10 border-2 border-[#007DFF]/20 flex items-center justify-center">
              {resolvedPhoto ? (
                <img src={resolvedPhoto} alt="profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-[#007DFF]">{initials}</span>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-3 space-y-0.5 ${sidebarOpen ? 'px-4' : 'px-2'}`}>
          {sidebarOpen && (
            <p className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Navigation</p>
          )}
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            const badge = item.href === '/messages' && unreadMessages > 0 ? unreadMessages : 0
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                title={!sidebarOpen ? item.label : undefined}
                className={`group flex w-full items-center rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  sidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } ${
                  active
                    ? 'bg-[#007DFF] text-white shadow-sm shadow-blue-500/20'
                    : 'text-[#465058] hover:bg-[#F1F4F7] hover:text-[#333333]'
                }`}
              >
                <span className="relative shrink-0">
                  <item.icon
                    className={`h-4 w-4 transition-colors ${
                      active ? 'text-white' : 'text-zinc-400 group-hover:text-[#007DFF]'
                    }`}
                  />
                  {badge > 0 && !sidebarOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#E01E5A] text-[8px] font-bold text-white">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                {sidebarOpen && <span className="truncate flex-1">{item.label}</span>}
                {sidebarOpen && badge > 0 && !active && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E01E5A] px-1.5 text-[10px] font-bold text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {sidebarOpen && active && badge === 0 && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />}
              </button>
            )
          })}

          {/* Divider */}
          <div className="my-4 border-t border-zinc-100" />

          {sidebarOpen && (
            <p className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Santé</p>
          )}
          {HEALTH_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                title={!sidebarOpen ? item.label : undefined}
                className={`group flex w-full items-center rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  sidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
                } ${
                  active
                    ? 'bg-[#007DFF] text-white shadow-sm shadow-blue-500/20'
                    : 'text-[#465058] hover:bg-[#F1F4F7] hover:text-[#333333]'
                }`}
              >
                <item.icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    active ? 'text-white' : 'text-zinc-400 group-hover:text-red-400'
                  }`}
                />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className={`py-5 border-t border-zinc-100 ${sidebarOpen ? 'px-4' : 'px-2'}`}>
          <button
            type="button"
            onClick={handleLogout}
            title={!sidebarOpen ? 'Déconnexion' : undefined}
            className={`flex w-full items-center rounded-xl py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors ${
              sidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* ── Drag divider ── */}
      <div
        onMouseDown={handleDividerMouseDown}
        className={`group relative flex w-1 shrink-0 items-center justify-center transition-colors ${
          sidebarOpen ? 'cursor-col-resize' : 'cursor-default'
        } ${isDragging ? 'bg-[#007DFF]' : 'bg-zinc-100 hover:bg-[#007DFF]'}`}
      >
        {sidebarOpen && (
          <div className={`flex flex-col gap-[3px] opacity-0 transition-opacity group-hover:opacity-100 ${isDragging ? 'opacity-100' : ''}`}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1 w-1 rounded-full bg-white shadow-sm" />
            ))}
          </div>
        )}
      </div>

      {/* ── Main content area ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="flex h-20 shrink-0 items-center justify-between px-8 bg-white border-b border-zinc-100">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setSidebarOpen(o => !o)}
              className="rounded-xl p-2 text-zinc-400 hover:text-[#333333] hover:bg-[#F1F4F7] transition-colors"
              title={sidebarOpen ? 'Réduire' : 'Agrandir'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="text-zinc-400 font-medium">Dashboard</span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-semibold text-[#333333]">
              {NAV_ITEMS.find((i) => (i.exact ? pathname === i.href : pathname.startsWith(i.href)))?.label ?? 'Patient'}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <button className="rounded-full p-2 text-zinc-400 hover:text-[#333333] hover:bg-[#F1F4F7] transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <div className="h-7 w-px bg-zinc-200 mx-1" />
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-sm font-bold text-[#333333]">{fullName}</p>
                <p className="text-[11px] text-zinc-400 font-medium">Patient</p>
              </div>
              <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden bg-[#007DFF]/10 border-2 border-[#007DFF]/20 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                {resolvedPhoto ? (
                  <img src={resolvedPhoto} alt="profil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#007DFF]">{initials}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
