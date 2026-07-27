import type { Metadata } from 'next'
import { Geist, Plus_Jakarta_Sans, Figtree, Outfit } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/lib/query-provider'
import { StompProvider } from '@/lib/stomp-context'
import { AutoRefreshProvider } from '@/lib/AutoRefreshProvider'
import { AuthSessionProvider } from '@/lib/AuthSessionProvider'
import { SessionBridge } from '@/lib/SessionBridge'
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

// Figtree : typo santé (lisibilité clinique, chiffres tabulaires nets). Réservée à la
// carte médicale, la surface la plus institutionnelle du produit.
const figtree = Figtree({
  variable: '--font-figtree',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

// Outfit : géométrique aux terminaisons arrondies — elle répond au logo Doctorek
// (arrondi, incliné) là où une grotesque système reste anonyme. Réservée à la carte.
const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

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
    <html lang="fr" className={`${geist.variable} ${jakarta.variable} ${figtree.variable} ${outfit.variable} h-full antialiased`} suppressHydrationWarning>
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
                <Toaster position="top-right" richColors />
              </StompProvider>
            </AutoRefreshProvider>
          </AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
