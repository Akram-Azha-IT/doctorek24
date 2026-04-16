import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/session'

export function useRoleGuard(requiredRole: 'MEDECIN' | 'PATIENT') {
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.replace('/login')
      return
    }
    if (session.role !== requiredRole) {
      router.replace(session.role === 'MEDECIN' ? '/dashboard/medecin' : '/dashboard/patient')
    }
  }, [router, requiredRole])
}
