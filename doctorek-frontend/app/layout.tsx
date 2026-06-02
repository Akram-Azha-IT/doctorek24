import type { Metadata } from 'next'
import { Geist, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/lib/query-provider'
import { StompProvider } from '@/lib/stomp-context'
import { AutoRefreshProvider } from '@/lib/AutoRefreshProvider'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Doctorek — Trouvez votre médecin',
  description: 'Recherchez un médecin par spécialité et ville au Maroc',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} ${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans">
        <QueryProvider>
          <AutoRefreshProvider>
            <StompProvider>
              {children}
              <Toaster position="top-right" richColors />
            </StompProvider>
          </AutoRefreshProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
