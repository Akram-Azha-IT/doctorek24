import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'

const EMAIL = 'akram@azhar-cons.com'

function setup(overrides: Partial<Parameters<typeof ConfirmDeleteModal>[0]> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDeleteModal
      open
      userName="Akram Ben"
      email={EMAIL}
      isPending={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  )
  return { onConfirm, onCancel }
}

const deleteButton = () => screen.getByRole('button', { name: /^supprimer$/i })

describe('ConfirmDeleteModal', () => {
  beforeEach(() => vi.clearAllMocks())

  test('ne rend rien quand il est fermé', () => {
    setup({ open: false })
    expect(screen.queryByText(/supprimer le compte/i)).not.toBeInTheDocument()
  })

  test('annonce que la suppression est irréversible', () => {
    setup()
    expect(screen.getByText(/supprimer le compte/i)).toBeInTheDocument()
    expect(screen.getByText(/irréversible/i)).toBeInTheDocument()
    expect(screen.getByText('Akram Ben')).toBeInTheDocument()
  })

  test('garde la suppression désarmée tant que l’email n’est pas exact', () => {
    const { onConfirm } = setup()
    expect(deleteButton()).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/retapez l.email/i), { target: { value: 'autre@x.ma' } })

    expect(deleteButton()).toBeDisabled()
    fireEvent.click(deleteButton())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  test('arme la suppression sur l’email exact, à la casse près', () => {
    const { onConfirm } = setup()

    fireEvent.change(screen.getByLabelText(/retapez l.email/i), {
      target: { value: '  AKRAM@AZHAR-CONS.COM  ' },
    })

    expect(deleteButton()).toBeEnabled()
    fireEvent.click(deleteButton())
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  test('annule et vide la saisie', () => {
    const { onCancel } = setup()
    fireEvent.change(screen.getByLabelText(/retapez l.email/i), { target: { value: EMAIL } })

    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  test('verrouille les actions pendant la suppression', () => {
    setup({ isPending: true })
    fireEvent.change(screen.getByLabelText(/retapez l.email/i), { target: { value: EMAIL } })

    expect(screen.getByRole('button', { name: /suppression/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /annuler/i })).toBeDisabled()
  })
})
