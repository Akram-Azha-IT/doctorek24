'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRoleGuard } from '@/lib/useRoleGuard'
import type { Proche } from '@/lib/types'
import { useAddProche, useDeleteProche, useProches, useUpdateProche } from '@/features/famille/hooks'
import type { ProcheFormValues } from '@/features/famille/schemas'
import { ProcheForm } from '@/features/famille/components/ProcheForm'
import { ProchesList } from '@/features/famille/components/ProchesList'

export default function ProchesPage() {
  useRoleGuard('PATIENT')

  const { data: proches, isLoading, isError } = useProches()
  const addProche = useAddProche()
  const updateProche = useUpdateProche()
  const deleteProche = useDeleteProche()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Proche | null>(null)
  const [selectedId, setSelectedId] = useState('')

  const profils = proches ?? []
  const defaultSelectedId = profils.find((profil) => !profil.self)?.id ?? profils[0]?.id ?? ''
  const activeId = profils.some((profil) => profil.id === selectedId) ? selectedId : defaultSelectedId

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(proche: Proche) {
    if (proche.self) return
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
          onError: (error) => toast.error(error.message || 'Erreur lors de la modification'),
        },
      )
      return
    }

    addProche.mutate(values, {
      onSuccess: (proche) => {
        toast.success(`${proche.prenom} a été ajouté à vos proches`)
        setSelectedId(proche.id)
        closeForm()
      },
      onError: (error) => toast.error(error.message || "Erreur lors de l'ajout du proche"),
    })
  }

  function handleRemove(proche: Proche) {
    const confirmation = window.confirm(
      `Retirer ${proche.prenom} ${proche.nom} de vos proches ? Son dossier médical est conservé.`,
    )
    if (!confirmation) return

    deleteProche.mutate(proche.id, {
      onSuccess: () => {
        toast.success('Proche retiré')
        setSelectedId('')
      },
      onError: (error) => toast.error(error.message || 'Erreur lors du retrait'),
    })
  }

  return (
    <main className="mx-auto w-full max-w-[1160px] px-4 pb-32 pt-5 sm:px-6 sm:pt-8 lg:px-8 lg:pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
        <div>
          <h1 className="font-heading text-[28px] font-bold leading-tight tracking-[-0.035em] text-[#010C2D] sm:text-[38px]">
            Mes proches
          </h1>
          <p className="mt-1.5 max-w-2xl text-base leading-6 text-[#52627A] sm:mt-2">
            Gérez les rendez-vous de votre famille.
          </p>
        </div>

        {!formOpen && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex min-h-12 w-full shrink-0 touch-manipulation items-center justify-center gap-2 rounded-xl bg-[#007DFF] px-5 text-base font-bold text-white shadow-[0_6px_16px_rgba(0,125,255,0.18)] transition-colors hover:bg-[#0069D7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/35 focus-visible:ring-offset-2 sm:w-auto sm:text-sm"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            Ajouter un proche
          </button>
        )}
      </header>

      {formOpen && (
        <section className="mt-5 overflow-hidden rounded-2xl border border-[#D7E0EC] bg-white shadow-[0_8px_24px_rgba(1,38,60,0.05)] sm:mt-6 sm:rounded-[20px]">
          <div className="flex items-start justify-between gap-3 border-b border-[#E5EAF1] px-4 py-4 sm:items-center sm:px-6">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#010C2D]">
                {editing ? `Modifier ${editing.prenom} ${editing.nom}` : 'Ajouter un proche'}
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Renseignez uniquement les informations nécessaires à sa prise en charge.
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Fermer le formulaire"
              className="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl text-[#64748B] transition-colors hover:bg-[#F1F6FD] hover:text-[#010C2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/35"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="px-4 py-5 sm:px-6">
            <ProcheForm
              proche={editing ?? undefined}
              isPending={addProche.isPending || updateProche.isPending}
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          </div>
        </section>
      )}

      {isLoading && <ProchesSkeleton />}

      {isError && (
        <div className="mt-7 rounded-2xl border border-[#F3C7CB] bg-[#FFF5F6] px-5 py-4 text-sm text-[#B4232D]">
          Impossible de charger vos proches. Réessayez dans quelques instants.
        </div>
      )}

      {!isLoading && !isError && profils.length > 0 && (
        <ProchesList
          proches={profils}
          selectedId={activeId}
          onSelect={setSelectedId}
          onEdit={openEdit}
          onRemove={handleRemove}
          isRemoving={deleteProche.isPending}
        />
      )}

      {!isLoading && !isError && profils.length === 0 && (
        <section className="mt-7 rounded-[20px] border border-dashed border-[#B9CCE2] bg-white px-6 py-12 text-center">
          <h2 className="font-heading text-xl font-bold text-[#010C2D]">Votre espace famille est prêt</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#52627A]">
            Ajoutez un enfant, un parent ou une personne dont vous gérez les rendez-vous.
          </p>
          {!formOpen && (
            <button
              type="button"
              onClick={openAdd}
              className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#007DFF] px-5 text-sm font-bold text-white transition-colors hover:bg-[#0069D7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/35"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              Ajouter mon premier proche
            </button>
          )}
        </section>
      )}
    </main>
  )
}

function ProchesSkeleton() {
  return (
    <div className="mt-5 space-y-4 sm:mt-7 sm:space-y-5" aria-label="Chargement des proches">
      <div className="-mx-4 flex gap-2 overflow-hidden px-4 sm:mx-0 sm:grid sm:max-w-[780px] sm:grid-cols-2 sm:gap-4 sm:px-0 lg:grid-cols-3">
        <div className="h-[72px] animate-pulse rounded-xl border border-[#D7E0EC] bg-white sm:h-[88px] sm:rounded-2xl" />
        <div className="h-[72px] animate-pulse rounded-xl border border-[#D7E0EC] bg-white sm:h-[88px] sm:rounded-2xl" />
        <div className="h-[72px] w-[148px] shrink-0 animate-pulse rounded-xl border border-[#D7E0EC] bg-white sm:h-[88px] sm:w-auto sm:rounded-2xl" />
      </div>
      <div className="h-[430px] animate-pulse rounded-2xl border border-[#D7E0EC] bg-white sm:h-[390px] sm:rounded-[20px]" />
    </div>
  )
}
