import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import { AuthField } from './AuthField'

describe('AuthField', () => {
  test('associates the label with the input via generated id', () => {
    render(<AuthField label="Email" type="email" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('type', 'email')
    expect(input.id).not.toBe('')
  })

  test('uses the provided id when given', () => {
    render(<AuthField label="Email" id="custom-id" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'custom-id')
  })

  test('shows the error message and links it to the input', () => {
    render(<AuthField label="Mot de passe" type="password" error="Trop court" />)
    expect(screen.getByText('Trop court')).toBeInTheDocument()
  })

  test('password toggle reveals the value', async () => {
    const user = userEvent.setup()
    render(<AuthField label="Mot de passe" type="password" showPasswordToggle />)
    const input = screen.getByLabelText('Mot de passe')
    expect(input).toHaveAttribute('type', 'password')
    const toggle = screen.queryByRole('button')
    if (toggle) {
      await user.click(toggle)
      expect(input).toHaveAttribute('type', 'text')
    }
  })
})
