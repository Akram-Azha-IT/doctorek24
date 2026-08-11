'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Search, CreditCard,
  LogOut, Settings, ChevronRight, FileText, MessageCircle, Users, UserRound,
} from 'lucide-react'
import { ConsentementGate } from '@/features/auth/components/ConsentementGate'
import { NotificationPanel } from '@/features/notifications/components/NotificationPanel'
import { NotificationToasts } from '@/features/notifications/components/NotificationToasts'
import { getSession, saveSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { Avatar } from '@/components/Avatar'
import { logout } from '@/lib/auth'
import Logo from '@/components/Logo'
import { useCarteByPatient } from '@/features/carte/hooks'
import { usePatientProfile } from '@/features/patient/hooks'
import { useUnreadCount } from '@/features/messaging/useUnreadCount'

const NAV_ITEMS = [
  { href: '/dashboard/patient', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/patient/rdvs', label: 'Mes Rendez-vous', icon: Calendar },
  { href: '/dashboard/patient/proches', label: 'Mes Proches', icon: Users },
  { href: '/dashboard/patient/messages', label: 'Messages', icon: MessageCircle },
  { href: '/recherche', label: 'Trouver un médecin', icon: Search },
]

const HEALTH_ITEMS = [
  { href: '/dashboard/patient/carte', label: 'Carte Médicale', icon: CreditCard },
  { href: '/dashboard/patient/dossier', label: 'Mes Documents', icon: FileText },
]

const COLLAPSED_WIDTH = 64

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard('PATIENT')

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
    // Re-read on 'session-updated' (not a one-shot read): on a fresh login SessionBridge
    // populates the cache after mount, and name/photo are backfilled later.
    function syncFromSession() {
      const session = getSession()
      if (session) {
        setFirstName(session.firstName ?? '')
        setLastName(session.lastName ?? '')
        setPatientId(session.id ?? '')
        setPhotoUrl(session.photoUrl ?? null)
      }
    }
    syncFromSession()
    window.addEventListener('session-updated', syncFromSession)
    return () => window.removeEventListener('session-updated', syncFromSession)
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

  function handleMouseMove(e: MouseEvent) {
    if (!dragRef.current) return
    const delta = e.clientX - startXRef.current
    const next = Math.min(380, Math.max(180, startWidthRef.current + delta))
    setSidebarWidth(next)
  }

  function handleMouseUp() {
    if (!dragRef.current) return
    dragRef.current = false
    setIsDragging(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleLogout() {
    void logout()
  }

  function isActive(item: (typeof NAV_ITEMS)[number]): boolean {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Patient'
  const currentWidth = sidebarOpen ? sidebarWidth : COLLAPSED_WIDTH

  const BOTTOM_NAV = [
    { href: '/dashboard/patient', label: 'Accueil', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/patient/rdvs', label: 'RDVs', icon: Calendar },
    { href: '/recherche', label: 'Médecins', icon: Search },
    { href: '/dashboard/patient/messages', label: 'Messages', icon: MessageCircle },
    // Onglet Compte → page menu complète (proches, carte, documents, déconnexion)
    // façon Doctolib/Booking : le secondaire n'encombre plus la barre du bas.
    { href: '/dashboard/patient/compte', label: 'Compte', icon: UserRound },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Consentement loi 09-08 : bloque l'espace patient tant qu'il n'est pas donné. */}
      <ConsentementGate />

      {/* ── Sidebar — hidden on mobile ── */}
      <aside
        className="hidden lg:flex shrink-0 flex-col bg-white border-r border-zinc-100 overflow-hidden"
        style={{ width: currentWidth, transition: 'width 300ms ease' }}
      >
        {/* Logo */}
        <div className={`flex h-20 shrink-0 items-center border-b border-zinc-100 ${sidebarOpen ? 'px-6' : 'justify-center px-2'}`}>
          <Logo collapsed={!sidebarOpen} className="h-8 w-auto" width={120} height={40} priority />
        </div>

        {/* Patient identity mini-card */}
        {sidebarOpen ? (
          <div className="mx-4 mt-5 mb-2 flex items-center gap-3 rounded-2xl bg-[#F1F4F7] px-4 py-3">
            <Avatar name={fullName} photoUrl={resolvedPhoto} size={36} />
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
            <Avatar name={fullName} photoUrl={resolvedPhoto} size={36} />
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

      {/* ── Drag divider — desktop only ── */}
      <div
        onMouseDown={handleDividerMouseDown}
        className={`hidden lg:flex group relative w-1 shrink-0 items-center justify-center transition-colors ${
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
        <header className="flex h-14 lg:h-20 shrink-0 items-center justify-between px-4 lg:px-8 bg-white border-b border-zinc-100">
          {/* Left: Logo on mobile / hamburger + breadcrumb on desktop */}
          <div className="flex items-center gap-2 lg:gap-3 text-sm min-w-0">
            {/* Mobile: Doctorek logo */}
            <Logo className="h-7 w-auto lg:hidden" width={100} height={33} priority />

            {/* Desktop: hamburger + breadcrumb + page title */}
            <button
              type="button"
              onClick={() => setSidebarOpen(o => !o)}
              className="hidden lg:flex rounded-xl p-2 text-zinc-400 hover:text-[#333333] hover:bg-[#F1F4F7] transition-colors shrink-0"
              aria-label={sidebarOpen ? 'Réduire le menu' : 'Agrandir le menu'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="hidden lg:block text-zinc-400 font-medium shrink-0">Dashboard</span>
            <ChevronRight className="hidden lg:block h-3.5 w-3.5 text-zinc-300 shrink-0" />
            <span className="hidden lg:block font-bold text-[#333333] truncate">
              {[...NAV_ITEMS, ...BOTTOM_NAV].find((i) => ('exact' in i && i.exact ? pathname === i.href : pathname.startsWith(i.href)))?.label ?? 'Patient'}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <NotificationPanel />
            <NotificationToasts />
            {/* Settings — desktop only */}
            <button
              aria-label="Paramètres"
              className="hidden lg:flex rounded-full p-2 text-zinc-400 hover:text-[#333333] hover:bg-[#F1F4F7] transition-colors"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="hidden lg:block h-7 w-px bg-zinc-200 mx-1" />
            <div className="flex items-center gap-2">
              {/* Name — desktop only */}
              <div className="hidden lg:block text-right">
                <p className="text-sm font-bold text-[#333333]">{fullName}</p>
                <p className="text-[11px] text-zinc-400 font-medium">Patient</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard/patient/compte')}
                aria-label="Mon compte"
                className="h-11 w-11 lg:h-9 lg:w-9 shrink-0 rounded-full overflow-hidden bg-[#007DFF]/10 border-2 border-[#007DFF]/20 flex items-center justify-center cursor-pointer hover:opacity-80 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/50"
              >
                <Avatar name={fullName} photoUrl={resolvedPhoto} size={36} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content — with bottom padding on mobile for bottom nav */}
        <main className="dk-canvas flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation ── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-zinc-100 safe-area-pb"
        aria-label="Navigation principale"
      >
        <div className="grid grid-cols-5 h-16">
          {BOTTOM_NAV.map((item) => {
            const active = 'exact' in item && item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const isMsg = item.href === '/dashboard/patient/messages'
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] ${
                  active ? 'text-[#007DFF]' : 'text-zinc-400'
                }`}
              >
                <span className="relative">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {isMsg && unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#E01E5A] text-[8px] font-bold text-white">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-semibold leading-none ${active ? 'text-[#007DFF]' : 'text-zinc-400'}`}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#007DFF]" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
