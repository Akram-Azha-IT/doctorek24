'use client'

import { ErrorState } from '@/components/ErrorState'

export default function RootError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <main id="main-content" className="flex min-h-[70vh] items-center justify-center bg-[#F3F6F9] px-4 py-10">
      <div className="w-full max-w-lg">
        <ErrorState error={error} onRetry={reset} />
      </div>
    </main>
  )
}
