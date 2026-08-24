'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSession } from '@/lib/session'
import { Suspense } from 'react'
import LogoLoader from '@/components/LogoLoader'

function Redirector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const conv = searchParams.get('conv')

  useEffect(() => {
    const session = getSession()
    const base = session?.role === 'MEDECIN'
      ? '/dashboard/medecin/messages'
      : '/dashboard/patient/messages'
    router.replace(conv ? `${base}?conv=${conv}` : base)
  }, [router, conv])

  return <LogoLoader fullScreen width={140} label="Ouverture de vos messages…" />
}

export default function MessagesRedirectPage() {
  return (
    <Suspense fallback={<LogoLoader fullScreen width={140} label="Ouverture de vos messages…" />}>
      <Redirector />
    </Suspense>
  )
}
