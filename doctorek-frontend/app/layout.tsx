import type { Metadata } from 'next'
import '@fontsource-variable/geist'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/figtree'
import '@fontsource-variable/outfit'
import './globals.css'
import { QueryProvider } from '@/lib/query-provider'
import { StompProvider } from '@/lib/stomp-context'
import { AutoRefreshProvider } from '@/lib/AutoRefreshProvider'
import { AuthSessionProvider } from '@/lib/AuthSessionProvider'
import { SessionBridge } from '@/lib/SessionBridge'
import { Toaster } from '@/components/ui/sonner'
import { AgentWidget } from '@/features/agent/components/AgentWidget'

// CSP à base de nonce (proxy.ts) impose le rendu dynamique : le nonce est généré
// par requête et ne peut pas être injecté dans une page pré-rendue au build.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Doctorek : Trouvez votre médecin',
  description: 'Recherchez un médecin par spécialité et ville au Maroc',
  icons: {
    icon: '/icone-doctorek.png',
    apple: '/icone-doctorek.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-lg focus:bg-[#007DFF] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
        >
          Aller au contenu principal
        </a>
        <QueryProvider>
          <AuthSessionProvider>
            <SessionBridge />
            <AutoRefreshProvider>
              <StompProvider>
                {children}
                {/* Politique de rôle et de route centralisée dans AgentWidget ;
                    rendu seulement si un modèle est configuré côté serveur. */}
                <AgentWidget />
                <Toaster position="top-right" richColors />
              </StompProvider>
            </AutoRefreshProvider>
          </AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
