'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, Search, Sun, Moon, Bell, Mail, Settings, CreditCard, Stethoscope, UserRound, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getSession } from '@/lib/session'
import { logout } from '@/lib/auth'
import Logo from '@/components/Logo'

const NAV_ITEMS = [
  { href: '/dashboard/admin', label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: '/dashboard/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { href: '/dashboard/admin/patients', label: 'Patients', icon: UserRound },
  { href: '/dashboard/admin/medecins', label: 'Médecins', icon: Stethoscope },
  { href: '/dashboard/admin/cartes', label: 'Cartes virtuelles', icon: CreditCard },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { status: authStatus, data: authSession } = useSession()
  const [adminName, setAdminName] = useState('Admin')
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(260)

  useEffect(() => {
    if (authStatus === 'loading') return // Auth.js still resolving — avoid a premature redirect

    if (authStatus === 'unauthenticated' || !authSession?.user || authSession.error) {
      // /login 307s to Keycloak (cross-origin) — needs a full browser navigation.
      window.location.replace('/login')
      return
    }
    if (authSession.user.role !== 'ADMIN') {
      router.replace(authSession.user.role === 'MEDECIN' ? '/dashboard/medecin' : '/dashboard/patient')
      return
    }
    const session = getSession()
    const name = session ? [session.firstName, session.lastName].filter(Boolean).join(' ') : ''
    if (name) setAdminName(name)
  }, [authStatus, authSession, router])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return
    const delta = e.clientX - startXRef.current
    const next = Math.min(400, Math.max(180, startWidthRef.current + delta))
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
    void logout()
  }

  function isActive(item: (typeof NAV_ITEMS)[number]): boolean {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB]">
      {/* Sidebar */}
      <aside className="flex shrink-0 flex-col bg-[#F8F9FA]" style={{ width: sidebarWidth }}>
        {/* Logo */}
        <div className="flex h-24 items-center gap-3 px-8">
          <Logo className="h-8 w-auto" width={110} height={37} priority />
          <span className="text-sm font-bold rounded-md px-2 py-0.5" style={{ background: '#EBF4FF', color: '#007DFF' }}>Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-1">
          <p className="px-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-4">
            Administration
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[#E8F2FC] text-[#007DFF]'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-[#010C2D]'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 shrink-0 ${active ? 'text-[#007DFF]' : 'text-zinc-400'}`}
                />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-8">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Drag divider */}
      <div
        onMouseDown={handleDividerMouseDown}
        className={`group relative flex w-1 shrink-0 cursor-col-resize items-center justify-center transition-colors ${
          isDragging ? 'bg-[#007DFF]' : 'bg-zinc-200 hover:bg-[#007DFF]'
        }`}
      >
        <div
          className={`flex flex-col gap-[3px] opacity-0 transition-opacity group-hover:opacity-100 ${
            isDragging ? 'opacity-100' : ''
          }`}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1 w-1 rounded-full bg-white shadow-sm" />
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex h-24 shrink-0 items-center justify-between px-8 z-10 mt-2">
          <div className="flex items-center gap-2 rounded-full bg-white px-5 py-3 shadow-sm border border-zinc-100 focus-within:ring-2 focus-within:ring-[#007DFF]/20 transition-all w-[380px]">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Recherche globale..."
              className="flex-1 bg-transparent text-sm text-[#010C2D] placeholder:text-zinc-400 outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-6 rounded-full bg-white px-4 py-2 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-3 text-zinc-500">
              <div className="flex items-center gap-1 rounded-full bg-[#F8F9FA] border border-zinc-100 p-1">
                <button className="rounded-full bg-white p-1.5 shadow-sm text-zinc-600">
                  <Sun className="h-4 w-4" />
                </button>
                <button className="rounded-full p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors">
                  <Moon className="h-4 w-4" />
                </button>
              </div>
              <button className="relative rounded-full p-1.5 hover:text-zinc-600 transition-colors bg-[#F8F9FA] border border-zinc-100">
                <Bell className="h-4 w-4" />
              </button>
              <button className="rounded-full p-1.5 hover:text-zinc-600 transition-colors bg-[#F8F9FA] border border-zinc-100">
                <Mail className="h-4 w-4" />
              </button>
            </div>

            <div className="h-8 w-px bg-zinc-200 mx-1" />

            <div className="flex items-center gap-3 pl-1 pr-1">
              <div className="text-right">
                <p className="text-sm font-bold text-[#010C2D]">{adminName}</p>
                <p className="text-[11px] font-semibold text-[#007DFF]">Administrateur</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#007DFF] text-sm font-bold text-white shadow-sm border-2 border-white">
                A
              </div>
              <button className="rounded-full p-1 text-zinc-400 hover:text-[#010C2D] transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-8 pb-8">{children}</main>
      </div>
    </div>
  )
}
