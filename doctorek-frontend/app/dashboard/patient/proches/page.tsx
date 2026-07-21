'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, X, Users, UserRound, Mail, BellRing } from 'lucide-react'
import { useRoleGuard } from '@/lib/useRoleGuard'
import type { Proche } from '@/lib/types'
import { useAddProche, useDeleteProche, useProches, useUpdateProche } from '@/features/famille/hooks'
import type { ProcheFormValues } from '@/features/famille/schemas'
import { ProcheForm } from '@/features/famille/components/ProcheForm'
import { ProchesList } from '@/features/famille/components/ProchesList'
import { ProcheAvatar } from '@/features/famille/components/ProcheAvatar'
import { MoroccanPattern } from '@/features/famille/components/MoroccanPattern'

export default function ProchesPage() {
  useRoleGuard('PATIENT')

  const { data: proches, isLoading, isError } = useProches()
  const addProche = useAddProche()
  const updateProche = useUpdateProche()
  const deleteProche = useDeleteProche()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Proche | null>(null)

  const self = useMemo(() => proches?.find((p) => p.self) ?? null, [proches])
  const managed = useMemo(() => proches?.filter((p) => !p.self) ?? [], [proches])

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(proche: Proche) {
    setEditing(proche)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  function handleSubmit(values: ProcheFormValues) {
    if (editing) {
      updateProche.mutate(
        { procheId: editing.id, payload: values },
        {
          onSuccess: () => {
            toast.success('Proche modifié')
            closeForm()
          },
          onError: (err) => toast.error(err.message || 'Erreur lors de la modification'),
        },
      )
    } else {
      addProche.mutate(values, {
        onSuccess: (proche) => {
          toast.success(`${proche.prenom} a été ajouté à vos proches`)
          closeForm()
        },
        onError: (err) => toast.error(err.message || "Erreur lors de l'ajout du proche"),
      })
    }
  }

  function handleRemove(proche: Proche) {
    if (!window.confirm(`Retirer ${proche.prenom} ${proche.nom} de vos proches ? Son dossier médical est conservé.`)) {
      return
    }
    deleteProche.mutate(proche.id, {
      onSuccess: () => toast.success('Proche retiré'),
      onError: (err) => toast.error(err.message || 'Erreur lors du retrait'),
    })
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      {/* ── En-tête : identité famille, zellige marocain en filigrane ── */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#007DFF] to-[#0A5CBF] px-6 py-7 sm:px-8">
        <MoroccanPattern className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              <Users className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-semibold text-white">
                {managed.length === 0
                  ? 'Compte personnel'
                  : `${managed.length} proche${managed.length > 1 ? 's' : ''} géré${managed.length > 1 ? 's' : ''}`}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-[28px]">Ma famille</h1>
            <p className="mt-1 max-w-md text-sm text-white/80">
              Gérez les profils de vos proches et prenez rendez-vous en leur nom, en toute simplicité.
            </p>
          </div>
          {!formOpen && (
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#10A56A] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0C8355] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Ajouter un proche
            </button>
          )}
        </div>
      </header>

      {/* ── Formulaire (ajout / édition) ── */}
      {formOpen && (
        <div className="mt-5 rounded-2xl border border-[#EDF1F5] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-[#010C2D]">
              {editing ? `Modifier ${editing.prenom} ${editing.nom}` : 'Nouveau proche'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Fermer le formulaire"
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ProcheForm
            proche={editing ?? undefined}
            isPending={addProche.isPending || updateProche.isPending}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-[#EDF1F5] bg-white shadow-sm" />
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-600">
          Impossible de charger vos proches.
        </p>
      )}

      {/* ── Carte titulaire ── */}
      {!isLoading && self && (
        <section className="mt-6">
          <h2 className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Mon profil
          </h2>
          <div className="flex items-center gap-4 rounded-2xl border-l-4 border-[#10A56A] border-y border-r border-y-[#EDF1F5] border-r-[#EDF1F5] bg-white p-5 shadow-sm">
            <ProcheAvatar firstName={self.prenom} lastName={self.nom} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-[15px] font-bold text-[#010C2D]">
                  {self.prenom} {self.nom}
                </p>
                <span className="rounded-full bg-[#010C2D] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  Vous
                </span>
              </div>
              <p className="mt-1 flex items-center gap-2 truncate text-[13px] text-[#465058]">
                {self.email ? (
                  <>
                    <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="truncate">{self.email}</span>
                  </>
                ) : (
                  <>
                    <UserRound className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    Titulaire du compte
                  </>
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Proches gérés / état vide ── */}
      {!isLoading && !isError && (
        <section className="mt-6">
          <h2 className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Proches gérés
          </h2>

          {managed.length > 0 ? (
            <ProchesList
              proches={managed}
              onEdit={openEdit}
              onRemove={handleRemove}
              isRemoving={deleteProche.isPending}
            />
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#CBD9E8] bg-[#F7FAFD] px-6 py-12 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DFEFFE]">
                <Users className="h-6 w-6 text-[#007DFF]" />
              </span>
              <p className="text-[15px] font-semibold text-[#010C2D]">Aucun proche pour le moment</p>
              <p className="mt-1 max-w-xs text-sm text-[#465058]">
                Ajoutez un enfant, un parent ou toute personne dont vous gérez les rendez-vous.
              </p>
              {!formOpen && (
                <button
                  type="button"
                  onClick={openAdd}
                  className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#10A56A] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0C8355] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10A56A]/40 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter mon premier proche
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Note discrète : rappel de la portée légale */}
      {!isLoading && managed.length > 0 && (
        <p className="mt-5 flex items-start gap-2 px-1 text-xs text-zinc-400">
          <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Les proches majeurs disposant de leur propre email reçoivent leurs notifications
          directement ; pour les mineurs, c&apos;est vous qui les recevez.
        </p>
      )}
    </div>
  )
}
