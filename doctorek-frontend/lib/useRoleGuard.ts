import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, clearSession } from '@/lib/session'

export function useRoleGuard(requiredRole: 'MEDECIN' | 'PATIENT' | 'ADMIN') {
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    if (!session || !session.accessToken) {
      clearSession()
      router.replace('/login')
      return
    }
    if (session.role !== requiredRole) {
      if (session.role === 'ADMIN') router.replace('/dashboard/admin')
      else if (session.role === 'MEDECIN') router.replace('/dashboard/medecin')
      else router.replace('/dashboard/patient')
    }
  }, [router, requiredRole])
}
