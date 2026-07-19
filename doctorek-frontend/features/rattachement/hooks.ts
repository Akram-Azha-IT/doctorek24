import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRattachementInfo, reclamerRattachement, type ReclamerRattachementPayload } from './api'

export function useRattachementInfo(token: string) {
  return useQuery({
    queryKey: ['rattachement', token],
    queryFn: () => getRattachementInfo(token),
    enabled: !!token,
    retry: false,
  })
}

export function useReclamerRattachement(token: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReclamerRattachementPayload) => reclamerRattachement(token, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proches'] })
    },
  })
}
