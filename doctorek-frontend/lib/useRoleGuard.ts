import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/session'

export function useRoleGuard(requiredRole: 'MEDECIN' | 'PATIENT' | 'ADMIN') {
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    if (!session) {
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
