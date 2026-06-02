'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSession } from '@/lib/session'
import { Suspense } from 'react'

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

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#007DFF] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function MessagesRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0F2F5]" />}>
      <Redirector />
    </Suspense>
  )
}
