'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, Clock, UserCircle, LogOut,
  Search, Bell, Settings, ChevronDown,
} from 'lucide-react'
import Image from 'next/image'
import { getSession, clearSession } from '@/lib/session'

const NAV_ITEMS = [
  { href: '/dashboard/medecin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/medecin/agenda', label: 'Agenda', icon: Calendar },
  { href: '/dashboard/medecin/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/medecin/disponibilites', label: 'Disponibilités', icon: Clock },
  { href: '/dashboard/medecin/profil', label: 'Profil', icon: UserCircle },
]

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export default function MedecinLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [isDragging, setIsDragging] = useState(false)
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return
    const delta = e.clientX - startXRef.current
    const next = Math.min(380, Math.max(200, startWidthRef.current + delta))
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

  const initials = firstName || lastName ? getInitials(firstName, lastName) : 'DR'
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Médecin'
  const specialite = 'Médecin généraliste'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F0F2F5' }}>
      {/* ── Sidebar ── */}
      <aside
        className="flex shrink-0 flex-col bg-white"
        style={{ width: sidebarWidth, boxShadow: '1px 0 0 0 #E5E9F0' }}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 px-6 border-b border-[#E5E9F0]">
          <Image src="/logo0.png" alt="Doctorek" width={120} height={40} className="h-8 w-auto" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="px-3 pt-1 pb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#B0BAC9' }}>
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
                style={
                  active
                    ? { background: '#EBF4FF', color: '#007DFF' }
                    : { color: '#6B7A99' }
                }
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = '#F5F7FA'
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = ''
                }}
              >
                <item.icon
                  className="h-[18px] w-[18px] shrink-0"
                  style={{ color: active ? '#007DFF' : '#A0AEC0' }}
                />
                {item.label}
                {active && (
                  <span
                    className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ background: '#007DFF' }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Doctor profile + logout at bottom */}
        <div className="px-3 pb-4 space-y-1 border-t border-[#E5E9F0] pt-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/medecin/profil')}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all"
            style={{ color: '#6B7A99' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F7FA' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={fullName}
                className="h-8 w-8 shrink-0 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: '#007DFF' }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold truncate" style={{ color: '#010C2D' }}>
                Dr. {fullName}
              </p>
              <p className="text-[11px] truncate" style={{ color: '#A0AEC0' }}>{specialite}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0" style={{ color: '#C4CFDD' }} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
            style={{ color: '#E01E5A' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FFF0F4' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Drag handle */}
      <div
        onMouseDown={handleDividerMouseDown}
        className="group relative flex w-1 shrink-0 cursor-col-resize items-center justify-center transition-colors"
        style={{ background: isDragging ? '#007DFF' : '#E5E9F0' }}
        onMouseEnter={(e) => {
          if (!isDragging) (e.currentTarget as HTMLElement).style.background = '#B6DAF7'
        }}
        onMouseLeave={(e) => {
          if (!isDragging) (e.currentTarget as HTMLElement).style.background = '#E5E9F0'
        }}
      />

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex h-16 shrink-0 items-center justify-between px-6 border-b"
          style={{ background: '#FFFFFF', borderColor: '#E5E9F0' }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2 w-72 border transition-all focus-within:border-[#007DFF]"
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

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E9F0] bg-white transition-colors hover:border-[#B6DAF7]"
            >
              <Bell className="h-4 w-4" style={{ color: '#6B7A99' }} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#E01E5A] border-2 border-white" />
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E9F0] bg-white transition-colors hover:border-[#B6DAF7]"
              onClick={() => router.push('/dashboard/medecin/profil')}
            >
              <Settings className="h-4 w-4" style={{ color: '#6B7A99' }} />
            </button>

            <div
              className="h-7 w-px mx-1"
              style={{ background: '#E5E9F0' }}
            />

            <button
              className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 transition-colors hover:bg-[#F5F7FA]"
              onClick={() => router.push('/dashboard/medecin/profil')}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={fullName}
                  className="h-8 w-8 rounded-full object-cover border-2 border-white"
                  style={{ boxShadow: '0 0 0 2px #007DFF22' }}
                />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: '#007DFF' }}
                >
                  {initials}
                </div>
              )}
              <div className="hidden sm:block text-left">
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
