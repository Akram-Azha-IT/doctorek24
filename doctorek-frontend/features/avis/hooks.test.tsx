import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { StatutAvis } from '@/lib/types'
import {
  useAvisMedecin,
  useCreerAvis,
  useFileModeration,
  useModererAvis,
  useNotesMedecins,
  useRdvsNotables,
  useSignalerAvis,
} from './hooks'
import type { CreerAvisPayload } from './api'

const getNotesMedecins = vi.fn()
const getRdvsNotables = vi.fn()
const getAvisMedecin = vi.fn()
const getFileModeration = vi.fn()
const creerAvis = vi.fn()
const signalerAvis = vi.fn()
const modererAvis = vi.fn()

vi.mock('./api', () => ({
  getNotesMedecins: (ids: string[]) => getNotesMedecins(ids),
  getRdvsNotables: (ids: string[]) => getRdvsNotables(ids),
  getAvisMedecin: (id: string, page: number) => getAvisMedecin(id, page),
  getFileModeration: (page: number) => getFileModeration(page),
  creerAvis: (payload: CreerAvisPayload) => creerAvis(payload),
  signalerAvis: (avisId: string, motif?: string) => signalerAvis(avisId, motif),
  modererAvis: (avisId: string, statut: StatutAvis) => modererAvis(avisId, statut),
}))

let client: QueryClient

function wrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
})

describe('useNotesMedecins', () => {
  beforeEach(() => {
    getNotesMedecins.mockReset()
    getNotesMedecins.mockResolvedValue([
      { medecinId: 'm2', noteMoyenne: 4.5, nombreAvis: 12 },
    ])
  })

  test('range les notes par médecin pour une lecture directe par carte', async () => {
    const { result } = renderHook(() => useNotesMedecins(['m1', 'm2']), { wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.get('m2')?.noteMoyenne).toBe(4.5)
    // Un médecin sans avis reste absent : la carte n'affiche alors aucune note.
    expect(result.current.data?.get('m1')).toBeUndefined()
  })

  test('ne demande rien quand la page ne contient aucun médecin', () => {
    renderHook(() => useNotesMedecins([]), { wrapper })

    expect(getNotesMedecins).not.toHaveBeenCalled()
  })

  test('un même médecin affiché deux fois n’est demandé qu’une fois', async () => {
    renderHook(() => useNotesMedecins(['m2', 'm2', 'm1']), { wrapper })

    await waitFor(() => expect(getNotesMedecins).toHaveBeenCalled())
    expect(getNotesMedecins).toHaveBeenCalledWith(['m1', 'm2'])
  })
})

describe('useRdvsNotables', () => {
  beforeEach(() => {
    getRdvsNotables.mockReset()
    getRdvsNotables.mockResolvedValue(['rdv-1'])
  })

  test('renvoie les rendez-vous encore notables', async () => {
    const { result } = renderHook(() => useRdvsNotables(['rdv-1', 'rdv-2']), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(['rdv-1']))
    expect(getRdvsNotables).toHaveBeenCalledWith(['rdv-1', 'rdv-2'])
  })

  test('ne questionne pas le serveur sans rendez-vous terminé', () => {
    renderHook(() => useRdvsNotables([]), { wrapper })

    expect(getRdvsNotables).not.toHaveBeenCalled()
  })
})

describe('useAvisMedecin', () => {
  beforeEach(() => {
    getAvisMedecin.mockReset()
    getAvisMedecin.mockResolvedValue({ content: [], nombreAvis: 0 })
  })

  test('demande la page courante des avis du médecin', async () => {
    const { result } = renderHook(() => useAvisMedecin('med-1', 2), { wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(getAvisMedecin).toHaveBeenCalledWith('med-1', 2)
  })

  test('attend de connaître le médecin avant d’interroger le serveur', () => {
    renderHook(() => useAvisMedecin('', 1), { wrapper })

    expect(getAvisMedecin).not.toHaveBeenCalled()
  })
})

describe('mutations', () => {
  beforeEach(() => {
    creerAvis.mockReset().mockResolvedValue({ id: 'avis-1' })
    signalerAvis.mockReset().mockResolvedValue(undefined)
    modererAvis.mockReset().mockResolvedValue({ id: 'avis-1' })
    getFileModeration.mockReset().mockResolvedValue({ content: [] })
  })

  test('un avis déposé périme la page d’avis du médecin et les rendez-vous notables', async () => {
    // Sans cela, la moyenne affichée et le bouton « Donner mon avis » resteraient
    // ceux d'avant le dépôt.
    const invalider = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useCreerAvis('med-1'), { wrapper })

    result.current.mutate({ rdvId: 'rdv-1', note: 5, commentaire: null, anonyme: false })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(creerAvis).toHaveBeenCalledWith(
      { rdvId: 'rdv-1', note: 5, commentaire: null, anonyme: false },
    )
    expect(invalider).toHaveBeenCalledWith({ queryKey: ['avis', 'medecin', 'med-1'] })
    expect(invalider).toHaveBeenCalledWith({ queryKey: ['avis', 'notables'] })
  })

  test('un signalement transmet le motif et périme la file de modération', async () => {
    const invalider = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useSignalerAvis('med-1'), { wrapper })

    result.current.mutate({ avisId: 'avis-1', motif: 'Propos injurieux' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(signalerAvis).toHaveBeenCalledWith('avis-1', 'Propos injurieux')
    expect(invalider).toHaveBeenCalledWith({ queryKey: ['avis', 'moderation'] })
  })

  test('un signalement hors profil médecin ne périme pas une page inconnue', async () => {
    const invalider = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useSignalerAvis(), { wrapper })

    result.current.mutate({ avisId: 'avis-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalider).toHaveBeenCalledTimes(1)
    expect(invalider).toHaveBeenCalledWith({ queryKey: ['avis', 'moderation'] })
  })

  test('la décision de modération périme tout ce qui affiche des avis', async () => {
    const invalider = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useModererAvis(), { wrapper })

    result.current.mutate({ avisId: 'avis-1', statut: 'MASQUE' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(modererAvis).toHaveBeenCalledWith('avis-1', 'MASQUE')
    expect(invalider).toHaveBeenCalledWith({ queryKey: ['avis'] })
  })

  test('la file de modération est demandée page par page', async () => {
    const { result } = renderHook(() => useFileModeration(3), { wrapper })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(getFileModeration).toHaveBeenCalledWith(3)
  })
})
