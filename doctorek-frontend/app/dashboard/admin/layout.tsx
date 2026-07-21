'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, Users, CreditCard, ChevronDown, ShieldCheck } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useSession as useLocalSession } from '@/lib/useSession'
import { logout } from '@/lib/auth'
import Logo from '@/components/Logo'

const NAV_ITEMS = [
  { href: '/dashboard/admin', label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: '/dashboard/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { href: '/dashboard/admin/cartes', label: 'Cartes virtuelles', icon: CreditCard },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/admin': "Vue d'ensemble",
  '/dashboard/admin/utilisateurs': 'Utilisateurs',
  '/dashboard/admin/cartes': 'Cartes virtuelles',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { status: authStatus, data: authSession } = useSession()
  const localSession = useLocalSession()
  const adminName =
    (localSession ? [localSession.firstName, localSession.lastName].filter(Boolean).join(' ') : '') ||
    'Administrateur'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (authStatus === 'loading') return

    if (authStatus === 'unauthenticated' || !authSession?.user || authSession.error) {
      window.location.replace('/login')
      return
    }
    if (authSession.user.role !== 'ADMIN') {
      router.replace(authSession.user.role === 'MEDECIN' ? '/dashboard/medecin' : '/dashboard/patient')
    }
  }, [authStatus, authSession, router])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  function isActive(item: (typeof NAV_ITEMS)[number]): boolean {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const initials = adminName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A'

  const pageTitle = PAGE_TITLES[pathname] ?? 'Administration'

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6F9]">
      {/* Sidebar */}
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="flex h-[72px] items-center gap-2.5 border-b border-zinc-100 px-6">
          <Logo className="h-7 w-auto" width={100} height={34} priority />
          <span className="rounded-md bg-[#010C2D] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Administration
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item)
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#E8F2FC] text-[#007DFF]'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-[#010C2D]'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#007DFF]" />
                  )}
                  <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-[#007DFF]' : 'text-zinc-400'}`} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-zinc-100 px-3 py-4">
          <div className="flex items-center gap-2 rounded-xl bg-[#F4F6F9] px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#010C2D]">Console sécurisée</p>
              <p className="truncate text-[11px] text-zinc-400">Accès réservé aux administrateurs</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Administration</p>
            <h2 className="text-lg font-bold text-[#010C2D]">{pageTitle}</h2>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-1.5 pl-1.5 pr-3 transition-colors hover:bg-zinc-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#007DFF] text-sm font-bold text-white">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-bold leading-tight text-[#010C2D]">{adminName}</span>
                <span className="block text-[11px] font-semibold leading-tight text-[#007DFF]">Administrateur</span>
              </span>
              <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_40px_-8px_rgba(1,12,45,0.18)]">
                <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#007DFF] text-sm font-bold text-white">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#010C2D]">{adminName}</p>
                    <p className="truncate text-xs text-zinc-400">{authSession?.user?.email ?? 'Administrateur'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); void logout() }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-7">{children}</main>
      </div>
    </div>
  )
}
