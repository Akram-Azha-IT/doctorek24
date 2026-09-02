import { ResilientState } from '@/components/ResilientState'

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-[70vh] items-center justify-center bg-[#F3F6F9] px-4 py-10">
      <div className="w-full max-w-lg">
        <ResilientState
          variant="missing"
          title="Cette page est introuvable"
          description="Le lien est peut-être incomplet ou la page a été déplacée. Vous pouvez reprendre votre navigation sans perdre vos données."
          primaryAction={{ label: "Retour à l'accueil", href: '/' }}
          secondaryAction={{ label: 'Rechercher un médecin', href: '/recherche' }}
        />
      </div>
    </main>
  )
}
