'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarCheck, Link2, ShieldCheck } from 'lucide-react'
import { useSession } from '@/lib/useSession'
import type { RoleGestion } from '@/lib/types'
import { ROLE_GESTION_LABELS } from '@/features/famille/schemas'
import { useRattachementInfo, useReclamerRattachement } from '@/features/rattachement/hooks'
import { ApiError } from '@/lib/api-client'

const ROLE_OPTIONS = Object.entries(ROLE_GESTION_LABELS) as [RoleGestion, string][]

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function RattacherPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()

  const session = useSession()
  const isLogged = session?.role === 'PATIENT'

  const { data: info, isLoading, error } = useRattachementInfo(token)
  const reclamer = useReclamerRattachement(token)

  const [lettres, setLettres] = useState('')
  const [pourMoi, setPourMoi] = useState(false)
  const [role, setRole] = useState<RoleGestion>('PARENT')
  const [declaration, setDeclaration] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setFormError(null)
    if (lettres.trim().length !== 3) {
      setFormError('Saisissez exactement les 3 premières lettres du nom.')
      return
    }
    if (!pourMoi && !declaration) {
      setFormError('La déclaration est obligatoire pour gérer un proche.')
      return
    }
    reclamer.mutate(
      pourMoi
        ? { troisLettres: lettres.trim(), pourMoi: true }
        : { troisLettres: lettres.trim(), pourMoi: false, role, declarationRepresentantLegal: true },
      {
        onSuccess: (proche) => {
          if (proche.self) {
            toast.success('Le rendez-vous a été ajouté à votre espace')
            router.push('/dashboard/patient/rdvs')
          } else {
            toast.success(`${proche.prenom} a été rattaché à votre compte`)
            router.push('/dashboard/patient/proches')
          }
        },
        onError: (err) => {
          setFormError(err instanceof ApiError ? err.message : 'Erreur lors du rattachement.')
        },
      },
    )
  }

  return (
    <main className="min-h-screen bg-[#F0F2F5] flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white shadow-sm border border-zinc-100 overflow-hidden">
          {/* Bandeau */}
          <div className="bg-[#007DFF] px-6 py-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Link2 className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="font-bold text-white">Rattacher un rendez-vous</h1>
              <p className="text-xs text-white/75">Compte famille Doctorek</p>
            </div>
          </div>

          <div className="p-6">
            {isLoading && (
              <div className="space-y-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
              </div>
            )}

            {!isLoading && (error || !info) && (
              <p className="rounded-lg bg-[#FFDEDE] px-4 py-3 text-sm text-[#E01E5A]">
                Ce lien de rattachement est introuvable ou invalide.
              </p>
            )}

            {info && (info.expire || info.utilise) && (
              <p className="rounded-lg bg-[#FFDEDE] px-4 py-3 text-sm text-[#E01E5A]">
                {info.utilise
                  ? 'Ce lien a déjà été utilisé, le rendez-vous est déjà rattaché à un compte.'
                  : 'Ce lien a expiré. Contactez le cabinet médical pour en obtenir un nouveau.'}
              </p>
            )}

            {info && !info.expire && !info.utilise && (
              <>
                {/* Récap RDV */}
                <div className="mb-5 rounded-xl bg-[#DFEFFE] p-4">
                  <div className="flex items-start gap-3">
                    <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1863A9]" />
                    <div className="text-sm text-[#064178]">
                      <p className="font-semibold">
                        {info.medecinNom ?? 'Votre médecin'} a créé un rendez-vous pour {info.prenomInitiale}.
                      </p>
                      {info.dateRdv && info.heureRdv && (
                        <p className="mt-0.5">
                          {formatDate(info.dateRdv)} à {info.heureRdv.slice(0, 5)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isLogged === false && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-zinc-600">
                      Connectez-vous à votre compte patient pour rattacher ce rendez-vous
                      et gérer ce proche depuis votre espace famille.
                    </p>
                    <a
                      href={`/login?callbackUrl=${encodeURIComponent(`/rattacher/${token}`)}`}
                      className="rounded-lg bg-[#007DFF] px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#00263C]"
                    >
                      Se connecter pour rattacher
                    </a>
                  </div>
                )}

                {isLogged && (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Ce RDV est pour moi-même ou pour un proche ? */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-zinc-700">Ce rendez-vous est pour :</span>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { value: true, label: 'Moi-même' },
                          { value: false, label: 'Un proche' },
                        ] as const).map((opt) => (
                          <button
                            key={String(opt.value)}
                            type="button"
                            onClick={() => setPourMoi(opt.value)}
                            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                              pourMoi === opt.value
                                ? 'border-[#007DFF] bg-[#007DFF] text-white'
                                : 'border-zinc-300 bg-white text-zinc-600 hover:border-zinc-500'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {pourMoi && (
                        <p className="text-xs text-zinc-500">
                          Le rendez-vous et les documents associés seront ajoutés directement à votre dossier.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="lettres" className="text-sm font-medium text-zinc-700">
                        Vérification : les 3 premières lettres du <strong>nom</strong> du patient
                      </label>
                      <input
                        id="lettres"
                        value={lettres}
                        onChange={(e) => setLettres(e.target.value.replace(/[^\p{L}]/gu, '').slice(0, 3))}
                        placeholder="Ex. DUP pour Dupont"
                        autoComplete="off"
                        className="w-full rounded-md border border-zinc-300 px-3 py-2.5 text-center text-lg font-bold uppercase tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#007DFF]"
                      />
                    </div>

                    {!pourMoi && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="role" className="text-sm font-medium text-zinc-700">
                            Votre lien avec ce proche
                          </label>
                          <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as RoleGestion)}
                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DFF]"
                          >
                            {ROLE_OPTIONS.map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <label className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={declaration}
                            onChange={(e) => setDeclaration(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#007DFF]"
                          />
                          <span className="text-xs text-zinc-600">
                            Je déclare être le représentant légal de mon proche, ou être autorisé(e)
                            à utiliser les services Doctorek pour gérer des données médicales en son nom.
                          </span>
                        </label>
                      </>
                    )}

                    {formError && <p className="text-sm text-[#E01E5A]">{formError}</p>}

                    <button
                      type="submit"
                      disabled={reclamer.isPending}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#007DFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00263C] disabled:opacity-60"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {reclamer.isPending ? 'Rattachement…' : 'Rattacher à mon compte'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Lien valable 30 jours, à usage unique. En cas de doute, contactez le cabinet médical.
        </p>
      </div>
    </main>
  )
}
