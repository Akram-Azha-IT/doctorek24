'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, UserCircle, LogOut,
  Search, Settings, ChevronDown, MessageCircle,
} from 'lucide-react'
import { NotificationPanel } from '@/features/notifications/components/NotificationPanel'
import { NotificationToasts } from '@/features/notifications/components/NotificationToasts'
import { getSession, saveSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { logout } from '@/lib/auth'
import { apiFetch } from '@/lib/api-client'
import Logo from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { useUnreadCount } from '@/features/messaging/useUnreadCount'

const NAV_ITEMS = [
  { href: '/dashboard/medecin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/medecin/disponibilites', label: 'Agenda & RDV', icon: Calendar },
  { href: '/dashboard/medecin/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/medecin/messages', label: 'Messages', icon: MessageCircle },
  { href: '/dashboard/medecin/profil', label: 'Profil', icon: UserCircle },
]

export default function MedecinLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard('MEDECIN')

  const pathname = usePathname()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [isDragging, setIsDragging] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const dragRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(256)

  function syncFromSession() {
    const session = getSession()
    if (session) {
      setFirstName(session.firstName ?? '')
      setLastName(session.lastName ?? '')
      setPhotoUrl(session.photoUrl ?? null)
    }
  }

  useEffect(() => {
    syncFromSession()
    window.addEventListener('session-updated', syncFromSession)
    return () => window.removeEventListener('session-updated', syncFromSession)
  }, [])

  useEffect(() => {
    const session = getSession()
    if (!session) return
    // Name + photo persist in the backend (medecin_details); the session-only enrichment is
    // wiped on logout, so reload from the profile when either is missing and re-seed the session.
    if (session.firstName && session.photoUrl) return
    apiFetch<{ firstName: string; lastName: string; photoUrl?: string | null }>(`/api/v1/annuaire/medecins/${session.id}`)
      .then((profile) => {
        const updated = {
          ...session,
          firstName: profile.firstName,
          lastName: profile.lastName,
          photoUrl: profile.photoUrl ?? session.photoUrl ?? null,
        }
        saveSession(updated)
        setFirstName(profile.firstName ?? '')
        setLastName(profile.lastName ?? '')
        if (profile.photoUrl) setPhotoUrl(profile.photoUrl)
      })
      .catch(() => {})
  }, [])

  function handleMouseMove(e: MouseEvent) {
    if (!dragRef.current) return
    const delta = e.clientX - startXRef.current
    const next = Math.min(380, Math.max(200, startWidthRef.current + delta))
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

  const unreadMessages = useUnreadCount()
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Médecin'
  const specialite = 'Médecin généraliste'

  const BOTTOM_NAV_MEDECIN = [
    { href: '/dashboard/medecin', label: 'Accueil', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/medecin/disponibilites', label: 'Agenda', icon: Calendar },
    { href: '/dashboard/medecin/patients', label: 'Patients', icon: Users },
    { href: '/dashboard/medecin/messages', label: 'Messages', icon: MessageCircle },
    { href: '/dashboard/medecin/profil', label: 'Profil', icon: UserCircle },
  ]

  return (
    <div className="dk-canvas flex h-screen overflow-hidden">
      {/* ── Sidebar — hidden on mobile ── */}
      <aside
        className="hidden xl:flex shrink-0 flex-col bg-white overflow-hidden"
        style={{
          width: sidebarOpen ? sidebarWidth : 52,
          boxShadow: '1px 0 0 0 #E5E9F0',
          transition: isDragging ? 'none' : 'width 250ms ease',
        }}
      >
        {/* Logo / icon */}
        <div className="flex h-16 shrink-0 items-center border-b border-[#E5E9F0]"
          style={{ padding: sidebarOpen ? '0 24px' : '0', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
          {sidebarOpen
            ? <Logo className="h-8 w-auto" width={120} height={40} priority />
            : <Logo collapsed priority />
          }
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-0.5" style={{ padding: sidebarOpen ? '16px 12px' : '16px 6px' }}>
          {sidebarOpen && (
            <p className="px-3 pt-1 pb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#B0BAC9' }}>
              Menu
            </p>
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
                className="flex w-full items-center rounded-xl transition-all"
                style={{
                  gap: sidebarOpen ? '12px' : '0',
                  padding: sidebarOpen ? '10px 12px' : '10px',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  ...(active ? { background: '#EBF4FF', color: '#007DFF' } : { color: '#6B7A99' }),
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = '#F5F7FA'
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = active ? '#EBF4FF' : ''
                }}
              >
                <span className="relative shrink-0">
                  <item.icon
                    className="h-[18px] w-[18px]"
                    style={{ color: active ? '#007DFF' : '#A0AEC0' }}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#E01E5A] text-[8px] font-bold text-white">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {badge > 0 && !active && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E01E5A] px-1.5 text-[10px] font-bold text-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                    {active && badge === 0 && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: '#007DFF' }} />
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* Doctor profile + logout at bottom */}
        <div className="pb-4 space-y-1 border-t border-[#E5E9F0] pt-3" style={{ padding: sidebarOpen ? '12px 12px 16px' : '12px 6px 16px' }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard/medecin/profil')}
            title={!sidebarOpen ? `Dr. ${fullName}` : undefined}
            className="flex w-full items-center rounded-xl transition-all"
            style={{
              gap: sidebarOpen ? '12px' : '0',
              padding: sidebarOpen ? '10px 12px' : '10px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              color: '#6B7A99',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F7FA' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            <Avatar name={fullName} photoUrl={photoUrl} size={32} ring className="shadow-sm" />
            {sidebarOpen && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold truncate" style={{ color: '#010C2D' }}>Dr. {fullName}</p>
                  <p className="text-[11px] truncate" style={{ color: '#A0AEC0' }}>{specialite}</p>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0" style={{ color: '#C4CFDD' }} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title={!sidebarOpen ? 'Déconnexion' : undefined}
            className="flex w-full items-center rounded-xl transition-all"
            style={{
              gap: sidebarOpen ? '12px' : '0',
              padding: sidebarOpen ? '10px 12px' : '10px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              color: '#E01E5A',
              fontSize: '14px',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FFF0F4' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Drag handle — desktop only, hidden in icon-rail mode */}
      {sidebarOpen && (
        <div
          onMouseDown={handleDividerMouseDown}
          className="hidden xl:flex group relative w-1 shrink-0 cursor-col-resize items-center justify-center transition-colors"
          style={{ background: isDragging ? '#007DFF' : '#E5E9F0' }}
          onMouseEnter={(e) => {
            if (!isDragging) (e.currentTarget as HTMLElement).style.background = '#B6DAF7'
          }}
          onMouseLeave={(e) => {
            if (!isDragging) (e.currentTarget as HTMLElement).style.background = '#E5E9F0'
          }}
        />
      )}

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex h-14 xl:h-16 shrink-0 items-center justify-between px-4 xl:px-6 border-b"
          style={{ background: '#FFFFFF', borderColor: '#E5E9F0' }}
        >
          {/* Mobile: Logo | Desktop: toggle + Search bar */}
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
            {/* Logo — mobile only */}
            <Logo className="h-7 w-auto xl:hidden shrink-0" width={100} height={33} priority />

            {/* Sidebar toggle — desktop only */}
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label={sidebarOpen ? 'Réduire le panneau' : 'Ouvrir le panneau'}
              className="hidden xl:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-[#EBF4FF]"
              style={{ border: '1px solid #E5E9F0' }}
            >
              <svg
                className="h-4 w-4"
                style={{
                  color: '#007DFF',
                  transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 250ms ease',
                }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Search — desktop only */}
            <div
              className="hidden xl:flex items-center gap-2 rounded-xl px-4 py-2 w-72 border transition-all focus-within:border-[#007DFF]"
              style={{ background: '#F5F7FA', borderColor: '#E5E9F0' }}
            >
              <Search className="h-4 w-4 shrink-0" style={{ color: '#A0AEC0' }} />
              <input
                type="text"
                placeholder="Rechercher un patient, RDV…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#333333' }}
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 xl:gap-3 shrink-0">
            <NotificationPanel />
            <NotificationToasts />
            {/* Settings — desktop only */}
            <button
              aria-label="Paramètres du profil"
              className="hidden xl:flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E9F0] bg-white transition-colors hover:border-[#B6DAF7]"
              onClick={() => router.push('/dashboard/medecin/profil')}
            >
              <Settings className="h-4 w-4" style={{ color: '#6B7A99' }} />
            </button>
            <div className="hidden xl:block h-7 w-px mx-1" style={{ background: '#E5E9F0' }} />
            <button
              className="flex items-center gap-2 xl:gap-2.5 rounded-xl xl:px-3 xl:py-1.5 transition-colors hover:bg-[#F5F7FA] active:scale-95"
              onClick={() => setProfileSheetOpen(true)}
              aria-label="Ouvrir mon profil"
              aria-haspopup="dialog"
            >
              <Avatar name={fullName} photoUrl={photoUrl} size={32} ring />
              <div className="hidden xl:block text-left">
                <p className="text-sm font-semibold leading-none" style={{ color: '#010C2D' }}>
                  Dr. {firstName || 'Médecin'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2EB67D]" />
                  <p className="text-[10px] font-medium" style={{ color: '#A0AEC0' }}>En ligne</p>
                </div>
              </div>
            </button>
          </div>
        </header>

        {/* Content — bottom padding for mobile bottom nav */}
        <main className="flex-1 overflow-y-auto pb-20 xl:pb-0">
          {children}
        </main>
      </div>


      {/* ── Fiche profil (bottom sheet mobile / panneau ancré desktop) ── */}
      {profileSheetOpen && (
        <div role="dialog" aria-modal="true" aria-label="Mon profil" className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setProfileSheetOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-x-0 bottom-0 xl:inset-x-auto xl:bottom-auto xl:right-6 xl:top-20 xl:w-80 rounded-t-3xl xl:rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="xl:hidden flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>

            <div className="flex items-center gap-3 px-6 pt-4 pb-4 border-b border-zinc-100">
              <Avatar name={fullName} photoUrl={photoUrl} size={48} />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-[#010C2D]">Dr. {fullName}</p>
                <p className="text-xs text-[#A0AEC0] font-medium">Espace médecin</p>
              </div>
            </div>

            <div className="px-3 py-2">
              <button
                type="button"
                onClick={() => { setProfileSheetOpen(false); router.push('/dashboard/medecin/profil') }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-semibold text-[#333333] hover:bg-[#F1F4F7] active:bg-[#F1F4F7] transition-colors"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EBF4FF]">
                  <UserCircle className="h-4 w-4 text-[#007DFF]" />
                </span>
                Mon profil
              </button>
              <button
                type="button"
                onClick={() => { setProfileSheetOpen(false); router.push('/dashboard/medecin/disponibilites') }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-semibold text-[#333333] hover:bg-[#F1F4F7] active:bg-[#F1F4F7] transition-colors"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EBF4FF]">
                  <Calendar className="h-4 w-4 text-[#007DFF]" />
                </span>
                Mes disponibilités
              </button>
            </div>

            <div className="px-3 pb-6 xl:pb-3 pt-1 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-bold text-red-500 hover:bg-red-50 active:bg-red-50 transition-colors"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                  <LogOut className="h-4 w-4" />
                </span>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile bottom navigation ── */}
      <nav
        className="xl:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#E5E9F0] safe-area-pb"
        aria-label="Navigation principale"
      >
        <div className="grid grid-cols-5 h-16">
          {BOTTOM_NAV_MEDECIN.map((item) => {
            const active = 'exact' in item && item.exact ? pathname === item.href : pathname.startsWith(item.href)
            const isMsg = item.href === '/dashboard/medecin/messages'
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] ${
                  active ? 'text-[#007DFF]' : 'text-[#A0AEC0]'
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
                <span className={`text-[10px] font-semibold leading-none ${active ? 'text-[#007DFF]' : 'text-[#A0AEC0]'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
