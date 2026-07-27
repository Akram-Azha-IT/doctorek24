import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Avatar, initialsFromName, hueFromName } from './Avatar'

describe('initialsFromName', () => {
  test('prend la première et la dernière initiale', () => {
    expect(initialsFromName('Akram Benhammou')).toBe('AB')
    expect(initialsFromName('Jean Pierre Dupont')).toBe('JD')
  })

  test('se rabat sur deux lettres pour un mot unique', () => {
    expect(initialsFromName('Akram')).toBe('AK')
  })

  test('reste lisible sur une entrée vide', () => {
    expect(initialsFromName('   ')).toBe('?')
  })
})

describe('hueFromName', () => {
  test('donne une teinte stable et bornée', () => {
    const h = hueFromName('Akram Benhammou')
    expect(h).toBe(hueFromName('Akram Benhammou'))
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(360)
  })

  test('distingue deux personnes', () => {
    expect(hueFromName('Akram Ben')).not.toBe(hueFromName('Momo Mimo'))
  })
})

describe('Avatar', () => {
  test('affiche la photo quand elle est fournie', () => {
    render(<Avatar name="Akram Ben" photoUrl="https://cdn/photo.jpg" />)
    expect(screen.getByRole('img', { name: 'Akram Ben' })).toHaveAttribute('src', 'https://cdn/photo.jpg')
  })

  test('affiche les initiales sans photo', () => {
    render(<Avatar name="Akram Ben" />)
    expect(screen.getByText('AB')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  test('retombe sur les initiales si la photo ne charge pas', () => {
    render(<Avatar name="Akram Ben" photoUrl="https://cdn/mort.jpg" />)
    fireEvent.error(screen.getByRole('img', { name: 'Akram Ben' }))

    expect(screen.getByText('AB')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
