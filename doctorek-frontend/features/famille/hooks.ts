import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addProche, deleteProche, getProches, updateProche } from './api'
import type { ProcheFormValues } from './schemas'

export function useProches(enabled = true) {
  return useQuery({
    queryKey: ['proches'],
    queryFn: getProches,
    enabled,
  })
}

export function useAddProche() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProcheFormValues) => addProche(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proches'] })
    },
  })
}

export function useUpdateProche() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ procheId, payload }: { procheId: string; payload: ProcheFormValues }) =>
      updateProche(procheId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proches'] })
    },
  })
}

export function useDeleteProche() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (procheId: string) => deleteProche(procheId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proches'] })
    },
  })
}
