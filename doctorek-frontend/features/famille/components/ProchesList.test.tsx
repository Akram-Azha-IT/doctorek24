import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import type { Proche } from '@/lib/types'
import { ProchesList } from './ProchesList'

const self: Proche = {
  id: 'akram',
  nom: 'Ben',
  prenom: 'Akram',
  dateNaissance: null,
  email: 'akram@example.com',
  mineur: false,
  self: true,
  role: null,
  declarationRepresentantLegal: null,
}

const managed: Proche = {
  id: 'yasser',
  nom: 'Salim',
  prenom: 'Yasser',
  dateNaissance: '2000-07-25',
  email: 'yasser@example.com',
  mineur: false,
  self: false,
  role: 'AIDANT',
  declarationRepresentantLegal: true,
}

function StatefulList({ onEdit = vi.fn(), onRemove = vi.fn() }) {
  const [selectedId, setSelectedId] = useState(managed.id)
  return (
    <ProchesList
      proches={[self, managed]}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onEdit={onEdit}
      onRemove={onRemove}
      isRemoving={false}
    />
  )
}

describe('ProchesList', () => {
  test('affiche le proche actif et ses actions principales', () => {
    render(<StatefulList />)

    expect(screen.getByRole('heading', { name: 'Yasser Salim' })).toBeInTheDocument()
    expect(screen.getByText('Que souhaitez-vous faire pour Yasser ?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Prendre rendez-vous/ })).toHaveAttribute('href', '/recherche')
    expect(screen.getByRole('link', { name: /Voir ses rendez-vous/ })).toHaveAttribute(
      'href',
      '/dashboard/patient/rdvs',
    )
  })

  test('permet de sélectionner le profil titulaire', () => {
    render(<StatefulList />)

    fireEvent.click(screen.getByRole('tab', { name: /Akram Ben/ }))

    expect(screen.getByRole('heading', { name: 'Akram Ben' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Modifier mes informations/ })).toHaveAttribute(
      'href',
      '/dashboard/patient/compte',
    )
  })

  test('garde le retrait dans le menu secondaire', () => {
    const onRemove = vi.fn()
    render(<StatefulList onRemove={onRemove} />)

    fireEvent.click(screen.getByRole('button', { name: 'Actions pour Yasser Salim' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Retirer ce proche' }))

    expect(onRemove).toHaveBeenCalledWith(managed)
  })

  test('ouvre la modification du proche actif', () => {
    const onEdit = vi.fn()
    render(<StatefulList onEdit={onEdit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Modifier ses informations' }))

    expect(onEdit).toHaveBeenCalledWith(managed)
  })
})
